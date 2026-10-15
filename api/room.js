// One Redis key per table. Works with Upstash Redis from the Vercel Marketplace or Upstash Console.
const U = process.env.KV_REST_API_URL || 
          process.env.UPSTASH_REDIS_REST_URL || 
          process.env.REDIS_REST_URL;

const T = process.env.KV_REST_API_TOKEN || 
          process.env.UPSTASH_REDIS_REST_TOKEN || 
          process.env.REDIS_REST_TOKEN;

const redis = async (cmd) => {
  if (!U || !T) throw new Error('Redis is not configured. Missing UPSTASH_REDIS_REST_URL or KV_REST_API_URL');
  const r = await fetch(U, { 
    method: 'POST', 
    headers: { 
      Authorization: 'Bearer ' + T,
      'Content-Type': 'application/json'
    }, 
    body: JSON.stringify(cmd) 
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
};

const safeJsonParse = (v) => {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch (_) {
    return v;
  }
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Health check endpoint for quick troubleshooting
  const isHealthCheck = (req.method === 'GET' && (
    (req.query && req.query.health) || 
    (req.url && req.url.includes('health=1'))
  ));

  if (isHealthCheck) {
    if (!U || !T) {
      return res.status(500).json({ 
        status: 'error', 
        redis: 'not_configured', 
        message: 'Redis is not configured. Please add Upstash Redis in your Vercel project storage/marketplace.' 
      });
    }
    try {
      await redis(['PING']);
      return res.status(200).json({ status: 'ok', redis: 'connected' });
    } catch (e) {
      return res.status(500).json({ status: 'error', redis: 'connection_failed', message: e.message });
    }
  }

  if (!U || !T) {
    return res.status(500).json({ 
      error: 'Redis is not configured',
      details: 'Please add Upstash Redis in your Vercel Project under Storage/Marketplace to enable multiplayer.' 
    });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }

  let code = '';
  if (req.method === 'GET') {
    if (req.query && req.query.code) {
      code = req.query.code;
    } else {
      try {
        const u = new URL(req.url, 'http://localhost');
        code = u.searchParams.get('code') || '';
      } catch (_) {}
    }
  } else {
    code = body.code || '';
  }
  code = String(code).toUpperCase().trim();

  if (!/^[A-Z]{4}$/.test(code)) {
    return res.status(400).json({ 
      error: 'bad code', 
      details: 'Table code must be exactly 4 letters (A-Z).' 
    });
  }

  const key = 'bluff:' + code;
  try {
    if (req.method === 'GET') {
      const v = await redis(['GET', key]);
      const data = safeJsonParse(v);
      return res.status(200).json(data ? { exists: true, data } : { exists: false });
    }
    if (req.method === 'POST') {
      const { op, data } = body;
      if (!data || typeof data !== 'object' || JSON.stringify(data).length > 200000) {
        return res.status(400).json({ error: 'bad data' });
      }
      let out = data;
      if (op === 'update') {
        const v = await redis(['GET', key]);
        if (!v) return res.status(404).json({ error: 'no such table' });
        const existing = safeJsonParse(v) || {};
        out = { ...existing, ...data };
      } else if (op !== 'set') {
        return res.status(400).json({ error: 'bad op' });
      }
      await redis(['SET', key, JSON.stringify(out), 'EX', 86400]); // tables expire after 24h
      return res.status(200).json({ ok: true });
    }
    return res.status(405).end();
  } catch (e) {
    console.error('Room API error:', e);
    return res.status(500).json({ error: 'store error', details: e.message });
  }
};
