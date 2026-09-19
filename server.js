// Groove — local dev server
// Double-click "Start Groove.bat" or run:  node server.js

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const ROOT = __dirname;
const URL  = `http://localhost:${PORT}`;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.mp3':  'audio/mpeg',
  '.mp4':  'video/mp4',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const file = path.join(ROOT, urlPath);

  // Prevent path traversal
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.stat(file, (statErr, stat) => {
    if (statErr || !stat.isFile()) { res.writeHead(404); res.end('Not found'); return; }

    const ext  = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const size = stat.size;

    // Handle Range requests (needed for audio/video seeking)
    const rangeHeader = req.headers['range'];
    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end   = match[2] ? parseInt(match[2], 10) : size - 1;
        const chunkSize = end - start + 1;
        res.writeHead(206, {
          'Content-Type':  type,
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Cache-Control': 'no-cache',
        });
        fs.createReadStream(file, { start, end }).pipe(res);
        return;
      }
    }

    res.writeHead(200, {
      'Content-Type':  type,
      'Content-Length': size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Groove is running → ${URL}\n`);
  // Open browser automatically
  const open = process.platform === 'win32'  ? `start "" "${URL}"` :
               process.platform === 'darwin' ? `open "${URL}"` : `xdg-open "${URL}"`;
  exec(open);
});
