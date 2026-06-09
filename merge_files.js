const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function mergeDirs(source, target) {
  if (!fs.existsSync(source)) return;
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const items = fs.readdirSync(source);
  for (const item of items) {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);

    const stat = fs.statSync(sourcePath);
    if (stat.isDirectory()) {
      mergeDirs(sourcePath, targetPath);
    } else {
      // Copy and overwrite
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied ${sourcePath} to ${targetPath}`);
    }
  }
}

// 1. Merge components
mergeDirs(path.join(__dirname, 'components'), path.join(srcDir, 'components'));
// 2. Merge lib
mergeDirs(path.join(__dirname, 'lib'), path.join(srcDir, 'lib'));
// 3. Merge hooks
mergeDirs(path.join(__dirname, 'hooks'), path.join(srcDir, 'hooks'));

console.log("Merge completed. You can now delete the root components, lib, and hooks directories.");
