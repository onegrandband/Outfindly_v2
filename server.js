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

  // In-memory cache for Roblox GET proxy responses to prevent 429 rate limits
  const proxyCache = new Map();
  const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

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

      // Check cache first
      const now = Date.now();
      const cached = proxyCache.get(targetUrl);
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        if (cached.isJson) {
          res.json(cached.data);
        } else {
          res.type(cached.contentType).send(cached.data);
        }
        return;
      }

      const fetchWithRetry = async (retries = 1) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);

          const response = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, image/*, */*',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          });
          clearTimeout(timeout);

          if (response.status === 429 && retries > 0) {
            if (cached) {
              return { fromCache: true };
            }
            await new Promise((r) => setTimeout(r, 400));
            return fetchWithRetry(retries - 1);
          }
          return response;
        } catch (fetchErr) {
          if (cached) return { fromCache: true };
          throw fetchErr;
        }
      };

      const result = await fetchWithRetry();
      if (result.fromCache && cached) {
        if (cached.isJson) res.json(cached.data);
        else res.type(cached.contentType).send(cached.data);
        return;
      }

      const response = result;
      if (!response.ok) {
        // Handle 429 rate limit gracefully for critical avatar & inventory endpoints
        if (response.status === 429) {
          if (cached) {
            res.json(cached.data);
            return;
          }
          if (targetUrl.includes('currently-wearing')) {
            const fallback = { assetIds: [], rateLimited: true };
            proxyCache.set(targetUrl, { timestamp: now, isJson: true, data: fallback });
            res.json(fallback);
            return;
          }
          if (targetUrl.includes('/items/Asset/') || targetUrl.includes('/outfits')) {
            const fallback = { data: [], rateLimited: true, filteredCount: 0, total: 0 };
            proxyCache.set(targetUrl, { timestamp: now, isJson: true, data: fallback });
            res.json(fallback);
            return;
          }
        }

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
        proxyCache.set(targetUrl, {
          timestamp: now,
          isJson: true,
          contentType,
          data,
        });
        res.json(data);
      } else {
        const buffer = await response.arrayBuffer();
        const data = Buffer.from(buffer);
        proxyCache.set(targetUrl, {
          timestamp: now,
          isJson: false,
          contentType,
          data,
        });
        res.type(contentType).send(data);
      }
    } catch (error) {
      console.error('Roblox Proxy error:', error.message || error);
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
