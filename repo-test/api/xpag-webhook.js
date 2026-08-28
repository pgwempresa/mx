const { setCors, sendJson, readBody, kvSetJson } = require('./_lib');

function normalizeXpagStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  if (['confirmed', 'completed', 'paid', 'approved', 'success'].includes(value)) return 'COMPLETED';
  if (['expired'].includes(value)) return 'EXPIRED';
  if (['failed', 'refused', 'declined', 'canceled', 'cancelled'].includes(value)) return 'FAILED';
  if (value === 'med') return 'MED';
  return 'PENDING';
}

function localCache() {
  globalThis.__MX_XPAG_CACHE = globalThis.__MX_XPAG_CACHE || new Map();
  return globalThis.__MX_XPAG_CACHE;
}

function saveLocal(key, value) {
  if (key) localCache().set(key, value);
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') return sendJson(res, 200, { ok: true, route: 'xpag-webhook', mode: 'sandbox-only' });
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });

  const body = await readBody(req);
  const transactionId = body.transaction_id || body.id || body.request_number || body.external_id;
  const payload = {
    ...body,
    ok: body.ok !== false,
    sandbox: true,
    id: transactionId,
    transaction_id: transactionId,
    transactionId,
    status: normalizeXpagStatus(body.status),
    xpag_status: body.status || null,
    method: 'spei',
    paymentMethod: 'SPEI',
    currency: body.currency || 'MXN',
    _gateway: 'xpag',
    _sandbox_only: true,
    _verified_by_gateway: true,
    _webhook_received_at: new Date().toISOString()
  };

  if (transactionId) {
    saveLocal('tx:' + transactionId, payload);
    saveLocal('xpag:tx:' + transactionId, payload);
    await kvSetJson('tx:' + transactionId, payload);
  }
  if (body.request_number) {
    saveLocal('xpag:req:' + body.request_number, payload);
    await kvSetJson('xpag:req:' + body.request_number, payload);
  }
  if (body.external_id) {
    saveLocal('xpag:ext:' + body.external_id, payload);
    await kvSetJson('xpag:ext:' + body.external_id, payload);
  }
  return sendJson(res, 200, { ok: true });
};
