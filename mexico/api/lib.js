function envFirst(keys, fallback = '') {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return fallback;
}

const kvUrl = envFirst(['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_KV_REST_API_URL']);
const kvToken = envFirst(['KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN', 'UPSTASH_KV_REST_API_TOKEN']);

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function setCors(res, extraHeaders = 'Content-Type') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', extraHeaders);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body || '{}'); } catch { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

async function kvGetJson(key) {
  if (!kvUrl || !kvToken || !key) return null;
  try {
    const response = await fetch(`${kvUrl.replace(/\/$/, '')}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${kvToken}` },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data && data.result ? JSON.parse(data.result) : null;
  } catch (error) {
    return null;
  }
}

async function kvSetJson(key, value, ttlSeconds = 86400) {
  if (!kvUrl || !kvToken || !key) return false;
  try {
    const response = await fetch(`${kvUrl.replace(/\/$/, '')}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: JSON.stringify(value), ex: ttlSeconds }),
      signal: AbortSignal.timeout(8000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

module.exports = { envFirst, kvUrl, kvToken, sendJson, setCors, readBody, kvGetJson, kvSetJson };
