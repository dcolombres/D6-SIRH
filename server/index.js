const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const {
  initSirhDb,
  listModulos,
  upsertModulo,
  deleteModulo,
  getCatalogos,
  getDbPath,
  getStats,
} = require('./sirh-db');
const { publishSirhToHelical } = require('./sirh-publish');

const APP_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(APP_ROOT, 'data');
const PORT = Number(process.env.PORT) || 3847;
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.wasm': 'application/wasm',
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (err) {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

function pingHelicalUrl(rawUrl) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      resolve({ ok: !!ok });
    };

    try {
      const u = new URL(String(rawUrl || '').trim());
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        done(false);
        return;
      }
      const lib = u.protocol === 'https:' ? https : http;
      const port = u.port ? Number(u.port) : (u.protocol === 'https:' ? 443 : 80);
      const req = lib.request({
        hostname: u.hostname,
        port,
        path: `${u.pathname || '/'}${u.search || ''}`,
        method: 'GET',
        timeout: 5000,
        rejectUnauthorized: false,
        headers: { Accept: 'text/html,*/*' },
      }, (res) => {
        res.resume();
        done(res.statusCode > 0 && res.statusCode < 500);
      });
      req.on('error', () => done(false));
      req.on('timeout', () => {
        req.destroy();
        done(false);
      });
      req.end();
    } catch (_) {
      done(false);
    }
  });
}

function serveStatic(req, res, urlPath) {
  let rel = urlPath === '/' ? '/pages/index.html' : urlPath;
  const safeRel = path.normalize(rel).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(APP_ROOT, safeRel);

  if (!filePath.startsWith(APP_ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

async function handleApi(req, res, pathname, searchParams) {
  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, { ok: true, app: 'D6', db: getDbPath() });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/sirh/modulos') {
    sendJson(res, 200, { ok: true, rows: listModulos() });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/sirh/catalogos') {
    sendJson(res, 200, getCatalogos());
    return;
  }

  if (req.method === 'GET' && pathname === '/api/sirh/stats') {
    sendJson(res, 200, { ok: true, stats: getStats() });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/sirh/db-path') {
    sendJson(res, 200, { ok: true, path: getDbPath() });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/sirh/modulos') {
    try {
      const payload = await readJsonBody(req);
      const row = upsertModulo(payload);
      sendJson(res, 200, { ok: true, row });
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err.message || String(err) });
    }
    return;
  }

  if (req.method === 'DELETE' && pathname.startsWith('/api/sirh/modulos/')) {
    const id = pathname.split('/').pop();
    try {
      sendJson(res, 200, deleteModulo(id));
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err.message || String(err) });
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/sirh/publish') {
    try {
      const result = await publishSirhToHelical(APP_ROOT);
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 500, { ok: false, published: false, error: err.message || String(err) });
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/helical/ping') {
    const url = searchParams.get('url') || '';
    const result = await pingHelicalUrl(url);
    sendJson(res, 200, result);
    return;
  }

  sendJson(res, 404, { ok: false, error: 'API not found' });
}

function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const rawUrl = req.url || '/';
      const parsed = new URL(rawUrl, `http://${HOST}:${PORT}`);
      const pathname = decodeURIComponent(parsed.pathname);

      if (pathname.startsWith('/api/')) {
        await handleApi(req, res, pathname, parsed.searchParams);
        return;
      }

      serveStatic(req, res, pathname);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) {
        sendJson(res, 500, { ok: false, error: 'Server error' });
      }
    }
  });
}

function openBrowser(url) {
  if (process.env.D6_NO_OPEN === '1') return;
  const cmd = process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, { windowsHide: true }, () => {});
}

async function main() {
  await initSirhDb(DATA_DIR);
  const server = createServer();
  server.listen(PORT, HOST, () => {
    const url = `http://${HOST}:${PORT}/pages/index.html`;
    console.log(`D6 listo en ${url}`);
    console.log(`SQLite: ${getDbPath()}`);
    openBrowser(url);
  });
}

main().catch((err) => {
  console.error('No se pudo iniciar D6:', err);
  process.exit(1);
});
