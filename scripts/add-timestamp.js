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

try {
  const files = fs.readdirSync(targetDir);

  files.forEach(file => {
    if (path.extname(file) === '.html') {
      const filePath = path.join(targetDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      const regex = new RegExp(`(<script\s+src="[^"]*\/${targetFile})(\?ver=[^"]*)?(">\s*<\/script>)`, 'g');
      const newContent = content.replace(regex, `$1?ver=${timestamp}$3`);

      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
  });
} catch (err) {
  console.error('Error processing files:', err);
  process.exit(1); // Exit with an error code for CI/CD pipelines
}
