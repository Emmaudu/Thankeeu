/**
 * movieRenderer.js — Thankeeu Memory Movie™ engine
 *
 * Builds a 1080p MP4 from a card's messages, photos, videos and voice notes
 * using only FFmpeg — no AI video APIs, no expensive third-party services.
 *
 * Pipeline:
 *   1. Download all assets (cover image, message photos, videos, voice notes)
 *   2. Build colour slides for title/message cards with drawtext overlays
 *   3. Assemble timeline segments — images become fixed-duration clips
 *   4. Concatenate all clips via concat demuxer
 *   5. Mix background music + voice notes over the video
 *   6. Encode to H.264/AAC MP4 at 1080p
 *   7. Upload to Cloudinary
 *   8. Return { movie_url, thumbnail_url, duration_secs, file_size_bytes }
 *
 * DESIGN NOTES:
 *   - zoompan was removed — it is O(n) per frame, extremely slow on constrained
 *     Railway containers (~30s per slide). Simple scale+pad is used instead.
 *   - Every execFileAsync call has an explicit timeout and a stderr capture so
 *     failures surface clearly in Railway logs rather than vanishing silently.
 *   - Voice notes are normalised to 44.1kHz stereo WAV before concatenating
 *     to avoid codec/sample-rate mismatch errors during final mix.
 */

'use strict';

const path    = require('path');
const fs      = require('fs');
const os      = require('os');
const https   = require('https');
const http    = require('http');
const { execFile }    = require('child_process');
const { promisify }   = require('util');
const execFileAsync   = promisify(execFile);
const cloudinary      = require('./cloudinary').cloudinary;

// ── Constants ─────────────────────────────────────────────────────────────────
const W = 1920, H = 1080;
const FPS = 25;           // 25fps is standard and slightly lighter than 30
const SLIDE_DUR = 4;      // seconds per image/text slide
const MAX_ASSETS = 30;    // cap for render-time safety on Railway free tier
const MAX_TEXT   = 160;   // truncate long messages

// Background music — royalty-free ambient, falls back silently if unavailable
const BG_MUSIC_URL = process.env.MOVIE_BG_MUSIC_URL
  || 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_1e9fce5ab4.mp3';

// ── Font resolution ───────────────────────────────────────────────────────────
function resolveFontFile() {
  const candidates = [
    process.env.MOVIE_FONT_FILE,
    // Alpine Linux (Dockerfile with apk add ttf-dejavu)
    '/usr/share/fonts/ttf-dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/ttf-dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans.ttf',
    // Ubuntu/Debian (nixpacks)
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
    // macOS dev
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
  ];
  for (const c of candidates) {
    try { if (c && fs.existsSync(c)) { console.log(`[movie] Using font: ${c}`); return c; } } catch { /* ignore */ }
  }
  // Try scanning /nix/store for any DejaVu font
  try {
    const nixStore = '/nix/store';
    if (fs.existsSync(nixStore)) {
      const dirs = fs.readdirSync(nixStore).filter(d => d.includes('dejavu') || d.includes('freefont'));
      for (const d of dirs.slice(0, 5)) {
        const f = path.join(nixStore, d, 'share', 'fonts', 'truetype', 'DejaVuSans-Bold.ttf');
        if (fs.existsSync(f)) { console.log(`[movie] Using nix font: ${f}`); return f; }
      }
    }
  } catch { /* ignore */ }
  console.warn('[movie] WARNING: No font file found — text overlays will use fontconfig default');
  return null;
}
const FONT_FILE = resolveFontFile();
const FONT_FRAG = FONT_FILE ? `fontfile='${FONT_FILE.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}':` : '';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Download a URL to a local temp file. Returns the local path. */
function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file  = fs.createWriteStream(destPath);
    const req   = proto.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        return download(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`Download ${res.statusCode}: ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    });
    req.on('error', err => { file.close(); reject(err); });
    req.setTimeout(30000, () => { req.destroy(); reject(new Error(`Download timeout: ${url}`)); });
  });
}

/** Escape text for FFmpeg drawtext. Strips emoji/non-ASCII the font can't render. */
const escFF = s => String(s)
  .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
  .replace(/[^\x00-\x7F]/g, '')   // strip all non-ASCII (font safety)
  .replace(/\s{2,}/g, ' ')
  .trim()
  .replace(/\\/g, '\\\\')
  .replace(/'/g, "\\'")
  .replace(/:/g, '\\:')
  .replace(/\[/g, '\\[')
  .replace(/\]/g, '\\]')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

/** Wrap text to ~N chars per line, return as array of strings */
function wrapLines(text, maxChars = 36) {
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
  return lines.slice(0, 4); // max 4 lines
}

/** Run ffmpeg with timeout and capture stderr for diagnostics */
async function ff(args, timeoutMs = 90000, label = '') {
  try {
    const r = await execFileAsync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], {
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
    });
    return r;
  } catch (err) {
    const msg = err.stderr || err.message || String(err);
    console.error(`[movie] ffmpeg${label ? ' ' + label : ''} FAILED: ${msg.slice(0, 500)}`);
    throw new Error(`ffmpeg${label ? ' ' + label : ''}: ${msg.slice(0, 300)}`);
  }
}

/** Generate a solid-colour PNG using FFmpeg */
async function makeColourSlide(colour, outPath) {
  await ff([
    '-y', '-f', 'lavfi',
    '-i', `color=c=${colour}:s=${W}x${H}:r=1:d=1`,
    '-vframes', '1',
    outPath,
  ], 15000, 'colour-slide');
}

/** Convert an image to a padded 1920x1080 PNG */
async function normaliseImage(srcPath, outPath) {
  await ff([
    '-y', '-i', srcPath,
    '-vf', `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`,
    '-vframes', '1',
    '-q:v', '2',
    outPath,
  ], 20000, 'normalise-image');
}

// ── Main renderer ─────────────────────────────────────────────────────────────

async function renderMovie(card, msgs) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thankeeu-movie-'));
  console.log(`[movie] Start render for card ${card.id}, tmpDir=${tmpDir}`);

  try {
    // Verify ffmpeg is available before doing anything expensive
    try {
      await execFileAsync('ffmpeg', ['-version'], { timeout: 10000 });
      console.log('[movie] ffmpeg found');
    } catch {
      throw new Error('ffmpeg is not installed or not in PATH. Add nixPkgs = ["ffmpeg-full"] to nixpacks.toml.');
    }

    // ── 0. Merge wall posts ──────────────────────────────────────────────────
    try {
      const supabase = require('./supabase');
      const { data: wallPosts } = await supabase
        .from('wall_posts')
        .select('id, author_name, caption, media_url, media_type, created_at')
        .eq('card_id', card.id)
        .eq('is_moderated', false)
        .order('created_at', { ascending: true });
      if (wallPosts?.length) {
        msgs = [...msgs, ...wallPosts.map(wp => ({
          author_name: wp.author_name,
          content:     wp.caption || null,
          media_url:   wp.media_url,
          media_type:  wp.media_type,
        }))];
        console.log(`[movie] Merged ${wallPosts.length} wall posts`);
      }
    } catch (e) { console.warn('[movie] wall posts merge error (non-fatal):', e.message); }

    // ── 1. Classify assets ───────────────────────────────────────────────────
    const photoMsgs = msgs.filter(m => m.media_type === 'image' && m.media_url).slice(0, MAX_ASSETS);
    const videoMsgs = msgs.filter(m => m.media_type === 'video' && m.media_url).slice(0, 6);
    const voiceMsgs = msgs.filter(m => m.media_type === 'voice' && m.media_url).slice(0, 10);
    const textMsgs  = msgs.filter(m => m.content?.trim()).slice(0, 15);
    console.log(`[movie] Assets: ${photoMsgs.length} photos, ${videoMsgs.length} videos, ${voiceMsgs.length} voice, ${textMsgs.length} text`);

    // ── 2. Cover slide — use card design colour (no cover_image column on cards) ──
    let coverPath = null; // no cover image available from cards table

    // ── 3. Download and normalise photos ────────────────────────────────────
    const photoPaths = [];
    for (let i = 0; i < photoMsgs.length; i++) {
      try {
        const raw  = path.join(tmpDir, `photo_raw_${i}`);
        await download(photoMsgs[i].media_url, raw);
        const norm = path.join(tmpDir, `photo_${i}.png`);
        await normaliseImage(raw, norm);
        photoPaths.push({ path: norm, author: photoMsgs[i].author_name });
      } catch (e) { console.warn(`[movie] photo ${i} failed:`, e.message); }
    }

    // ── 4. Download videos ───────────────────────────────────────────────────
    const videoPaths = [];
    for (let i = 0; i < videoMsgs.length; i++) {
      try {
        const dest = path.join(tmpDir, `video_${i}.mp4`);
        await download(videoMsgs[i].media_url, dest);
        videoPaths.push({ path: dest, author: videoMsgs[i].author_name });
      } catch (e) { console.warn(`[movie] video ${i} failed:`, e.message); }
    }

    // ── 5. Download and normalise voice notes ────────────────────────────────
    const voicePaths = [];
    for (let i = 0; i < voiceMsgs.length; i++) {
      try {
        const raw  = path.join(tmpDir, `voice_raw_${i}`);
        await download(voiceMsgs[i].media_url, raw);
        const norm = path.join(tmpDir, `voice_${i}.wav`);
        await ff(['-y', '-i', raw, '-ac', '2', '-ar', '44100', '-c:a', 'pcm_s16le', norm], 30000, `voice-${i}`);
        voicePaths.push({ path: norm, author: voiceMsgs[i].author_name });
      } catch (e) { console.warn(`[movie] voice ${i} failed:`, e.message); }
    }

    // ── 6. Download background music ────────────────────────────────────────
    let bgMusicPath = null;
    try {
      bgMusicPath = path.join(tmpDir, 'bgmusic.mp3');
      await download(BG_MUSIC_URL, bgMusicPath);
      console.log('[movie] BG music downloaded');
    } catch (e) { console.warn('[movie] BG music download failed (non-fatal):', e.message); bgMusicPath = null; }

    // ── 7. Build segment list ────────────────────────────────────────────────
    const segments = [];

    // Opening title slide
    const titleSlide = path.join(tmpDir, 'title.png');
    await makeColourSlide('0x1a0533', titleSlide);
    const occasionText = card.occasion
      ? card.occasion.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'Happy Celebration';
    segments.push({ type: 'image', path: titleSlide, duration: SLIDE_DUR,
      overlays: [
        { text: escFF(occasionText),          fs: 80, col: 'FFD700', y: '(h/2)-80' },
        { text: escFF(card.recipient_name || ''), fs: 60, col: 'FFFFFF', y: '(h/2)+20' },
        { text: 'Made with love by everyone', fs: 32, col: '9966CC', y: '(h/2)+120' },
      ],
    });

    // Cover image
    if (coverPath) segments.push({ type: 'image', path: coverPath, duration: SLIDE_DUR, overlays: [] });

    // Text message slides (up to 10)
    for (const m of textMsgs.slice(0, 10)) {
      const slide = path.join(tmpDir, `msg_${segments.length}.png`);
      await makeColourSlide('0x2d0052', slide);
      const lines  = wrapLines(m.content.slice(0, MAX_TEXT));
      const yStart = H / 2 - (lines.length * 35);
      const overlays = lines.map((line, li) => ({
        text: escFF(line), fs: 46, col: 'FFFFFF', y: String(yStart + li * 70),
      }));
      if (m.author_name) overlays.push({
        text: escFF(`— ${m.author_name}`), fs: 34, col: 'BB88FF', y: String(yStart + lines.length * 70 + 20),
      });
      segments.push({ type: 'image', path: slide, duration: SLIDE_DUR, overlays });
    }

    // Photo slides
    for (const p of photoPaths) {
      const overlays = p.author
        ? [{ text: escFF(p.author), fs: 36, col: 'FFFFFF', y: 'h-80' }]
        : [];
      segments.push({ type: 'image', path: p.path, duration: SLIDE_DUR, overlays });
    }

    // Video clips (trimmed to 8s each)
    for (const v of videoPaths) {
      const overlays = v.author
        ? [{ text: escFF(v.author), fs: 36, col: 'FFFFFF', y: 'h-80' }]
        : [];
      segments.push({ type: 'video', path: v.path, duration: 8, overlays });
    }

    // Signatures slide
    const sigSlide = path.join(tmpDir, 'sig.png');
    await makeColourSlide('0x1a0533', sigSlide);
    const sigNames = [...new Set(msgs.map(m => m.author_name).filter(Boolean))].slice(0, 15);
    segments.push({ type: 'image', path: sigSlide, duration: SLIDE_DUR,
      overlays: [
        { text: 'Signed with love by',  fs: 52, col: 'FFD700', y: '(h/2)-80' },
        { text: escFF(sigNames.join(' · ')), fs: 30, col: 'CCCCCC', y: '(h/2)+20' },
      ],
    });

    // Closing slide
    const closeSlide = path.join(tmpDir, 'close.png');
    await makeColourSlide('0x0d0020', closeSlide);
    segments.push({ type: 'image', path: closeSlide, duration: SLIDE_DUR,
      overlays: [
        { text: 'Made with love',       fs: 60, col: 'FFD700', y: '(h/2)-70' },
        { text: 'by everyone who cares about you', fs: 38, col: 'FFFFFF', y: '(h/2)+20' },
        { text: '— Thankeeu',           fs: 32, col: '9966CC', y: '(h/2)+100' },
      ],
    });

    console.log(`[movie] ${segments.length} segments to render`);

    // ── 8. Render each segment to a fixed-duration MP4 chunk ─────────────────
    const chunkPaths = [];

    for (let i = 0; i < segments.length; i++) {
      const seg     = segments[i];
      const outPath = path.join(tmpDir, `chunk_${i}.mp4`);

      // Build text overlay filter chain
      const textFilter = seg.overlays
        .filter(o => o.text?.trim())
        .map(o => `drawtext=${FONT_FRAG}text='${o.text}':fontsize=${o.fs}:fontcolor=#${o.col}:x=(w-text_w)/2:y=${o.y}:shadowcolor=black@0.7:shadowx=2:shadowy=2`)
        .join(',');

      if (seg.type === 'video') {
        const vf = [
          `scale=${W}:${H}:force_original_aspect_ratio=decrease`,
          `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`,
          textFilter,
        ].filter(Boolean).join(',');

        // Try with native audio, fall back to silent
        try {
          await ff([
            '-y', '-i', seg.path,
            '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
            '-t', String(seg.duration),
            '-filter_complex',
              `[0:v]${vf}[v];[0:a]anull[ca];[1:a]atrim=0:${seg.duration}[sil];[ca][sil]amix=inputs=2:duration=first[a]`,
            '-map', '[v]', '-map', '[a]',
            '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '30',
            '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-ar', '44100',
            '-r', String(FPS), '-pix_fmt', 'yuv420p',
            outPath,
          ], 60000, `chunk-${i}-video`);
        } catch {
          await ff([
            '-y', '-i', seg.path,
            '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
            '-t', String(seg.duration),
            '-vf', vf,
            '-map', '0:v:0', '-map', '1:a:0',
            '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '30',
            '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-ar', '44100',
            '-r', String(FPS), '-pix_fmt', 'yuv420p', '-shortest',
            outPath,
          ], 60000, `chunk-${i}-video-fallback`);
        }
      } else {
        // Image slide — simple scale+pad (NO zoompan — too slow on Railway)
        const vf = [
          `scale=${W}:${H}:force_original_aspect_ratio=decrease`,
          `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`,
          textFilter,
        ].filter(Boolean).join(',');

        await ff([
          '-y',
          '-loop', '1', '-i', seg.path,
          '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
          '-t', String(seg.duration),
          '-vf', vf,
          '-map', '0:v:0', '-map', '1:a:0',
          '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
          '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-ar', '44100',
          '-r', String(FPS), '-pix_fmt', 'yuv420p', '-shortest',
          outPath,
        ], 45000, `chunk-${i}-image`);
      }

      chunkPaths.push(outPath);
      console.log(`[movie] Chunk ${i + 1}/${segments.length} done`);
    }

    // ── 9. Concatenate all chunks ─────────────────────────────────────────────
    const concatList = path.join(tmpDir, 'concat.txt');
    fs.writeFileSync(concatList, chunkPaths.map(p => `file '${p}'`).join('\n'));

    const silentMovie = path.join(tmpDir, 'silent.mp4');

    // Try stream copy first (fast), fall back to re-encode
    try {
      await ff([
        '-y', '-f', 'concat', '-safe', '0', '-i', concatList,
        '-c', 'copy', '-movflags', '+faststart',
        silentMovie,
      ], 300000, 'concat-copy');
    } catch {
      console.warn('[movie] concat copy failed, re-encoding');
      await ff([
        '-y', '-f', 'concat', '-safe', '0', '-i', concatList,
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
        '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-ar', '44100',
        '-movflags', '+faststart',
        silentMovie,
      ], 300000, 'concat-reencode');
    }
    console.log('[movie] Concatenation done');

    // ── 10. Mix background music + voice notes ────────────────────────────────
    const finalMovie = path.join(tmpDir, 'final.mp4');

    if (bgMusicPath || voicePaths.length > 0) {
      // Get total video duration
      const probeOut = await execFileAsync('ffprobe', [
        '-v', 'quiet', '-print_format', 'json', '-show_format', silentMovie,
      ], { timeout: 15000 });
      const totalDur = parseFloat(JSON.parse(probeOut.stdout).format.duration) || 60;
      console.log(`[movie] Total duration: ${totalDur}s`);

      const audioInputs = [];
      const filters     = [];
      let audioIdx      = 1; // 0 = main video

      if (bgMusicPath) {
        audioInputs.push('-i', bgMusicPath);
        filters.push(
          `[${audioIdx}:a]aloop=loop=-1:size=2e+09[bgloop]`,
          `[bgloop]atrim=0:${totalDur},afade=t=out:st=${Math.max(0, totalDur - 3)}:d=3,volume=0.2[bgfinal]`,
        );
        audioIdx++;
      }

      let voiceConcatPath = null;
      if (voicePaths.length > 0) {
        const voiceList = path.join(tmpDir, 'voicelist.txt');
        fs.writeFileSync(voiceList, voicePaths.map(v => `file '${v.path}'`).join('\n'));
        voiceConcatPath = path.join(tmpDir, 'voices.wav');
        await ff([
          '-y', '-f', 'concat', '-safe', '0', '-i', voiceList,
          '-ac', '2', '-ar', '44100', '-c:a', 'pcm_s16le',
          voiceConcatPath,
        ], 60000, 'voice-concat');
        audioInputs.push('-i', voiceConcatPath);
        filters.push(`[${audioIdx}:a]atrim=0:${totalDur},volume=0.85[voicefinal]`);
        audioIdx++;
      }

      let mixLabel;
      if (bgMusicPath && voicePaths.length > 0) {
        filters.push('[bgfinal][voicefinal]amix=inputs=2:duration=first:normalize=0[audiomix]');
        mixLabel = '[audiomix]';
      } else if (bgMusicPath) {
        mixLabel = '[bgfinal]';
      } else {
        mixLabel = '[voicefinal]';
      }

      await ff([
        '-y', '-i', silentMovie,
        ...audioInputs,
        '-filter_complex', filters.join(';'),
        '-map', '0:v',
        '-map', mixLabel,
        '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100',
        '-shortest', '-movflags', '+faststart',
        finalMovie,
      ], 300000, 'audio-mix');
      console.log('[movie] Audio mix done');
    } else {
      fs.copyFileSync(silentMovie, finalMovie);
      console.log('[movie] No audio to mix — using silent movie');
    }

    // ── 11. Extract thumbnail ─────────────────────────────────────────────────
    const thumbPath = path.join(tmpDir, 'thumb.jpg');
    try {
      await ff([
        '-y', '-i', finalMovie,
        '-ss', '00:00:03', '-vframes', '1',
        '-vf', 'scale=1280:720',
        thumbPath,
      ], 20000, 'thumbnail');
    } catch (e) { console.warn('[movie] thumbnail failed (non-fatal):', e.message); }

    // ── 12. File stats ────────────────────────────────────────────────────────
    const probeOut2 = await execFileAsync('ffprobe', [
      '-v', 'quiet', '-print_format', 'json', '-show_format', finalMovie,
    ], { timeout: 15000 });
    const fmt        = JSON.parse(probeOut2.stdout).format;
    const durationSecs  = Math.round(parseFloat(fmt.duration) || 0);
    const fileSizeBytes = parseInt(fmt.size, 10) || fs.statSync(finalMovie).size;
    console.log(`[movie] Final: ${durationSecs}s, ${Math.round(fileSizeBytes / 1024 / 1024)}MB`);

    // ── 13. Upload to Cloudinary ──────────────────────────────────────────────
    const publicId = `thankeeu/movies/card_${card.id}_${Date.now()}`;
    console.log(`[movie] Uploading to Cloudinary as ${publicId}`);

    const uploadResult = await cloudinary.uploader.upload(finalMovie, {
      resource_type: 'video',
      public_id:     publicId,
      overwrite:     true,
      eager:         [{ format: 'mp4', transformation: [{ quality: 'auto:good' }] }],
      eager_async:   false,
      timeout:       600000,
    });

    let thumbUrl = null;
    if (fs.existsSync(thumbPath)) {
      try {
        const thumbUpload = await cloudinary.uploader.upload(thumbPath, {
          resource_type: 'image',
          public_id:     `${publicId}_thumb`,
          overwrite:     true,
        });
        thumbUrl = thumbUpload.secure_url;
      } catch (e) { console.warn('[movie] thumb upload failed:', e.message); }
    }

    console.log(`[movie] SUCCESS — ${uploadResult.secure_url}`);
    return {
      movie_url:       uploadResult.secure_url,
      movie_public_id: publicId,
      thumbnail_url:   thumbUrl,
      duration_secs:   durationSecs,
      file_size_bytes: fileSizeBytes,
    };

  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

module.exports = { renderMovie };
