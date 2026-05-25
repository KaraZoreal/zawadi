const fs = require('fs');
const path = require('path');

function copyDir(src, dest, exclude = []) {
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude.includes(item.name)) continue;
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    if (item.isDirectory()) {
      copyDir(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const rootDir = path.join(__dirname, '..');

// Copy api/ into dist/ so Vercel can find serverless functions
const apiSrc = path.join(rootDir, 'api');
const apiDest = path.join(rootDir, 'dist', 'api');
if (fs.existsSync(apiSrc)) {
  copyDir(apiSrc, apiDest);
  console.log('Copied api/ to dist/api/');
}

// Copy server/ into dist/ so api/index.js can import its modules
const serverSrc = path.join(rootDir, 'server');
const serverDest = path.join(rootDir, 'dist', 'server');
if (fs.existsSync(serverSrc)) {
  // Exclude data/ (runtime data, gitignored)
  copyDir(serverSrc, serverDest, ['data']);
  console.log('Copied server/ to dist/server/');
}
