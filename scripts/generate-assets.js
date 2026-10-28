#!/usr/bin/env node
/**
 * Brand asset generator for packmyholiday ("Lagoon & Sun").
 *
 * Draws the "sunrise case" mark from code (one geometry, several colourways),
 * writes the SVG sources to assets/brand/ and rasterises every app icon and
 * splash variant into assets/. No bitmap input: edit the geometry or the
 * palette below and re-run.
 *
 *   node scripts/generate-assets.js
 *
 * Outputs
 *   assets/icon.png                       iOS / general icon, 1024, opaque (App Store rejects alpha)
 *   assets/icon-dark.png                  iOS 18 dark appearance, 1024, opaque
 *   assets/icon-tinted.png                iOS 18 tinted appearance, 1024, opaque greyscale
 *   assets/android-icon-foreground.png    adaptive foreground, 1024, transparent, inside the 66% safe zone
 *   assets/android-icon-monochrome.png    Android 13+ themed icon, 1024, alpha-only silhouette
 *   assets/notification-icon.png          status-bar icon, 1024, white silhouette on transparent
 *   assets/splash-icon.png                splash logo, 1024, transparent (colour comes from app.json)
 *   assets/favicon.png                    web, 48
 *   assets/store/play-store-icon-512.png  Google Play listing icon
 *   assets/brand/*.svg                    vector sources
 *
 * The Android adaptive background is a flat colour in app.json
 * (android.adaptiveIcon.backgroundColor = LAGOON), so no background bitmap exists.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const BRAND = path.join(ASSETS, 'brand');
const STORE = path.join(ASSETS, 'store');

// ── Palette (keep in sync with src/theme/paperTheme.ts BRAND + darkTheme) ─────
const LAGOON = '#0B6B73';
const SUN = '#FFB627';
const INK = '#0E2A33';
const WHITE = '#FFFFFF';
const DARK_GROUND = '#0A1A20';
const DARK_PRIMARY = '#5CCBD1';
const DARK_SUN = '#FFC857';

// ── Geometry: 64x64 grid, content spans x 6..58, y 10..58 ─────────────────────
const HANDLE = 'M23 22v-6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6';
const SUN_SHAPE = 'M20 46a12 12 0 0 1 24 0z';
const RAYS = 'M32 31v-3.5M21.4 35.4l-2.5-2.5M42.6 35.4l2.5-2.5';
const HORIZON = { x: 14, y: 48.5, width: 36, height: 3.5, rx: 1.75 };
const MARK_CENTER = { x: 32, y: 34 }; // centre of the content box, in grid units

/**
 * One mark. `cutouts: true` punches the sun, rays and horizon out of the case
 * (transparent holes) instead of painting them: used for the silhouettes.
 */
function markGroup({ size, handle, body, sun, horizon, cutouts = false, id = 'm' }) {
  const s = size;
  const tx = 512 - MARK_CENTER.x * s;
  const ty = 512 - MARK_CENTER.y * s;
  const h = HORIZON;
  const horizonRect = `<rect x="${h.x}" y="${h.y}" width="${h.width}" height="${h.height}" rx="${h.rx}"`;

  if (cutouts) {
    return `<g transform="translate(${tx} ${ty}) scale(${s})">
  <defs>
    <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
      <rect width="64" height="64" fill="#fff"/>
      <path d="${SUN_SHAPE}" fill="#000"/>
      <path d="${RAYS}" stroke="#000" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      ${horizonRect} fill="#000"/>
    </mask>
  </defs>
  <path d="${HANDLE}" fill="none" stroke="${handle}" stroke-width="4" stroke-linecap="round"/>
  <rect x="6" y="22" width="52" height="36" rx="10" fill="${body}" mask="url(#${id})"/>
</g>`;
  }

  return `<g transform="translate(${tx} ${ty}) scale(${s})">
  <path d="${HANDLE}" fill="none" stroke="${handle}" stroke-width="4" stroke-linecap="round"/>
  <rect x="6" y="22" width="52" height="36" rx="10" fill="${body}"/>
  <path d="${SUN_SHAPE}" fill="${sun}"/>
  <path d="${RAYS}" stroke="${sun}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
  ${horizonRect} fill="${horizon}"/>
</g>`;
}

function svg1024(inner, background) {
  const bg = background ? `<rect width="1024" height="1024" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
${bg}
${inner}
</svg>
`;
}

// scale = px per grid unit. Content is 52 units wide.
const ICON_SCALE = 12.2; // ~62% of the canvas: iOS applies its own corner mask
const SAFE_SCALE = 9.2; // diagonal of the 52x48 box stays inside the 676px (66%) safe circle
const SPLASH_SCALE = 16.5; // ~84% of the transparent splash canvas

const SOURCES = {
  // Full-colour mark on transparent, for in-app and web use.
  'logo-mark.svg': svg1024(
    markGroup({ size: ICON_SCALE * 1.4, handle: INK, body: LAGOON, sun: SUN, horizon: WHITE })
  ),
  'logo-mark-reversed.svg': svg1024(
    markGroup({ size: ICON_SCALE * 1.4, handle: WHITE, body: WHITE, sun: SUN, horizon: LAGOON })
  ),
  // iOS light: white case on Lagoon.
  'app-icon.svg': svg1024(
    markGroup({ size: ICON_SCALE, handle: WHITE, body: WHITE, sun: SUN, horizon: LAGOON }),
    LAGOON
  ),
  // iOS dark: lifted teal case on the dark ground.
  'app-icon-dark.svg': svg1024(
    markGroup({ size: ICON_SCALE, handle: DARK_PRIMARY, body: DARK_PRIMARY, sun: DARK_SUN, horizon: DARK_GROUND }),
    DARK_GROUND
  ),
  // iOS tinted: luminance only; the system applies the tint.
  'app-icon-tinted.svg': svg1024(
    markGroup({ size: ICON_SCALE, handle: '#FFFFFF', body: '#FFFFFF', sun: '#8C8C8C', horizon: '#000000' }),
    '#000000'
  ),
  // Android 13+ themed icon and status-bar icon: alpha is all that matters.
  'android-monochrome.svg': svg1024(
    markGroup({ size: SAFE_SCALE, handle: '#000000', body: '#000000', cutouts: true, id: 'mono' })
  ),
  'notification-icon.svg': svg1024(
    markGroup({ size: SAFE_SCALE, handle: WHITE, body: WHITE, cutouts: true, id: 'notif' })
  ),
  'splash-mark.svg': svg1024(
    markGroup({ size: SPLASH_SCALE, handle: INK, body: LAGOON, sun: SUN, horizon: WHITE })
  ),
};

// Android adaptive foreground: transparent, with the horizon as a real cut-out
// so the flat adaptive background shows through whatever colour it is. The
// shared cut-out path would also remove the sun, so this one is built explicitly.
SOURCES['android-foreground.svg'] = (() => {
  const s = SAFE_SCALE;
  const tx = 512 - MARK_CENTER.x * s;
  const ty = 512 - MARK_CENTER.y * s;
  const h = HORIZON;
  return svg1024(`<g transform="translate(${tx} ${ty}) scale(${s})">
  <defs>
    <mask id="fg" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
      <rect width="64" height="64" fill="#fff"/>
      <rect x="${h.x}" y="${h.y}" width="${h.width}" height="${h.height}" rx="${h.rx}" fill="#000"/>
    </mask>
  </defs>
  <path d="${HANDLE}" fill="none" stroke="${WHITE}" stroke-width="4" stroke-linecap="round"/>
  <rect x="6" y="22" width="52" height="36" rx="10" fill="${WHITE}" mask="url(#fg)"/>
  <path d="${SUN_SHAPE}" fill="${SUN}"/>
  <path d="${RAYS}" stroke="${SUN}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
</g>`);
})();

// ── Raster targets ────────────────────────────────────────────────────────────
const TARGETS = [
  { out: 'icon.png', src: 'app-icon.svg', size: 1024, opaque: true, note: 'iOS / general icon' },
  { out: 'icon-dark.png', src: 'app-icon-dark.svg', size: 1024, opaque: true, note: 'iOS dark appearance' },
  { out: 'icon-tinted.png', src: 'app-icon-tinted.svg', size: 1024, opaque: true, greyscale: true, note: 'iOS tinted appearance' },
  { out: 'android-icon-foreground.png', src: 'android-foreground.svg', size: 1024, note: 'Android adaptive foreground' },
  { out: 'android-icon-monochrome.png', src: 'android-monochrome.svg', size: 1024, note: 'Android themed (API 33+)' },
  { out: 'notification-icon.png', src: 'notification-icon.svg', size: 1024, note: 'Android notification, white silhouette' },
  { out: 'splash-icon.png', src: 'splash-mark.svg', size: 1024, note: 'Splash logo (transparent)' },
  { out: 'favicon.png', src: 'logo-mark.svg', size: 48, trim: true, note: 'Web favicon' },
  { out: path.join('store', 'play-store-icon-512.png'), src: 'app-icon.svg', size: 512, opaque: true, note: 'Google Play listing icon' },
];

async function main() {
  fs.mkdirSync(BRAND, { recursive: true });
  fs.mkdirSync(STORE, { recursive: true });

  for (const [name, content] of Object.entries(SOURCES)) {
    fs.writeFileSync(path.join(BRAND, name), content);
  }
  console.log(`\n  Wrote ${Object.keys(SOURCES).length} SVG sources to ${path.relative(ROOT, BRAND)}/\n`);

  for (const t of TARGETS) {
    let img = sharp(Buffer.from(SOURCES[t.src]), { density: 144 });
    if (t.trim) {
      // Favicon: crop the 1024 canvas to the mark with a little air, then resize.
      img = sharp(await img.trim().toBuffer()).extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } });
    }
    img = img.resize(t.size, t.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    if (t.opaque) img = img.flatten({ background: '#000000' }).removeAlpha();
    if (t.greyscale) img = img.greyscale();
    const outPath = path.join(ASSETS, t.out);
    await img.png({ compressionLevel: 9 }).toFile(outPath);
    const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
    console.log(`  ✓  ${t.out.padEnd(38)} ${String(t.size).padStart(4)}px  ${kb.padStart(7)} KB  ${t.note}`);
  }
  console.log('\n  Done. Run `npx expo start` to preview, or `npx expo prebuild --clean` to regenerate native icons.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
