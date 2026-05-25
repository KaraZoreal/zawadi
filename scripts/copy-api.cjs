const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    if (item.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy api/ directory into dist/ so Vercel can find serverless functions
const rootDir = path.join(__dirname, '..');
const apiSrc = path.join(rootDir, 'api');
const apiDest = path.join(rootDir, 'dist', 'api');

if (fs.existsSync(apiSrc)) {
  copyDir(apiSrc, apiDest);
  console.log('Copied api/ to dist/api/');
} else {
  console.log('No api/ directory found, skipping');
}
