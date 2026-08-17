const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 3000);

const apiRoutes = {
  '/api/xpag-cashin.php': './api/xpag-cashin.js',
  '/api/xpag-status.php': './api/xpag-status.js',
  '/api/xpag-webhook.php': './api/xpag-webhook.js',
  '/mexico/api/xpag-cashin.php': './api/xpag-cashin.js',
  '/mexico/api/xpag-status.php': './api/xpag-status.js',
  '/mexico/api/xpag-webhook.php': './api/xpag-webhook.js',
};

const spaRoutes = new Set([
  '/checkout',
  '/checkout/',
  '/obrigado',
  '/obrigado/',
  '/mx-lab',
  '/mx-lab/',
  '/mexico',
  '/mexico/',
  '/mexico/resgatar',
  '/mexico/resgatar/',
  '/mexico/checkout',
  '/mexico/checkout/',
  '/mexico/confirmar-saque',
  '/mexico/confirmar-saque/',
  '/mexico/back-redirect',
  '/mexico/back-redirect/',
]);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = err.code === 'ENOENT' ? 404 : 500;
      res.end(err.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }
    res.setHeader('Content-Type', contentTypes[path.extname(filePath)] || 'application/octet-stream');
    res.end(data);
  });
}

function serveMxLab(res) {
  res.statusCode = 302;
  res.setHeader('Location', '/mexico');
  res.end();
}

function serveMexico(res) {
  return serveFile(res, path.join(root, 'mexico', 'index.html'));
}

function createApiRes(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
  };
  return res;
}

function routeStatic(req, res, pathname) {
  if (pathname === '/central.php') return serveFile(res, path.join(root, 'central.js'));
  if (pathname.startsWith('/mexico/assets/')) return serveFile(res, path.join(root, decodeURIComponent(pathname)));
  if (pathname === '/mexico' || pathname === '/mexico/' || pathname.startsWith('/mexico/')) return serveMexico(res);
  if (pathname === '/mx-lab' || pathname === '/mx-lab/') return serveMxLab(res);
  if (spaRoutes.has(pathname)) return serveFile(res, path.join(root, 'index.html'));

  let filePath = path.normalize(path.join(root, decodeURIComponent(pathname)));
  if (!filePath.startsWith(root)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }
  if (pathname === '/') filePath = path.join(root, 'index.html');
  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    serveFile(res, filePath);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const apiModule = apiRoutes[url.pathname];
  if (apiModule) {
    try {
      const handler = require(apiModule);
      await handler(req, createApiRes(res));
    } catch (error) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Local API error', details: error.message || String(error) }));
    }
    return;
  }
  if (url.pathname.startsWith('/mexico/assets/')) {
    return routeStatic(req, res, url.pathname);
  }
  if (url.pathname === '/mexico' || url.pathname === '/mexico/' || url.pathname.startsWith('/mexico/')) {
    return serveMexico(res);
  }
  if (url.searchParams.get('mx_lab') === '1' && !url.pathname.startsWith('/assets/') && !url.pathname.startsWith('/api/')) {
    const legacyMxRoutes = new Set(['/checkout', '/checkout/', '/confirmar-saque', '/confirmar-saque/', '/resgatar', '/resgatar/', '/back-redirect', '/back-redirect/']);
    if (legacyMxRoutes.has(url.pathname)) {
      const targetPath = '/mexico' + url.pathname.replace(/\/$/, '');
      res.statusCode = 302;
      res.setHeader('Location', targetPath + url.search);
      res.end();
      return;
    }
    res.statusCode = 302;
    res.setHeader('Location', '/mexico' + url.search);
    res.end();
    return;
  }
  routeStatic(req, res, url.pathname);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Local server running at http://127.0.0.1:${port}/`);
});
