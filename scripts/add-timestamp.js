const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'frontend', 'out');
const targetFile = 'apiClient.js';

// YYYYMMDDHHMMSS形式のタイムスタンプを生成 (UTC)
const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);

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
