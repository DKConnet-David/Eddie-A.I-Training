// Lightweight Node.js server — serves static files + save/load API for playbook data

var http = require('http');
var fs = require('fs');
var path = require('path');

var PORT = 3008;
var DATA_DIR = '/data';
var DATA_FILE = path.join(DATA_DIR, 'playbooks.json');
var STATIC_ROOT = path.join(__dirname, 'public');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// MIME types
var MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res) {
  var filePath = path.join(STATIC_ROOT, req.url === '/' ? 'index.html' : req.url);

  // Prevent directory traversal
  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  var ext = path.extname(filePath).toLowerCase();
  var contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, function(err, data) {
    if (err) {
      // Try index.html for SPA fallback
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(STATIC_ROOT, 'index.html'), function(err2, data2) {
          if (err2) {
            res.writeHead(404);
            res.end('Not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data2);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function readBody(req, callback) {
  var body = '';
  req.on('data', function(chunk) { body += chunk; });
  req.on('end', function() { callback(body); });
}

function handleAPI(req, res) {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /api/load — load saved data
  if (req.method === 'GET' && req.url === '/api/load') {
    fs.readFile(DATA_FILE, 'utf8', function(err, data) {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ saved: false, data: null }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to read data' }));
        }
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ saved: true, data: JSON.parse(data) }));
    });
    return;
  }

  // POST /api/save — save playbook data
  if (req.method === 'POST' && req.url === '/api/save') {
    readBody(req, function(body) {
      try {
        var parsed = JSON.parse(body);

        // Add timestamp
        parsed._savedAt = new Date().toISOString();

        fs.writeFile(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf8', function(err) {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to save data' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, savedAt: parsed._savedAt }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // GET /api/status — health check
  if (req.method === 'GET' && req.url === '/api/status') {
    var hasSave = fs.existsSync(DATA_FILE);
    var savedAt = null;
    if (hasSave) {
      try {
        var d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        savedAt = d._savedAt || null;
      } catch(e) {}
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', hasSave: hasSave, savedAt: savedAt }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

var server = http.createServer(function(req, res) {
  if (req.url.startsWith('/api/')) {
    handleAPI(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, function() {
  console.log('Eddie AI Training server running on port ' + PORT);
});
