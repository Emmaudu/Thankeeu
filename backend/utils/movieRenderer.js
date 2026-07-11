/**
 * movieRenderer.js — Thankeeu Memory Movie™ engine
 *
 * Builds a 1080p MP4 from a card's messages, photos, videos and voice notes
 * using only FFmpeg — no AI video APIs, no expensive third-party services.
 *
 * Pipeline:
 *   1. Download all assets (cover image, message photos, videos, voice notes)
 *   2. Build a drawtext/overlay filter graph
 *   3. Assemble timeline segments with transitions
 *   4. Mix background music + voice notes
 *   5. Encode to H.264/AAC MP4 at 1080p
 *   6. Upload to Cloudinary
 *   7. Return { movie_url, thumbnail_url, duration_secs, file_size_bytes }
 */

'use strict';

const path    = require('path');
const fs      = require('fs');
const os      = require('os');
const https   = require('https');
const http    = require('http');
const { execFile, execFileSync } = require('child_process');
const { promisify }  = require('util');
const execFileAsync  = promisify(execFile);
const cloudinary     = require('./cloudinary').cloudinary;

// ── Constants ─────────────────────────────────────────────────────────────────
const W = 1920, H = 1080;
const FPS = 30;
const SLIDE_DUR   = 4;    // seconds each photo/message slide
const TRANSITION  = 1;    // cross-fade duration seconds
const MAX_ASSETS  = 40;   // cap assets for render time safety
const MAX_CONTENT_CHARS = 180; // truncate long messages for readability

// Background music: a royalty-free track bundled as a URL
// Using a free loopable ambient track from the Pixabay CDN
const BG_MUSIC_URL = process.env.MOVIE_BG_MUSIC_URL
  || 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_1e9fce5ab4.mp3';

// ── Font resolution ───────────────────────────────────────────────────────────
// FFmpeg drawtext fails hard ("Cannot find a valid font") on minimal containers
// with no fontconfig default. Resolve a real .ttf path once at load time and
// pass it explicitly to every drawtext call. Falls back to null (let fontconfig
// try) only if nothing is found.
function resolveFontFile() {
  const candidates = [
    process.env.MOVIE_FONT_FILE,
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf', // macOS dev
  ];
  for (const c of candidates) {
    try { if (c && fs.existsSync(c)) return c; } catch { /* ignore */ }
  }
  return null;
}
const FONT_FILE = resolveFontFile();
// Build the "fontfile='...':" fragment (empty string if none found).
const FONT_FRAG = FONT_FILE ? `fontfile='${FONT_FILE.replace(/'/g, "\\'")}':` : '';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Download a URL to a local temp file. Returns the local path.
 */
function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file  = fs.createWriteStream(destPath);
    proto.get(url, res => {
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`Download failed: ${res.statusCode} ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', err => { file.close(); reject(err); });
  });
}

/** Escape text for FFmpeg drawtext. Also strips emoji/symbols that the render
 *  font (DejaVu/Liberation) cannot draw — they'd otherwise appear as boxes. */
const escFF = s => String(s)
  // Remove emoji & pictographic symbol ranges (no glyphs in standard TTFs)
  .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
  .replace(/\s{2,}/g, ' ')
  .trim()
  .replace(/\\/g, '\\\\')
  .replace(/'/g, "\\'")
  .replace(/:/g, '\\:')
  .replace(/\[/g, '\\[')
  .replace(/\]/g, '\\]');

/** Wrap text to ~N chars per line */
function wrapText(text, maxChars = 38) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur.trim());
  return lines.join('\n');
}

/** Generate a solid colour PNG using FFmpeg (used for title/message slides) */
async function makeColourSlide(colour, outPath) {
  await execFileAsync('ffmpeg', [
    '-y', '-f', 'lavfi',
    '-i', `color=c=${colour}:s=${W}x${H}:r=${FPS}:d=${SLIDE_DUR + TRANSITION}`,
    '-vframes', '1',
    outPath,
  ]);
}

// ── Main renderer ─────────────────────────────────────────────────────────────

/**
 * @param {object} card    — card row from DB (id, title, recipient_name, occasion, cover_image)
 * @param {Array}  msgs    — message rows (author_name, content, media_url, media_type)
 * @returns {object}       — { movie_url, thumbnail_url, duration_secs, file_size_bytes, public_id }
 */
async function renderMovie(card, msgs) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thankeeu-movie-'));

  try {
    // ── 0. Fetch wall posts and merge with messages ───────────────────────────
    try {
      const supabase = require('./supabase');
      const { data: wallPosts } = await supabase
        .from('wall_posts')
        .select('id, author_name, caption, media_url, media_type, created_at')
        .eq('card_id', card.id)
        .eq('is_moderated', false)
        .order('created_at', { ascending: true });

      if (wallPosts?.length) {
        // Convert wall posts to message-like objects and merge
        const wallAsMessages = wallPosts.map(wp => ({
          author_name: wp.author_name,
          content:     wp.caption || null,
          media_url:   wp.media_url,
          media_type:  wp.media_type,
        }));
        msgs = [...msgs, ...wallAsMessages];
      }
    } catch (e) { /* non-fatal — wall posts are additive */ }

    // ── 1. Collect assets ─────────────────────────────────────────────────────
    const photoMsgs  = msgs.filter(m => m.media_type === 'image' && m.media_url).slice(0, MAX_ASSETS);
    const videoMsgs  = msgs.filter(m => m.media_type === 'video' && m.media_url).slice(0, 8);
    const voiceMsgs  = msgs.filter(m => m.media_type === 'voice' && m.media_url).slice(0, 12);
    const textMsgs   = msgs.filter(m => m.content?.trim()).slice(0, 20);

    // ── 2. Download cover image ───────────────────────────────────────────────
    let coverPath = null;
    if (card.cover_image) {
      try {
        coverPath = path.join(tmpDir, 'cover.jpg');
        await download(card.cover_image, coverPath);
      } catch { coverPath = null; }
    }

    // ── 3. Download photo assets ──────────────────────────────────────────────
    const photoPaths = [];
    for (let i = 0; i < photoMsgs.length; i++) {
      try {
        const ext  = photoMsgs[i].media_url.includes('.png') ? 'png' : 'jpg';
        const dest = path.join(tmpDir, `photo_${i}.${ext}`);
        await download(photoMsgs[i].media_url, dest);
        photoPaths.push({ path: dest, author: photoMsgs[i].author_name });
      } catch { /* skip failed downloads */ }
    }

    // ── 4. Download video assets ──────────────────────────────────────────────
    const videoPaths = [];
    for (let i = 0; i < videoMsgs.length; i++) {
      try {
        const dest = path.join(tmpDir, `video_${i}.mp4`);
        await download(videoMsgs[i].media_url, dest);
        videoPaths.push({ path: dest, author: videoMsgs[i].author_name });
      } catch { /* skip */ }
    }

    // ── 5. Download voice notes and normalize each to uniform WAV ─────────────
    // Browser MediaRecorder produces webm/ogg/m4a with varying codecs/sample
    // rates. Concatenating those directly fails. Re-encode each to a uniform
    // 44.1kHz stereo WAV so they can be safely concatenated.
    const voicePaths = [];
    for (let i = 0; i < voiceMsgs.length; i++) {
      try {
        const raw  = path.join(tmpDir, `voice_raw_${i}`);
        await download(voiceMsgs[i].media_url, raw);
        const norm = path.join(tmpDir, `voice_${i}.wav`);
        await execFileAsync('ffmpeg', [
          '-y', '-i', raw,
          '-ac', '2', '-ar', '44100',
          '-c:a', 'pcm_s16le',
          norm,
        ], { timeout: 30000 });
        voicePaths.push({ path: norm, author: voiceMsgs[i].author_name });
      } catch { /* skip unreadable voice notes */ }
    }

    // ── 6. Download background music ─────────────────────────────────────────
    let bgMusicPath = null;
    try {
      bgMusicPath = path.join(tmpDir, 'bgmusic.mp3');
      await download(BG_MUSIC_URL, bgMusicPath);
    } catch { bgMusicPath = null; }

    // ── 7. Build segment list ─────────────────────────────────────────────────
    // Each segment is a local file path + type + author + optional text overlay
    const segments = [];

    // Opening title slide
    const titleSlidePath = path.join(tmpDir, 'title_slide.png');
    await makeColourSlide('0x1a0533', titleSlidePath); // deep purple
    segments.push({ type: 'image', path: titleSlidePath, isTitle: true,
      lines: [
        card.occasion ? card.occasion.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Happy Celebration',
        card.recipient_name,
      ],
    });

    // Cover image (if available)
    if (coverPath) {
      segments.push({ type: 'image', path: coverPath, isTitle: false, lines: [] });
    }

    // Message text slides (first 8 messages as visual cards)
    for (const m of textMsgs.slice(0, 8)) {
      const slidePath = path.join(tmpDir, `msg_slide_${segments.length}.png`);
      await makeColourSlide('0x2d1052', slidePath);
      const wrapped = wrapText(m.content.slice(0, MAX_CONTENT_CHARS));
      segments.push({ type: 'image', path: slidePath, isTitle: false,
        lines: [wrapped, `— ${m.author_name}`],
        isMessage: true,
      });
    }

    // Photo slides
    for (const p of photoPaths) {
      segments.push({ type: 'image', path: p.path, isTitle: false,
        lines: p.author ? [`Photo by ${p.author}`] : [],
      });
    }

    // Video clips (trimmed to 8s each)
    for (const v of videoPaths) {
      segments.push({ type: 'video', path: v.path, isTitle: false,
        lines: v.author ? [`Video by ${v.author}`] : [],
      });
    }

    // Signatures slide
    const sigNames = [...new Set(msgs.map(m => m.author_name).filter(Boolean))].slice(0, 20);
    const sigSlidePath = path.join(tmpDir, 'sig_slide.png');
    await makeColourSlide('0x1a0533', sigSlidePath);
    segments.push({ type: 'image', path: sigSlidePath, isTitle: false,
      lines: ['Signed with love by', sigNames.join('  ·  ')],
      isSignature: true,
    });

    // Closing slide
    const closingSlidePath = path.join(tmpDir, 'closing_slide.png');
    await makeColourSlide('0x0d0020', closingSlidePath);
    segments.push({ type: 'image', path: closingSlidePath, isTitle: true,
      lines: ['Made with love by', 'everyone who cares about you', '— Thankeeu'],
    });

    // ── 8. Render each segment to a fixed-duration video chunk ───────────────
    const chunkPaths = [];

    for (let i = 0; i < segments.length; i++) {
      const seg     = segments[i];
      const outPath = path.join(tmpDir, `chunk_${i}.mp4`);

      if (seg.type === 'video') {
        // Trim video to 8s, scale to 1920x1080, add name overlay.
        // Add a silent audio source and map it as a fallback so EVERY chunk
        // has exactly one video + one audio stream — required for the concat
        // demuxer to join image slides (silent) and video clips without
        // stream-layout mismatch corruption.
        const nameFilter = seg.lines[0]
          ? `,drawtext=${FONT_FRAG}text='${escFF(seg.lines[0])}':fontsize=42:fontcolor=white:x=(w-text_w)/2:y=h-80:shadowcolor=black:shadowx=2:shadowy=2`
          : '';
        // Add a silent stereo source; amerge is avoided. We always take the
        // silent track's timing but mix in the clip audio if it exists using
        // amix with a silent floor, guaranteeing exactly one audio stream.
        await execFileAsync('ffmpeg', [
          '-y',
          '-i', seg.path,
          '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
          '-t', '8',
          '-filter_complex',
            `[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black${nameFilter}[v];` +
            `[1:a]atrim=0:8[sil];` +
            `[0:a]anull[ca];` +
            `[ca][sil]amix=inputs=2:duration=first:dropout_transition=0[a]`,
          '-map', '[v]', '-map', '[a]',
          '-c:v', 'libx264', '-preset', 'fast', '-crf', '28',
          '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100',
          '-r', String(FPS),
          '-pix_fmt', 'yuv420p',
          outPath,
        ], { timeout: 60000 }).catch(async () => {
          // Fallback: clip has no audio stream at all — use silent source only.
          await execFileAsync('ffmpeg', [
            '-y',
            '-i', seg.path,
            '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
            '-t', '8',
            '-vf', `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black${nameFilter}`,
            '-map', '0:v:0', '-map', '1:a:0',
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '28',
            '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100',
            '-r', String(FPS), '-pix_fmt', 'yuv420p', '-shortest',
            outPath,
          ], { timeout: 60000 });
        });
      } else {
        // Image slide: pan/zoom + text overlays
        const textFilters = seg.lines.flatMap((line, li) => {
          if (!line?.trim()) return [];
          const fontSize = li === 0 ? (seg.isTitle ? 80 : seg.isMessage ? 52 : 60) : (seg.isTitle ? 54 : 38);
          const yPos = seg.isTitle
            ? `(h/2)${li === 0 ? '-60' : '+40'}`
            : seg.isMessage
              ? (li === 0 ? 'h*0.25' : 'h*0.72')
              : `h-${180 - li * 60}`;
          const col  = li === 0 && seg.isTitle ? 'FFD700' : (li === 1 && !seg.isTitle ? 'BBBBBB' : 'FFFFFF');
          return [
            `drawtext=${FONT_FRAG}text='${escFF(line)}':fontsize=${fontSize}:fontcolor=#${col}:x=(w-text_w)/2:y=${yPos}:shadowcolor=black:shadowx=3:shadowy=3:line_spacing=12`,
          ];
        });

        const vfParts = [
          // Ken Burns pan/zoom
          `scale=${W * 1.05}:${H * 1.05}:force_original_aspect_ratio=increase`,
          `crop=${W}:${H}`,
          `zoompan=z='if(lte(zoom,1.0),1.05,max(1.001,zoom-0.001))':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=${FPS * SLIDE_DUR}:s=${W}x${H}:fps=${FPS}`,
          'format=yuv420p',
          ...textFilters,
        ];

        await execFileAsync('ffmpeg', [
          '-y',
          '-loop', '1',
          '-i', seg.path,
          '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
          '-t', String(SLIDE_DUR),
          '-vf', vfParts.join(','),
          '-map', '0:v:0', '-map', '1:a:0',
          '-c:v', 'libx264', '-preset', 'fast', '-crf', '26',
          '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100',
          '-r', String(FPS),
          '-pix_fmt', 'yuv420p',
          '-shortest',
          outPath,
        ], { timeout: 60000 });
      }

      chunkPaths.push(outPath);
    }

    // ── 9. Concatenate all chunks ─────────────────────────────────────────────
    const concatListPath = path.join(tmpDir, 'concat.txt');
    fs.writeFileSync(concatListPath, chunkPaths.map(p => `file '${p}'`).join('\n'));

    const silentMoviePath = path.join(tmpDir, 'silent_movie.mp4');
    await execFileAsync('ffmpeg', [
      '-y',
      '-f', 'concat', '-safe', '0',
      '-i', concatListPath,
      // All chunks share identical H.264/yuv420p + AAC stereo params, so a
      // stream copy joins them losslessly and fast. Explicitly keep audio.
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      silentMoviePath,
    ], { timeout: 300000 }).catch(async () => {
      // Fallback: if copy fails due to any subtle mismatch, re-encode both.
      await execFileAsync('ffmpeg', [
        '-y',
        '-f', 'concat', '-safe', '0',
        '-i', concatListPath,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '24',
        '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100',
        '-movflags', '+faststart',
        silentMoviePath,
      ], { timeout: 300000 });
    });

    // ── 10. Mix audio: BG music + voice notes ─────────────────────────────────
    const finalMoviePath = path.join(tmpDir, 'final_movie.mp4');

    if (bgMusicPath || voicePaths.length > 0) {
      const audioInputs  = [];
      const filterParts  = [];
      let   audioIdx     = 1; // 0 = video

      // Get total video duration
      const { stdout: durationOut } = await execFileAsync('ffprobe', [
        '-v', 'quiet', '-print_format', 'json', '-show_format', silentMoviePath,
      ]);
      const totalDur = parseFloat(JSON.parse(durationOut).format.duration) || 60;

      // Background music (looped + faded)
      if (bgMusicPath) {
        audioInputs.push('-i', bgMusicPath);
        filterParts.push(`[${audioIdx}:a]aloop=loop=-1:size=2e+09[bgloop]`);
        filterParts.push(`[bgloop]atrim=0:${totalDur},afade=t=out:st=${totalDur - 3}:d=3,volume=0.25[bgfinal]`);
        audioIdx++;
      }

      // Voice notes concatenated
      if (voicePaths.length > 0) {
        const voiceList = path.join(tmpDir, 'voice_list.txt');
        fs.writeFileSync(voiceList, voicePaths.map(v => `file '${v.path}'`).join('\n'));
        const voiceConcatPath = path.join(tmpDir, 'voice_concat.wav');
        await execFileAsync('ffmpeg', [
          '-y', '-f', 'concat', '-safe', '0', '-i', voiceList,
          '-ac', '2', '-ar', '44100', '-c:a', 'pcm_s16le', voiceConcatPath,
        ], { timeout: 60000 });
        audioInputs.push('-i', voiceConcatPath);
        filterParts.push(`[${audioIdx}:a]atrim=0:${totalDur},volume=0.9[voicefinal]`);
        audioIdx++;
      }

      // Mix or use single audio source
      let mixLabel = '';
      if (bgMusicPath && voicePaths.length > 0) {
        filterParts.push('[bgfinal][voicefinal]amix=inputs=2:duration=first:normalize=0[audiomix]');
        mixLabel = '[audiomix]';
      } else if (bgMusicPath) {
        mixLabel = '[bgfinal]';
      } else {
        mixLabel = '[voicefinal]';
      }

      await execFileAsync('ffmpeg', [
        '-y',
        '-i', silentMoviePath,
        ...audioInputs,
        '-filter_complex', filterParts.join(';'),
        '-map', '0:v',
        '-map', mixLabel,
        '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '128k',
        '-shortest',
        '-movflags', '+faststart',
        finalMoviePath,
      ], { timeout: 300000 });
    } else {
      fs.copyFileSync(silentMoviePath, finalMoviePath);
    }

    // ── 11. Extract thumbnail ─────────────────────────────────────────────────
    const thumbPath = path.join(tmpDir, 'thumb.jpg');
    try {
      await execFileAsync('ffmpeg', [
        '-y', '-i', finalMoviePath,
        '-ss', '00:00:03', '-vframes', '1',
        '-vf', `scale=1280:720`,
        thumbPath,
      ]);
    } catch { /* non-fatal */ }

    // ── 12. Get final file stats ──────────────────────────────────────────────
    const { stdout: finalProbe } = await execFileAsync('ffprobe', [
      '-v', 'quiet', '-print_format', 'json', '-show_format', finalMoviePath,
    ]);
    const finalFormat    = JSON.parse(finalProbe).format;
    const durationSecs   = Math.round(parseFloat(finalFormat.duration) || 0);
    const fileSizeBytes  = parseInt(finalFormat.size, 10) || fs.statSync(finalMoviePath).size;

    // ── 13. Upload to Cloudinary ──────────────────────────────────────────────
    const publicId = `thankeeu/movies/card_${card.id}_${Date.now()}`;

    const uploadResult = await cloudinary.uploader.upload(finalMoviePath, {
      resource_type:  'video',
      public_id:      publicId,
      overwrite:      true,
      eager:          [{ format: 'mp4', transformation: [{ quality: 'auto' }] }],
      eager_async:    false,
    });

    let thumbUrl = null;
    if (fs.existsSync(thumbPath)) {
      const thumbUpload = await cloudinary.uploader.upload(thumbPath, {
        resource_type: 'image',
        public_id:     `${publicId}_thumb`,
        overwrite:     true,
      });
      thumbUrl = thumbUpload.secure_url;
    }

    return {
      movie_url:        uploadResult.secure_url,
      movie_public_id:  publicId,
      thumbnail_url:    thumbUrl,
      duration_secs:    durationSecs,
      file_size_bytes:  fileSizeBytes,
    };

  } finally {
    // ── Cleanup temp dir ──────────────────────────────────────────────────────
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

module.exports = { renderMovie };
