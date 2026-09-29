const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support expo-sqlite on web by treating wasm as an asset extension
config.resolver.assetExts.push('wasm');

// Dev-only same-origin proxy for the Expo web preview.
//
// The real backend (FastAPI, http://localhost:8000) has a CORS allowlist
// that only includes http://localhost:3000 and http://localhost:8000
// (see backend/app/config.py). The Expo web dev server runs on a different
// port, so browser fetch() calls straight to localhost:8000 fail CORS
// preflight and the app correctly falls back to mockData.ts.
//
// Native (iOS/Android) builds don't go through a browser, so CORS never
// applies there - this proxy only matters for `expo start --web`.
//
// Rather than touch backend/ (out of scope / owned by another workstream),
// proxy same-origin requests through this dev server: the browser calls
// this origin's /api-proxy/* (no CORS involved), and this Node-side
// middleware forwards the request to the real backend server-to-server.
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url && req.url.startsWith('/api-proxy/')) {
        const http = require('http');
        const targetPath = req.url.replace(/^\/api-proxy/, '');
        const proxyReq = http.request(
          {
            host: 'localhost',
            port: 8000,
            path: targetPath,
            method: req.method,
            headers: { ...req.headers, host: 'localhost:8000' },
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
          }
        );
        proxyReq.on('error', (err) => {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ detail: `Proxy error reaching backend: ${err.message}` }));
        });
        req.pipe(proxyReq, { end: true });
        return;
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
