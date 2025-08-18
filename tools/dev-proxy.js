// Simple dev proxy to bypass CORS for API and asset fetches
// Usage: node tools/dev-proxy.js
// Proxies GET/HEAD via /proxy?url=<encoded>

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = process.env.DEV_PROXY_PORT ? Number(process.env.DEV_PROXY_PORT) : 8001;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
}

function proxy(req, res) {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'OPTIONS') { setCors(res); res.writeHead(204); res.end(); return; }
    if (urlObj.pathname !== '/proxy') { res.writeHead(404); res.end('not found'); return; }
    const target = urlObj.searchParams.get('url');
    if (!target) { res.writeHead(400); res.end('missing url'); return; }
    const t = new URL(target);
    const lib = t.protocol === 'https:' ? https : http;
    const headers = {};
    if (req.headers['range']) headers['Range'] = req.headers['range'];
    const opts = { method: req.method === 'HEAD' ? 'HEAD' : 'GET', headers };
    const p = lib.request(t, opts, (pr) => {
      setCors(res);
      const status = pr.statusCode || 502;
      const copyHeaders = {};
      for (const [k, v] of Object.entries(pr.headers)) {
        if (k.toLowerCase() === 'content-length' && v) copyHeaders['Content-Length'] = v;
        if (k.toLowerCase() === 'content-type' && v) copyHeaders['Content-Type'] = v;
        if (k.toLowerCase() === 'accept-ranges' && v) copyHeaders['Accept-Ranges'] = v;
        if (k.toLowerCase() === 'content-range' && v) copyHeaders['Content-Range'] = v;
        if (k.toLowerCase() === 'etag' && v) copyHeaders['ETag'] = v;
        if (k.toLowerCase() === 'last-modified' && v) copyHeaders['Last-Modified'] = v;
        if (k.toLowerCase() === 'cache-control' && v) copyHeaders['Cache-Control'] = v;
      }
      res.writeHead(status, copyHeaders);
      pr.pipe(res);
    });
    p.on('error', (e) => { setCors(res); res.writeHead(502); res.end(String(e.message || e)); });
    p.end();
  } catch (e) {
    setCors(res); res.writeHead(500); res.end(String(e.message || e));
  }
}

http.createServer(proxy).listen(PORT, () => {
  console.log(`[dev-proxy] listening on http://localhost:${PORT}`);
});



