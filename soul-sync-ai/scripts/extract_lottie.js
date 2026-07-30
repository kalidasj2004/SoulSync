const fs = require('fs');
const path = require('path');

const src = `C:\\Users\\ACER\\.gemini\\antigravity\\brain\\f4fa4326-8c52-4e38-a821-e9a3325d9b85\\.system_generated\\steps\\741\\content.md`;
const destDir = path.join(__dirname, '..', 'assets');
const dest = path.join(destDir, 'mascot.json');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const content = fs.readFileSync(src, 'utf8');
const lines = content.split('\n');
// Extract raw json which starts from line 9 (index 8) of content.md
const jsonLine = lines.slice(8).join('\n').trim();

try {
  // Try parsing to verify it is valid JSON
  JSON.parse(jsonLine);
  fs.writeFileSync(dest, jsonLine, 'utf8');
  console.log('SUCCESS: Extracted valid Lottie JSON to assets/mascot.json!');
} catch (e) {
  console.log('PARSING WARNING: writing raw string directly:', e.message);
  fs.writeFileSync(dest, jsonLine, 'utf8');
}
