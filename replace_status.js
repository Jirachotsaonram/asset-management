const fs = require('fs');
const path = require('path');

const directories = [
  'd:/xampp_assets/htdocs/asset-management/asset-frontend/src',
  'd:/xampp_assets/htdocs/asset-management/asset-mobile/src',
  'd:/xampp_assets/htdocs/asset-management/asset_management_api',
];

const extensions = ['.js', '.jsx', '.php', '.sql'];

function replaceInDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      replaceInDirectory(fullPath);
    } else if (extensions.includes(path.extname(fullPath))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('ใช้งานได้')) {
        content = content.replace(/ใช้งานได้/g, 'ใช้งาน');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

for (const dir of directories) {
  replaceInDirectory(dir);
}

console.log('Replacement complete.');
