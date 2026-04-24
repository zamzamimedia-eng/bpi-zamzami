const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    username: 'root',
    host: '100.85.43.53',
    password: 'Jonggol100.',
    remotePath: '/www/wwwroot/bpi-app',
    zipName: 'bpi_deploy.zip',
    exclude: [
        'node_modules',
        '.next',
        '.git',
        'create_rca_table.js',
        'drop_billing.js',
        'migrate_billing.js',
        'rebrand.js',
        'cleanup_rebrand.js',
        'deploy.ps1',
        'deploy_aapanel.js',
        'bpi_deploy.zip',
        '.env.local',
        'test-db.js',
        'tmp_test_db.js',
        'public/uploads'
    ]
};

function run(cmd, options = {}) {
    console.log(`> ${cmd}`);
    return execSync(cmd, { stdio: 'inherit', ...options });
}

async function deploy() {
    try {
        console.log('--- Starting Deployment to aaPanel ---');

        // 1. Create Zip (Using PowerShell Compress-Archive for exclude support or just simple zip)
        console.log('\n[1/3] Creating zip archive...');
        // We use PowerShell to zip because it's easier to handle excludes in a one-liner on Windows
        // Actually, we'll use a more surgical approach: copy to a temp folder then zip
        const tempDirName = `temp_deploy_${Date.now()}`;
        const tempDir = path.join(__dirname, tempDirName);
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        fs.mkdirSync(tempDir);

        console.log('Copying files to temp directory...');
        const files = fs.readdirSync(__dirname);
        for (const file of files) {
            if (CONFIG.exclude.includes(file) || file.startsWith('temp_deploy')) continue;
            
            const src = path.join(__dirname, file);
            const dest = path.join(tempDir, file);
            
            if (fs.lstatSync(src).isDirectory()) {
                run(`xcopy "${src}" "${dest}" /E /I /H /Y /Q`);
            } else {
                fs.copyFileSync(src, dest);
            }
        }

        console.log('Zipping temp directory...');
        run(`powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${__dirname}\\${CONFIG.zipName}' -Force"`);
        fs.rmSync(tempDir, { recursive: true, force: true });

        // 2. Upload using pscp
        console.log('\n[2/3] Uploading to server via PSCP...');
        const hostKeyArg = '-hostkey "ssh-ed25519 255 SHA256:E5I2D5oWxzr5LrWypbZFroCLji1AXbZGhEWvjugserI"';
        run(`pscp -batch ${hostKeyArg} -pw ${CONFIG.password} "${__dirname}\\${CONFIG.zipName}" ${CONFIG.username}@${CONFIG.host}:/www/wwwroot/bpi-app.zip`);
        run(`pscp -batch ${hostKeyArg} -pw ${CONFIG.password} "${__dirname}\\remote_deploy.sh" ${CONFIG.username}@${CONFIG.host}:/www/wwwroot/remote_deploy.sh`);

        // 3. Setup on server via plink
        console.log('\n[3/3] Setting up on server via PLINK...');
        run(`plink -batch ${hostKeyArg} -pw ${CONFIG.password} ${CONFIG.username}@${CONFIG.host} "bash /www/wwwroot/remote_deploy.sh"`);

        console.log('\n--- Deployment Successfully Completed! ---');
        console.log(`Access at: http://${CONFIG.host}:3000`);
        
        // Cleanup local zip
        fs.unlinkSync(path.join(__dirname, CONFIG.zipName));

    } catch (err) {
        console.error('\nDeployment Failed!');
        console.error(err.message);
        process.exit(1);
    }
}

deploy();
