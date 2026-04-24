const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\haram\\OneDrive\\Documents\\A HOLDING\\BPI\\bpi-app';
const targetDirs = ['src'];

const replacements = [
    // Fix broken variable names from first pass
    { from: /bpi-yziImg/g, to: 'bpiYziImg' },
    { from: /bpi-yziImgDark/g, to: 'bpiYziImgDark' },
    { from: /import bpi-yziImg/g, to: 'import bpiYziImg' },
    { from: /src={bpi-yziImg}/g, to: 'src={bpiYziImg}' },
    { from: /src={bpi-yziImgDark}/g, to: 'src={bpiYziImgDark}' },
    
    // Catch missed/typo strings
    { from: /JAMPACK20/g, to: 'BPIYZI20' },
    { from: /Jmapack/g, to: 'BPI YZI' },
    { from: /--font-jampack/g, to: '--font-bpi-yzi' }
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
            console.log(`Fixed: ${filePath}`);
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

// Process target directories
targetDirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) {
        walkDir(fullPath);
    }
});

console.log('Cleanup complete!');
