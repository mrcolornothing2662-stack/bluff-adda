// One Redis key per table. Works with Upstash Redis from the Vercel Marketplace.
const U = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const T = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = async (cmd) => {
  const r = await fetch(U, { method: 'POST', headers: { Authorization: 'Bearer ' + T }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
};
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!U || !T) return res.status(500).json({ error: 'Redis is not configured' });
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  const code = String((req.method === 'GET' ? req.query.code : body.code) || '').toUpperCase();
  if (!/^[A-Z]{4}$/.test(code)) return res.status(400).json({ error: 'bad code' });
  const key = 'bluff:' + code;
  try {
    if (req.method === 'GET') {
      const v = await redis(['GET', key]);
      return res.status(200).json(v ? { exists: true, data: JSON.parse(v) } : { exists: false });
    }
    if (req.method === 'POST') {
      const { op, data } = body;
      if (!data || typeof data !== 'object' || JSON.stringify(data).length > 200000) return res.status(400).json({ error: 'bad data' });
      let out = data;
      if (op === 'update') {
        const v = await redis(['GET', key]);
        if (!v) return res.status(404).json({ error: 'no such table' });
        out = { ...JSON.parse(v), ...data };
      } else if (op !== 'set') return res.status(400).json({ error: 'bad op' });
      await redis(['SET', key, JSON.stringify(out), 'EX', 86400]); // tables expire after 24h
      return res.status(200).json({ ok: true });
    }
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: 'store error' });
  }
};
