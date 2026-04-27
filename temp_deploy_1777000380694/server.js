require('dotenv').config();
const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');
const next = require('next');

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, hostname: 'localhost', port });
const handle = app.getRequestHandler();

// MIME types for static files
const MIME_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
};

app.prepare().then(() => {
    console.log(`> BPI System: Next.js prepared (mode: ${process.env.NODE_ENV})`);
    createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            
            // Serve /uploads/* directly from public/uploads, bypassing Next.js cache
            if (parsedUrl.pathname.startsWith('/uploads/')) {
                const filePath = path.join(process.cwd(), 'public', parsedUrl.pathname);
                const safePath = path.resolve(filePath);
                const publicDir = path.join(process.cwd(), 'public');
                
                // Security: prevent directory traversal
                if (!safePath.startsWith(publicDir)) {
                    res.statusCode = 403;
                    res.end('Forbidden');
                    return;
                }
                
                try {
                    const stat = fs.statSync(safePath);
                    if (stat.isFile()) {
                        const ext = path.extname(safePath).toLowerCase();
                        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
                        res.writeHead(200, {
                            'Content-Type': contentType,
                            'Content-Length': stat.size,
                            'Cache-Control': 'public, max-age=86400',
                        });
                        fs.createReadStream(safePath).pipe(res);
                        return;
                    }
                } catch (e) {
                    // File not found, fall through to Next.js
                }
            }
            
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('ERROR during request handling:', err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    }).listen(port, (err) => {
        if (err) throw err;
        console.log(`> BPI System ready on port ${port}`);
    });
}).catch(err => {
    console.error('CRITICAL: Next.js failed to prepare!', err);
    process.exit(1);
});
