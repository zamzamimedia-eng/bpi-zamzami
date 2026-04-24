const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\haram\\OneDrive\\Documents\\A HOLDING\\BPI\\bpi-app';
const targetDirs = ['src'];
const targetFiles = ['package.json', 'package-lock.json'];

const replacements = [
    { from: /Jampack/g, to: 'BPI YZI' },
    { from: /jampack/g, to: 'bpi-yzi' }
];

const extensions = ['.js', '.jsx', '.json', '.html', '.css', '.scss', '.md', '.mjs'];

function processFile(filePath) {
    if (!extensions.includes(path.extname(filePath))) return;
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;
        
        replacements.forEach(r => {
            if (r.from.test(content)) {
                content = content.replace(r.from, r.to);
                changed = true;
            }
        });
        
        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    } catch (err) {
        console.error(`Error processing ${filePath}: ${err.message}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                walkDir(fullPath);
            }
        } else {
            processFile(fullPath);
        }
    });
}

// Process specific files
targetFiles.forEach(file => {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
        processFile(fullPath);
    }
});

// Process target directories
targetDirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) {
        walkDir(fullPath);
    }
});

console.log('Rebranding complete!');
