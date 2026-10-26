import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Proxy endpoint for Roblox APIs to avoid browser CORS restrictions
  app.get('/api/roblox-proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      res.status(400).json({ error: 'Missing target url parameter' });
      return;
    }

    try {
      const parsed = new URL(targetUrl);
      const isRoblox =
        parsed.hostname.endsWith('roblox.com') ||
        parsed.hostname.endsWith('rbxcdn.com');

      if (!isRoblox) {
        res.status(400).json({ error: 'Target host must be a Roblox domain' });
        return;
      }

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        res.status(response.status).json({
          error: `Roblox API error (${response.status})`,
          details: errorText,
        });
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        res.json(data);
      } else {
        const text = await response.text();
        res.send(text);
      }
    } catch (error) {
      console.error('Roblox Proxy error:', error);
      res.status(500).json({ error: error.message || 'Internal proxy error' });
    }
  });

  // POST proxy for Roblox endpoints
  app.post('/api/roblox-proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      res.status(400).json({ error: 'Missing target url parameter' });
      return;
    }

    try {
      const parsed = new URL(targetUrl);
      if (!parsed.hostname.endsWith('roblox.com')) {
        res.status(400).json({ error: 'Target host must be a Roblox domain' });
        return;
      }

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
