/**
 * movieRenderer.js — Thankeeu Memory Movie™ engine
 *
 * Builds a 1080p MP4 from a card's messages, photos, videos and voice notes
 * using only FFmpeg.
 *
 * Pipeline:
 *   1.  Classify messages by media type
 *   2.  Download photos, videos, voice notes
 *   3.  Build decorated name+caption slides per contributor (with celebration bg)
 *   4.  Sequence: contributor name/caption → their photo/video → repeat
 *   5.  Generate ambient background music (or download from MOVIE_BG_MUSIC_URL)
 *   6.  Concatenate all clips
 *   7.  Mix music + voice notes over video
 *   8.  Upload to Cloudinary, return result
 *
 * DESIGN:
 *   - Backgrounds: deep purple-blue with drawbox geometric celebration shapes
 *     and a ghosted occasion word — not plain colour.
 *   - Per-contributor sequence: name+message slide first, then their media.
 *   - Slide order: Opening title → [for each contributor: caption slide → media] →
 *     Signatures → Closing.
 *   - Music: tries MOVIE_BG_MUSIC_URL env var first (must be direct MP3 link),
 *     falls back to ffmpeg-generated layered ambient sine tones (always works).
 *   - No zoompan — too slow on Railway constrained containers.
 */

'use strict';

const path          = require('path');
const fs            = require('fs');
const os            = require('os');
const https         = require('https');
const http          = require('http');
const { execFile }  = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const cloudinary    = require('./cloudinary').cloudinary;

// ── Constants ─────────────────────────────────────────────────────────────────
const W         = 1920;
const H         = 1080;
const FPS       = 25;
const SLIDE_DUR = 4;       // seconds per text/name slide
const MEDIA_DUR = 5;       // seconds for photo slides (slightly longer than text)
const MAX_CONTRIBUTORS = 25;
const MAX_TEXT  = 200;

// ── Music URL resolution ──────────────────────────────────────────────────────
// Priority: 1) DB site_settings.movie_bg_music_url  2) MOVIE_BG_MUSIC_URL env  3) generated ambient
async function resolveMusicUrl() {
  try {
    const supabase = require('./supabase');
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'movie_bg_music_url')
      .maybeSingle();
    if (data?.value) {
      console.log(`[movie] Music URL from DB: ${data.value}`);
      return data.value;
    }
  } catch (e) {
    console.warn('[movie] Could not read music URL from DB (non-fatal):', e.message);
  }
  if (process.env.MOVIE_BG_MUSIC_URL) {
    console.log(`[movie] Music URL from env: ${process.env.MOVIE_BG_MUSIC_URL}`);
    return process.env.MOVIE_BG_MUSIC_URL;
  }
  return null;
}

// ── Font resolution ───────────────────────────────────────────────────────────
function resolveFontFile() {
  const candidates = [
    process.env.MOVIE_FONT_FILE,
    '/usr/share/fonts/ttf-dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/ttf-dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
  ];
  for (const c of candidates) {
    try { if (c && fs.existsSync(c)) { console.log(`[movie] font: ${c}`); return c; } } catch {}
  }
  // Scan nix store
  try {
    const nixStore = '/nix/store';
    if (fs.existsSync(nixStore)) {
      const dirs = fs.readdirSync(nixStore).filter(d => d.includes('dejavu') || d.includes('freefont'));
      for (const d of dirs.slice(0, 5)) {
        const f = path.join(nixStore, d, 'share', 'fonts', 'truetype', 'DejaVuSans-Bold.ttf');
        if (fs.existsSync(f)) return f;
      }
    }
  } catch {}
  return null;
}
const FONT_FILE = resolveFontFile();
const FONT_FRAG = FONT_FILE ? `fontfile='${FONT_FILE.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}':` : '';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Download a URL to a local file.
 * Passes URL string directly to https.get (not decomposed object) so the
 * Host header is set correctly — fixes 403s from CDNs that check Host.
 */
function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file  = fs.createWriteStream(destPath);

    // Pass URL as string + separate options object — Node sets Host header correctly
    const req = proto.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':     '*/*',
        'Referer':    'https://thankeeu.com/',
      },
      timeout: 30000,
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlink(destPath, () => {});
        return download(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        try {
          const stat = fs.statSync(destPath);
          if (stat.size < 512) {
            fs.unlink(destPath, () => {});
            return reject(new Error(`File too small (${stat.size}B): ${url}`));
          }
        } catch {}
        resolve(destPath);
      });
    });
    req.on('error', err => { file.close(); fs.unlink(destPath, () => {}); reject(err); });
    req.on('timeout',  () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

/** Escape text for FFmpeg drawtext */
const escFF = s => String(s)
  .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
  .replace(/[^\x00-\x7F]/g, '')
  .replace(/\s{2,}/g, ' ')
  .trim()
  .replace(/\\/g, '\\\\')
  .replace(/'/g, "\\'")
  .replace(/:/g, '\\:')
  .replace(/\[/g, '\\[')
  .replace(/\]/g, '\\]')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

/** Wrap text to lines */
function wrapLines(text, maxChars = 38) {
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
  return lines.slice(0, 4);
}

/** Run ffmpeg with timeout */
async function ff(args, timeoutMs = 90000, label = '') {
  try {
    return await execFileAsync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], {
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    const msg = (err.stderr || err.message || String(err)).slice(0, 500);
    console.error(`[movie] ffmpeg ${label || ''} FAILED: ${msg}`);
    throw new Error(`ffmpeg ${label}: ${msg.slice(0, 200)}`);
  }
}

/** Normalise an image to 1920x1080 PNG with black letterbox */
async function normaliseImage(srcPath, outPath) {
  await ff([
    '-y', '-i', srcPath,
    '-vf', `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`,
    '-vframes', '1', '-q:v', '2', outPath,
  ], 20000, 'normalise-image');
}

/**
 * Build the decorated background vf filter string.
 *
 * Creates a rich celebration background with:
 *   - Deep gradient-like dual-layer drawbox overlay
 *   - Corner and edge decorative shapes (circles simulated with small boxes)
 *   - Scattered star/sparkle drawtext glyphs in gold, pink, purple
 *   - Ghosted occasion word as large watermark text
 *   - Top coloured accent bar
 *
 * @param {string} occasionWord  e.g. "Birthday" "Wedding"
 * @param {string} baseColour    hex without # e.g. "1a0533"
 */
function buildDecoratedBg(occasionWord = 'Celebration', baseColour = '1a0533') {
  const occ = escFF(occasionWord);

  // Scattered decoration positions — fixed so every slide has same pattern
  const decorations = [
    // Corner boxes (simulating circles)
    `drawbox=x=40:y=35:w=110:h=110:color=FFD700@0.18:t=fill`,
    `drawbox=x=1770:y=35:w=110:h=110:color=FF69B4@0.18:t=fill`,
    `drawbox=x=40:y=935:w=110:h=110:color=9966CC@0.18:t=fill`,
    `drawbox=x=1770:y=935:w=110:h=110:color=FFD700@0.18:t=fill`,
    // Mid-edge accents
    `drawbox=x=880:y=20:w=160:h=80:color=FF69B4@0.12:t=fill`,
    `drawbox=x=880:y=980:w=160:h=80:color=9966CC@0.12:t=fill`,
    `drawbox=x=20:y=460:w=80:h=160:color=FFD700@0.10:t=fill`,
    `drawbox=x=1820:y=460:w=80:h=160:color=FF69B4@0.10:t=fill`,
    // Inner scattered small boxes
    `drawbox=x=200:y=140:w=60:h=60:color=FFD700@0.10:t=fill`,
    `drawbox=x=1660:y=140:w=60:h=60:color=FF69B4@0.10:t=fill`,
    `drawbox=x=200:y=880:w=60:h=60:color=9966CC@0.10:t=fill`,
    `drawbox=x=1660:y=880:w=60:h=60:color=FFD700@0.10:t=fill`,
    `drawbox=x=400:y=80:w=40:h=40:color=FF69B4@0.08:t=fill`,
    `drawbox=x=1480:y=80:w=40:h=40:color=9966CC@0.08:t=fill`,
    `drawbox=x=400:y=960:w=40:h=40:color=FFD700@0.08:t=fill`,
    `drawbox=x=1480:y=960:w=40:h=40:color=FF69B4@0.08:t=fill`,
    // Top accent bar
    `drawbox=x=0:y=0:w=1920:h=8:color=FFD700@0.6:t=fill`,
    `drawbox=x=0:y=1072:w=1920:h=8:color=9966CC@0.6:t=fill`,
    // Ghosted occasion watermark
    `drawtext=${FONT_FRAG}text='${occ}':fontsize=240:fontcolor=FFFFFF@0.04:x=(w-text_w)/2:y=(h-text_h)/2`,
    // Star/sparkle glyphs in corners using * and + characters
    `drawtext=${FONT_FRAG}text='*':fontsize=90:fontcolor=FFD700@0.5:x=55:y=50:shadowcolor=black@0.3:shadowx=2:shadowy=2`,
    `drawtext=${FONT_FRAG}text='*':fontsize=70:fontcolor=FF69B4@0.5:x=1790:y=50:shadowcolor=black@0.3:shadowx=2:shadowy=2`,
    `drawtext=${FONT_FRAG}text='*':fontsize=80:fontcolor=9966CC@0.5:x=55:y=950:shadowcolor=black@0.3:shadowx=2:shadowy=2`,
    `drawtext=${FONT_FRAG}text='*':fontsize=90:fontcolor=FFD700@0.5:x=1790:y=950:shadowcolor=black@0.3:shadowx=2:shadowy=2`,
    `drawtext=${FONT_FRAG}text='+':fontsize=55:fontcolor=FF69B4@0.4:x=210:y=150:shadowcolor=black@0.3:shadowx=1:shadowy=1`,
    `drawtext=${FONT_FRAG}text='+':fontsize=45:fontcolor=FFD700@0.4:x=1670:y=150`,
    `drawtext=${FONT_FRAG}text='+':fontsize=50:fontcolor=9966CC@0.4:x=210:y=890`,
    `drawtext=${FONT_FRAG}text='+':fontsize=55:fontcolor=FF69B4@0.4:x=1670:y=890`,
    `drawtext=${FONT_FRAG}text='+':fontsize=35:fontcolor=FFD700@0.35:x=895:y=30`,
    `drawtext=${FONT_FRAG}text='+':fontsize=35:fontcolor=9966CC@0.35:x=895:y=1010`,
  ];

  return decorations.join(',');
}

/**
 * Build a decorated name+caption slide PNG.
 * Background has celebration shapes + ghosted occasion word.
 * Foreground shows: [occasion label] / name / message lines / — author
 */
async function makeNameCaptionSlide(opts, outPath) {
  const { name, caption, occasionWord, baseColour = '1a0533' } = opts;

  const decoratedBg = buildDecoratedBg(occasionWord, baseColour);

  // Foreground text layers
  const nameSafe    = escFF(name || 'A friend') || 'A friend';
  const lines       = caption ? wrapLines(caption.slice(0, MAX_TEXT)) : [];
  const lineCount   = lines.length;

  // Vertical positioning — centre the text block
  const lineH       = 72;
  const blockH      = (lineCount > 0 ? lineCount * lineH + 20 : 0) + 110; // name + lines
  const blockTop    = Math.round((H - blockH) / 2) - 20;

  const fgFilters = [];

  // Name (large, gold)
  fgFilters.push(
    `drawtext=${FONT_FRAG}text='${nameSafe}':fontsize=82:fontcolor=FFD700:x=(w-text_w)/2:y=${blockTop}:shadowcolor=black@0.85:shadowx=4:shadowy=4`
  );

  // Message lines (white)
  lines.forEach((line, i) => {
    const y = blockTop + 110 + i * lineH;
    fgFilters.push(
      `drawtext=${FONT_FRAG}text='${escFF(line)}':fontsize=54:fontcolor=FFFFFF:x=(w-text_w)/2:y=${y}:shadowcolor=black@0.7:shadowx=3:shadowy=3`
    );
  });

  const vf = `color=c=0x${baseColour}:s=${W}x${H}:r=1:d=1[base];[base]${decoratedBg},${fgFilters.join(',')}`;

  await ff([
    '-y', '-f', 'lavfi', '-i', `color=c=0x${baseColour}:s=${W}x${H}:r=1:d=1`,
    '-vf', `${decoratedBg},${fgFilters.join(',')}`,
    '-vframes', '1', '-update', '1', outPath,
  ], 15000, 'name-caption-slide');
}

/**
 * Build the opening title slide.
 */
async function makeTitleSlide(occasionWord, recipientName, outPath) {
  const decoratedBg = buildDecoratedBg(occasionWord, '0d0020');
  const occ  = escFF(occasionWord) || 'Celebration';
  const name = escFF(recipientName || '');

  await ff([
    '-y', '-f', 'lavfi', '-i', `color=c=0x0d0020:s=${W}x${H}:r=1:d=1`,
    '-vf', [
      decoratedBg,
      `drawtext=${FONT_FRAG}text='${occ}':fontsize=110:fontcolor=FFD700:x=(w-text_w)/2:y=(h/2)-160:shadowcolor=black@0.9:shadowx=5:shadowy=5`,
      name ? `drawtext=${FONT_FRAG}text='for ${name}':fontsize=80:fontcolor=FFFFFF:x=(w-text_w)/2:y=(h/2)-30:shadowcolor=black@0.9:shadowx=4:shadowy=4` : null,
      `drawtext=${FONT_FRAG}text='Made with love by everyone':fontsize=46:fontcolor=BB88FF:x=(w-text_w)/2:y=(h/2)+90:shadowcolor=black@0.7:shadowx=2:shadowy=2`,
    ].filter(Boolean).join(','),
    '-vframes', '1', '-update', '1', outPath,
  ], 15000, 'title-slide');
}

/**
 * Build the signatures slide.
 */
async function makeSignaturesSlide(names, occasionWord, outPath) {
  const decoratedBg = buildDecoratedBg(occasionWord, '1a0533');

  // Split names into rows of up to 4 to avoid very long drawtext strings
  // that can overflow FFmpeg's filter string buffer on large cards.
  const safeNames = names.slice(0, 16).map(n => escFF(n));
  const rows = [];
  for (let i = 0; i < safeNames.length; i += 4) {
    rows.push(safeNames.slice(i, i + 4).join('  ·  '));
  }

  const rowFontSize = 38;
  const rowLineH   = 54;
  // Centre rows below the heading
  const headingY   = Math.round(H / 2) - 100;
  const rowsStartY = headingY + 130;

  const rowFilters = rows.map((row, i) =>
    `drawtext=${FONT_FRAG}text='${row}':fontsize=${rowFontSize}:fontcolor=CCCCCC:x=(w-text_w)/2:y=${rowsStartY + i * rowLineH}:shadowcolor=black@0.7:shadowx=2:shadowy=2`
  );

  await ff([
    '-y', '-f', 'lavfi', '-i', `color=c=0x1a0533:s=${W}x${H}:r=1:d=1`,
    '-vf', [
      decoratedBg,
      `drawtext=${FONT_FRAG}text='Signed with love by':fontsize=72:fontcolor=FFD700:x=(w-text_w)/2:y=${headingY}:shadowcolor=black@0.9:shadowx=4:shadowy=4`,
      ...rowFilters,
    ].join(','),
    '-vframes', '1', '-update', '1', outPath,
  ], 15000, 'signatures-slide');
}

/**
 * Build the closing slide.
 */
async function makeClosingSlide(outPath) {
  const decoratedBg = buildDecoratedBg('Thankeeu', '0d0020');

  await ff([
    '-y', '-f', 'lavfi', '-i', `color=c=0x0d0020:s=${W}x${H}:r=1:d=1`,
    '-vf', [
      decoratedBg,
      `drawtext=${FONT_FRAG}text='Made with love':fontsize=90:fontcolor=FFD700:x=(w-text_w)/2:y=(h/2)-90:shadowcolor=black@0.9:shadowx=5:shadowy=5`,
      `drawtext=${FONT_FRAG}text='by everyone who cares about you':fontsize=52:fontcolor=FFFFFF:x=(w-text_w)/2:y=(h/2)+30:shadowcolor=black@0.8:shadowx=3:shadowy=3`,
      `drawtext=${FONT_FRAG}text='-- Thankeeu':fontsize=40:fontcolor=9966CC:x=(w-text_w)/2:y=(h/2)+120:shadowcolor=black@0.7:shadowx=2:shadowy=2`,
    ].join(','),
    '-vframes', '1', '-update', '1', outPath,
  ], 15000, 'closing-slide');
}

/** Render an image PNG into a fixed-duration MP4 chunk with silent audio */
async function imageToChunk(imgPath, duration, outPath) {
  await ff([
    '-y',
    '-loop', '1', '-i', imgPath,
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-t', String(duration),
    '-vf', `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`,
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
    '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-ar', '44100',
    '-r', String(FPS), '-pix_fmt', 'yuv420p', '-shortest',
    outPath,
  ], 45000, 'image-chunk');
}

/** Render a decorated slide PNG into a fixed-duration MP4 chunk */
async function slideToChunk(imgPath, duration, outPath) {
  await ff([
    '-y',
    '-loop', '1', '-i', imgPath,
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-t', String(duration),
    '-vf', `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`,
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
    '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-ar', '44100',
    '-r', String(FPS), '-pix_fmt', 'yuv420p', '-shortest',
    outPath,
  ], 45000, 'slide-chunk');
}

/** Trim/transcode a video file to a fixed-duration MP4 chunk — preserves native audio */
async function videoToChunk(videoPath, duration, outPath) {
  const vf = [
    `scale=${W}:${H}:force_original_aspect_ratio=decrease`,
    `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`,
  ].join(',');

  // Try to keep native video audio; if no audio stream, fall back to silence
  try {
    await ff([
      '-y', '-i', videoPath,
      '-t', String(duration),
      '-vf', vf,
      '-map', '0:v:0', '-map', '0:a:0',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '30',
      '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100',
      '-r', String(FPS), '-pix_fmt', 'yuv420p', '-shortest',
      outPath,
    ], 60000, 'video-chunk-native-audio');
  } catch {
    // No audio stream or codec issue — use silence
    await ff([
      '-y', '-i', videoPath,
      '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-t', String(duration),
      '-vf', vf,
      '-map', '0:v:0', '-map', '1:a:0',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '30',
      '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-ar', '44100',
      '-r', String(FPS), '-pix_fmt', 'yuv420p', '-shortest',
      outPath,
    ], 60000, 'video-chunk-silent');
  }
}

// ── Main renderer ─────────────────────────────────────────────────────────────

async function renderMovie(card, msgs) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thankeeu-movie-'));
  console.log(`[movie] Start render card=${card.id} tmpDir=${tmpDir}`);

  try {
    // Check ffmpeg
    await execFileAsync('ffmpeg', ['-version'], { timeout: 10000 });

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
    } catch (e) { console.warn('[movie] wall posts merge (non-fatal):', e.message); }

    // ── 1. Group messages by contributor ────────────────────────────────────
    // Each contributor gets: one name+caption slide, then their media
    const seen = new Map(); // author_name → { content, mediaItems[] }
    for (const m of msgs) {
      const key = (m.author_name || 'Anonymous').trim();
      if (!seen.has(key)) seen.set(key, { name: key, content: m.content, mediaItems: [] });
      const entry = seen.get(key);
      // Use first non-null content as the caption for this person
      if (!entry.content && m.content?.trim()) entry.content = m.content;
      // Collect media (photos, videos) — voice notes handled separately
      if ((m.media_type === 'image' || m.media_type === 'video') && m.media_url) {
        entry.mediaItems.push({ type: m.media_type, url: m.media_url });
      }
    }

    // Voice notes collected separately (played in audio mix, not visual segments)
    const voiceMsgs = msgs.filter(m => m.media_type === 'voice' && m.media_url).slice(0, 10);

    const contributors = [...seen.values()].slice(0, MAX_CONTRIBUTORS);
    console.log(`[movie] ${contributors.length} contributors, ${voiceMsgs.length} voice notes`);

    // ── 2. Occasion label ────────────────────────────────────────────────────
    const occasionWord = card.occasion
      ? card.occasion.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'Celebration';

    // ── 3. Download all media ────────────────────────────────────────────────
    // Download photos & videos for each contributor
    for (const c of contributors) {
      const resolved = [];
      for (let i = 0; i < Math.min(c.mediaItems.length, 10); i++) {
        const item = c.mediaItems[i];
        try {
          const rawPath = path.join(tmpDir, `${escFileName(c.name)}_raw_${i}`);
          await download(item.url, rawPath);
          if (item.type === 'image') {
            const normPath = path.join(tmpDir, `${escFileName(c.name)}_img_${i}.png`);
            await normaliseImage(rawPath, normPath);
            resolved.push({ type: 'image', path: normPath });
          } else {
            resolved.push({ type: 'video', path: rawPath });
          }
        } catch (e) { console.warn(`[movie] media ${c.name}[${i}] failed:`, e.message); }
      }
      c.resolvedMedia = resolved;
    }

    // Download voice notes
    const voicePaths = [];
    for (let i = 0; i < voiceMsgs.length; i++) {
      try {
        const raw  = path.join(tmpDir, `voice_raw_${i}`);
        await download(voiceMsgs[i].media_url, raw);
        const norm = path.join(tmpDir, `voice_${i}.wav`);
        await ff(['-y', '-i', raw, '-ac', '2', '-ar', '44100', '-c:a', 'pcm_s16le', norm], 30000, `voice-${i}`);
        voicePaths.push(norm);
      } catch (e) { console.warn(`[movie] voice ${i} failed:`, e.message); }
    }

    // ── 4. Generate / download background music ──────────────────────────────
    let bgMusicPath = null;
    const musicUrl  = await resolveMusicUrl();

    if (musicUrl) {
      console.log(`[movie] Trying music URL: ${musicUrl}`);
      try {
        const dest = path.join(tmpDir, 'bgmusic.mp3');
        await download(musicUrl, dest);
        bgMusicPath = dest;
        console.log('[movie] Music ready from URL');
      } catch (e) {
        console.warn('[movie] Music URL failed, generating ambient:', e.message);
      }
    }

    if (!bgMusicPath) {
      console.log('[movie] Generating ambient music with ffmpeg');
      try {
        const dest = path.join(tmpDir, 'bgmusic.mp3');
        await ff([
          '-f', 'lavfi', '-i', 'sine=frequency=432:duration=300',
          '-f', 'lavfi', '-i', 'sine=frequency=528:duration=300',
          '-f', 'lavfi', '-i', 'sine=frequency=396:duration=300',
          '-filter_complex',
          '[0:a]volume=0.07[a1];[1:a]volume=0.04[a2];[2:a]volume=0.03[a3];' +
          '[a1][a2][a3]amix=inputs=3:normalize=0,aecho=0.8:0.6:60:0.3,lowpass=f=1200[out]',
          '-map', '[out]',
          '-c:a', 'libmp3lame', '-b:a', '64k',
          '-y', dest,
        ], 30000, 'gen-ambient');
        bgMusicPath = dest;
        console.log('[movie] Ambient music generated');
      } catch (e) {
        console.warn('[movie] Ambient music failed (non-fatal):', e.message);
      }
    }

    // ── 5. Build and render all chunks ───────────────────────────────────────
    const chunkPaths = [];
    let chunkIdx = 0;

    const addChunk = async (renderFn) => {
      const outPath = path.join(tmpDir, `chunk_${chunkIdx++}.mp4`);
      await renderFn(outPath);
      chunkPaths.push(outPath);
    };

    // Opening title
    const titleImg = path.join(tmpDir, 'slide_title.png');
    await makeTitleSlide(occasionWord, card.recipient_name, titleImg);
    await addChunk(out => slideToChunk(titleImg, SLIDE_DUR + 1, out));
    console.log('[movie] Title chunk done');

    // Per-contributor: name+caption slide → their media
    for (let ci = 0; ci < contributors.length; ci++) {
      const contrib = contributors[ci];

      // Name + caption decorated slide
      const captionImg = path.join(tmpDir, `slide_caption_${ci}.png`);
      await makeNameCaptionSlide({
        name:         contrib.name,
        caption:      contrib.content,
        occasionWord,
        baseColour:   ci % 2 === 0 ? '1a0533' : '2d0052',
      }, captionImg);
      await addChunk(out => slideToChunk(captionImg, SLIDE_DUR, out));

      // Their media (images then videos)
      for (const media of contrib.resolvedMedia) {
        if (media.type === 'image') {
          await addChunk(out => imageToChunk(media.path, MEDIA_DUR, out));
        } else if (media.type === 'video') {
          await addChunk(out => videoToChunk(media.path, 8, out));
        }
      }

      console.log(`[movie] Contributor ${ci + 1}/${contributors.length} done (${contrib.resolvedMedia.length} media)`);
    }

    // Signatures slide
    const sigNames  = contributors.map(c => c.name).filter(Boolean);
    const sigImg    = path.join(tmpDir, 'slide_sig.png');
    await makeSignaturesSlide(sigNames, occasionWord, sigImg);
    await addChunk(out => slideToChunk(sigImg, SLIDE_DUR + 1, out));

    // Closing slide
    const closeImg = path.join(tmpDir, 'slide_close.png');
    await makeClosingSlide(closeImg);
    await addChunk(out => slideToChunk(closeImg, SLIDE_DUR, out));

    console.log(`[movie] ${chunkPaths.length} chunks rendered`);

    // ── 6. Concatenate all chunks ─────────────────────────────────────────────
    const concatList = path.join(tmpDir, 'concat.txt');
    fs.writeFileSync(concatList, chunkPaths.map(p => `file '${p}'`).join('\n'));
    const silentMovie = path.join(tmpDir, 'silent.mp4');

    try {
      await ff([
        '-y', '-f', 'concat', '-safe', '0', '-i', concatList,
        '-c', 'copy', '-movflags', '+faststart', silentMovie,
      ], 300000, 'concat-copy');
    } catch {
      await ff([
        '-y', '-f', 'concat', '-safe', '0', '-i', concatList,
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
        '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-ar', '44100',
        '-movflags', '+faststart', silentMovie,
      ], 300000, 'concat-reencode');
    }
    console.log('[movie] Concatenation done');

    // ── 7. Mix background music + voice notes ────────────────────────────────
    const finalMovie = path.join(tmpDir, 'final.mp4');

    if (bgMusicPath || voicePaths.length > 0) {
      const probeOut = await execFileAsync('ffprobe', [
        '-v', 'quiet', '-print_format', 'json', '-show_format', silentMovie,
      ], { timeout: 15000 });
      const totalDur = parseFloat(JSON.parse(probeOut.stdout).format.duration) || 60;
      console.log(`[movie] Duration: ${totalDur}s`);

      // Fade duration: 6s for movies > 60s, 4s for 30–60s, 3s for shorter
      const fadeDur   = totalDur > 60 ? 6 : totalDur > 30 ? 4 : 3;
      const fadeStart = Math.max(0, totalDur - fadeDur);

      const audioInputs = [];
      const filters     = [];
      let   inputIdx    = 1; // 0 = main video

      // ── Video audio from assembled movie (includes native video clip sound) ──
      // The silent movie's audio track carries video clip audio embedded during chunking.
      // We use it as a full-volume foreground track and as the sidechain for ducking.
      filters.push(`[0:a]volume=1.0[videoaudio]`);

      // ── Background music ─────────────────────────────────────────────────────
      let hasBg = false;
      if (bgMusicPath) {
        audioInputs.push('-stream_loop', '-1', '-i', bgMusicPath);
        // Set bg music at 0.18 — will be ducked further by sidechain below
        filters.push(
          `[${inputIdx}:a]atrim=0:${totalDur},asetpts=PTS-STARTPTS,volume=0.18[bgraw]`,
        );
        inputIdx++;
        hasBg = true;
      }

      // ── Voice notes ──────────────────────────────────────────────────────────
      let hasVoice = false;
      if (voicePaths.length > 0) {
        const voiceList = path.join(tmpDir, 'voicelist.txt');
        fs.writeFileSync(voiceList, voicePaths.map(v => `file '${v}'`).join('\n'));
        const voiceConcatPath = path.join(tmpDir, 'voices.wav');
        await ff([
          '-y', '-f', 'concat', '-safe', '0', '-i', voiceList,
          '-ac', '2', '-ar', '44100', '-c:a', 'pcm_s16le', voiceConcatPath,
        ], 60000, 'voice-concat');
        audioInputs.push('-i', voiceConcatPath);
        // loudnorm: bring voice to consistent -16 LUFS so quiet recordings are audible
        // apad: pad with silence so voice aligns with full movie length
        filters.push(
          `[${inputIdx}:a]atrim=0:${totalDur},asetpts=PTS-STARTPTS,` +
          `loudnorm=I=-16:TP=-1.5:LRA=11,apad=whole_dur=${totalDur}[voiceout]`,
        );
        inputIdx++;
        hasVoice = true;
      }

      // ── Sidechain ducking ─────────────────────────────────────────────────────
      // Music automatically ducks when voice notes OR video audio is present.
      // sidechaincompress: threshold=0.01 (-40dB), ratio=8:1 = aggressive duck
      //   attack=20ms = fast response to speech, release=800ms = smooth recovery
      //   makeup=1 = no makeup gain (we want music quiet under speech, not restored)
      // Result: music drops from 0.18 to ~0.02 during speech/video, rises back between.
      let mixLabel;

      if (hasBg) {
        // Each named output can only be read ONCE in ffmpeg filter_complex.
        // Use asplit/acopy to make extra copies for the sidechain AND final mix.
        if (hasVoice) {
          // Split voiceout and videoaudio so each is used in sidechain AND final mix
          filters.push(`[voiceout]asplit=2[voiceA][voiceB]`);
          filters.push(`[videoaudio]asplit=2[vidA][vidB]`);
          // Sidechain = voice + video audio combined
          filters.push(`[vidA][voiceA]amix=inputs=2:normalize=0[sidechain]`);
          // Duck music against sidechain
          filters.push(
            `[bgraw][sidechain]sidechaincompress=` +
            `threshold=0.01:ratio=8:attack=20:release=800:makeup=1[bgducked]`,
          );
          // Final 3-way mix: ducked music + full voice + full video audio
          filters.push(
            `[bgducked][voiceB][vidB]amix=inputs=3:normalize=0,` +
            `afade=t=out:st=${fadeStart}:d=${fadeDur},` +
            `dynaudnorm=p=0.95:m=100[finalout]`,
          );
        } else {
          // No voice — duck music against video audio only
          filters.push(`[videoaudio]asplit=2[vidA][vidB]`);
          filters.push(`[vidA]acopy[sidechain]`);
          filters.push(
            `[bgraw][sidechain]sidechaincompress=` +
            `threshold=0.01:ratio=8:attack=20:release=800:makeup=1[bgducked]`,
          );
          // Final 2-way mix: ducked music + video audio
          filters.push(
            `[bgducked][vidB]amix=inputs=2:normalize=0,` +
            `afade=t=out:st=${fadeStart}:d=${fadeDur},` +
            `dynaudnorm=p=0.95:m=100[finalout]`,
          );
        }
        mixLabel = '[finalout]';

      } else if (hasVoice) {
        // Voice + video audio, no background music
        filters.push(
          `[voiceout][videoaudio]amix=inputs=2:normalize=0,` +
          `afade=t=out:st=${fadeStart}:d=${fadeDur}[finalout]`,
        );
        mixLabel = '[finalout]';

      } else {
        // Only video audio (no bg music, no voice notes)
        filters.push(
          `[videoaudio]afade=t=out:st=${fadeStart}:d=${fadeDur}[finalout]`,
        );
        mixLabel = '[finalout]';
      }

      await ff([
        '-y', '-i', silentMovie,
        ...audioInputs,
        '-filter_complex', filters.join(';'),
        '-map', '0:v',
        '-map', mixLabel,
        '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '192k', '-ac', '2', '-ar', '44100',
        '-shortest', '-movflags', '+faststart',
        finalMovie,
      ], 300000, 'audio-mix');
      console.log('[movie] Audio mix done');
    } else {
      fs.copyFileSync(silentMovie, finalMovie);
      console.log('[movie] Silent movie (no audio sources)');
    }

    // ── 8. Thumbnail ──────────────────────────────────────────────────────────
    const thumbPath = path.join(tmpDir, 'thumb.jpg');
    try {
      await ff([
        '-y', '-i', finalMovie,
        '-ss', '00:00:02', '-vframes', '1',
        '-vf', 'scale=1280:720', thumbPath,
      ], 20000, 'thumbnail');
    } catch (e) { console.warn('[movie] thumbnail failed:', e.message); }

    // ── 9. Stats ───────────────────────────────────────────────────────────────
    const probeOut2 = await execFileAsync('ffprobe', [
      '-v', 'quiet', '-print_format', 'json', '-show_format', finalMovie,
    ], { timeout: 15000 });
    const fmt           = JSON.parse(probeOut2.stdout).format;
    const durationSecs  = Math.round(parseFloat(fmt.duration) || 0);
    const fileSizeBytes = parseInt(fmt.size, 10) || fs.statSync(finalMovie).size;
    console.log(`[movie] Final: ${durationSecs}s, ${Math.round(fileSizeBytes / 1024 / 1024)}MB`);

    // ── 10. Upload to Cloudinary ───────────────────────────────────────────────
    const publicId = `thankeeu/movies/card_${card.id}_${Date.now()}`;
    console.log(`[movie] Uploading → ${publicId}`);
    const uploadResult = await cloudinary.uploader.upload(finalMovie, {
      resource_type: 'video',
      public_id:     publicId,
      overwrite:     true,
      timeout:       600000,
    });

    let thumbUrl = null;
    if (fs.existsSync(thumbPath)) {
      try {
        const tu = await cloudinary.uploader.upload(thumbPath, {
          resource_type: 'image',
          public_id:     `${publicId}_thumb`,
          overwrite:     true,
        });
        thumbUrl = tu.secure_url;
      } catch (e) { console.warn('[movie] thumb upload failed:', e.message); }
    }

    console.log(`[movie] SUCCESS → ${uploadResult.secure_url}`);
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

/** Make a filesystem-safe name fragment */
function escFileName(name) {
  return String(name || 'unknown').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
}

module.exports = { renderMovie };
