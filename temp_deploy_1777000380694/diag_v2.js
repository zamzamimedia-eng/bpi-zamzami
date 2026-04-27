const pool = require('./src/lib/db').default || require('./src/lib/db');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function check() {
    try {
        console.log('=== DATABASE CHECK ===');
        const [rows] = await pool.query('SELECT username, profile_photo FROM users');
        console.log(JSON.stringify(rows, null, 2));

        console.log('\n=== FILESYSTEM SCAN ===');
        const baseDir = join(process.cwd(), 'public', 'uploads');
        if (fs.existsSync(baseDir)) {
            console.log(`Contents of ${baseDir}:`);
            const items = fs.readdirSync(baseDir, { recursive: true });
            items.forEach(item => {
                const fullPath = join(baseDir, item);
                const stats = fs.statSync(fullPath);
                console.log(`${stats.isDirectory() ? '[D]' : '[F]'} ${item} - Mode: ${stats.mode.toString(8)}`);
            });
        } else {
            console.log(`Base directory NOT FOUND: ${baseDir}`);
        }

        console.log('\n=== PERMISSION CHECK ===');
        try {
            const whoami = execSync('whoami').toString().trim();
            console.log(`Current user: ${whoami}`);
            const lsOut = execSync('ls -la public/uploads').toString();
            console.log(lsOut);
        } catch (e) {
            console.log('Permission check command failed');
        }

    } catch (e) {
        console.error('DIAGNOSTIC ERROR:', e);
    }
    process.exit(0);
}

function join(...args) {
    return args.join('/');
}

check();
