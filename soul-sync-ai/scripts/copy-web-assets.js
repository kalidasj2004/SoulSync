const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) => {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

const webDir = path.join(__dirname, '..', 'web');
const distDir = path.join(__dirname, '..', 'dist');

console.log('[Build Script] Copying web/ static assets to dist/...');
copyRecursiveSync(webDir, distDir);

// Also copy icons directly to root of dist/ for maximum fallback compatibility
const iconsDir = path.join(webDir, 'icons');
if (fs.existsSync(iconsDir)) {
  fs.readdirSync(iconsDir).forEach((file) => {
    fs.copyFileSync(path.join(iconsDir, file), path.join(distDir, file));
  });
}

console.log('[Build Script] Successfully copied all PWA icons and web assets into dist/!');
