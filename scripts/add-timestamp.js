const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'frontend', 'out');
const targetFile = 'apiClient.js';

// YYYYMMDDHHMMSS形式のタイムスタンプを生成
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const seconds = String(now.getSeconds()).padStart(2, '0');
const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

console.log(`Updating script references in ${targetDir} with timestamp: ${timestamp}`);

fs.readdir(targetDir, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  files.forEach(file => {
    if (path.extname(file) === '.html') {
      const filePath = path.join(targetDir, file);
      fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
          console.error(`Error reading file ${file}:`, err);
          return;
        }

        const regex = new RegExp(`(<script\\s+src="[^"]*\\/${targetFile})(\\?ver=[^"]*)?(">\\s*<\\/script>)`, 'g');
        if (regex.test(content)) {
          const newContent = content.replace(regex, `$1?ver=${timestamp}$3`);
          fs.writeFile(filePath, newContent, 'utf8', (err) => {
            if (err) {
              console.error(`Error writing file ${file}:`, err);
            } else {
              console.log(`Updated ${file}`);
            }
          });
        }
      });
    }
  });
});
