const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) => {
      // Do not overwrite index.html directly from web/ directory
      if (child === 'index.html' || child === 'index.html.template') return;
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    });
  } else {
    if (path.basename(src) === 'index.html' || path.basename(src) === 'index.html.template') return;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

const webDir = path.join(__dirname, '..', 'web');
const distDir = path.join(__dirname, '..', 'dist');

console.log('[Build Script] Copying web/ static PWA assets to dist/...');
copyRecursiveSync(webDir, distDir);

// Copy icons directly to root of dist/ for maximum fallback compatibility
const iconsDir = path.join(webDir, 'icons');
if (fs.existsSync(iconsDir)) {
  fs.readdirSync(iconsDir).forEach((file) => {
    const fullPath = path.join(iconsDir, file);
    if (!fs.statSync(fullPath).isDirectory()) {
      fs.copyFileSync(fullPath, path.join(distDir, file));
    }
  });
}

// Inject PWA & OpenGraph head tags into dist/index.html without breaking Expo JS script tags
const distIndexPath = path.join(distDir, 'index.html');
if (fs.existsSync(distIndexPath)) {
  let html = fs.readFileSync(distIndexPath, 'utf8');

  const pwaHeadTags = `
    <!-- PWA & App Icons -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="SoulSync" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />

    <!-- Open Graph & Social Cards -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://soul-sync-8wl3.vercel.app/" />
    <meta property="og:title" content="SoulSync AI" />
    <meta property="og:description" content="Empathetic Emotional Support & AI Companion" />
    <meta property="og:image" content="https://soul-sync-8wl3.vercel.app/og-image.jpg" />
    <meta property="og:site_name" content="SoulSync AI" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="https://soul-sync-8wl3.vercel.app/" />
    <meta property="twitter:title" content="SoulSync AI" />
    <meta property="twitter:description" content="Empathetic Emotional Support & AI Companion" />
    <meta property="twitter:image" content="https://soul-sync-8wl3.vercel.app/og-image.jpg" />

    <!-- Google Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Satisfy&display=swap" rel="stylesheet">
  `;

  if (!html.includes('/manifest.json')) {
    html = html.replace('</head>', `${pwaHeadTags}\n</head>`);
    fs.writeFileSync(distIndexPath, html, 'utf8');
    console.log('[Build Script] Injected PWA meta tags & icons into dist/index.html!');
  }
}

console.log('[Build Script] Successfully configured high-res PWA icons & web assets in dist/!');
