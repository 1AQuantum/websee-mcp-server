#!/usr/bin/env node
/**
 * Simple HTTP server for testing WebSee MCP tools
 * Serves test HTML files on localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const TEST_PAGES_DIR = __dirname;

const server = http.createServer((req, res) => {
  let filePath = path.join(TEST_PAGES_DIR, req.url === '/' ? 'index.html' : req.url);

  const extname = path.extname(filePath);
  const contentType = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
  }[extname] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}/`);
  console.log('Available test pages:');
  console.log('  - http://localhost:3000/react-app.html');
  console.log('  - http://localhost:3000/minified-error.html');
  console.log('  - http://localhost:3000/network-test.html');
});
