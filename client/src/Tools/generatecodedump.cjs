// tools/generateCodeDump.cjs
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const publicFiles = [
];

function readFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      readFiles(fullPath);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.css') || entry.name.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      console.log(\n--- FILE: ${path.relative('.', fullPath)} ---\n);
      console.log(content);
    }
  });
}

function dumpFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(\n--- FILE: ${path.relative('.', filePath)} ---\n);
    console.log(content);
  } else {
    console.warn(Warning: File not found - ${filePath});
  }
}

// Dump files from src/
readFiles(srcDir);

// Dump specific public files
publicFiles.forEach(dumpFile);