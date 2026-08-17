const { envFirst, setCors, sendJson, readBody, kvGetJson, kvSetJson } = require('./_lib');

const XPAG_DEFAULT_BASE_URL = 'https://api.xpagamentos.com';
const XPAG_SANDBOX_CLIENT_ID = 'xpagsandbox_00000000';
const XPAG_SANDBOX_CLIENT_SECRET = '202620262026202620262026';

function cleanIdentifier(value) {
  return String(value || '').replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 120);
}

function localCache() {
  globalThis.__MX_XPAG_CACHE = globalThis.__MX_XPAG_CACHE || new Map();
  return globalThis.__MX_XPAG_CACHE;
}

function localGet(key) {
  return localCache().get(key) || null;
}

function localSet(key, value) {
  localCache().set(key, value);
}

function normalizeXpagStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  if (['confirmed', 'completed', 'paid', 'approved', 'success'].includes(value)) return 'COMPLETED';
  if (['expired'].includes(value)) return 'EXPIRED';
  if (['failed', 'refused', 'declined', 'canceled', 'cancelled'].includes(value)) return 'FAILED';
  if (value === 'med') return 'MED';
  return 'PENDING';
}

function getXpagConfig() {
  const requestedMode = String(envFirst(['XPAG_MODE', 'XPAG_ENV'], '')).toLowerCase();
  const realClientId = envFirst(['XPAG_CLIENT_ID', 'XPAGAMENTOS_CLIENT_ID']);
  const realClientSecret = envFirst(['XPAG_CLIENT_SECRET', 'XPAGAMENTOS_CLIENT_SECRET']);
  const hasRealCredentials = Boolean(realClientId && realClientSecret);
  const useLive = requestedMode === 'sandbox' ? false : hasRealCredentials;
  return {
    mode: useLive ? 'live' : 'sandbox',
    baseUrl: envFirst(['XPAG_BASE_URL', 'XPAGAMENTOS_BASE_URL'], XPAG_DEFAULT_BASE_URL).replace(/\/$/, ''),
    clientId: useLive ? realClientId : XPAG_SANDBOX_CLIENT_ID,
    clientSecret: useLive ? realClientSecret : XPAG_SANDBOX_CLIENT_SECRET
  };
}

function normalizeXpagPayload(body, fallback = {}, config = getXpagConfig()) {
  const payment = Array.isArray(body.payments) ? body.payments[0] : null;
  const source = payment || body || {};
  const transactionId = source.transaction_id || source.id || fallback.transaction_id || fallback.id || fallback.request_number;
  return {
    ok: body.ok !== false,
    sandbox: true,
    id: transactionId,
    transaction_id: transactionId,
    transactionId,
    request_number: source.request_number || fallback.request_number || null,
    external_id: source.external_id || fallback.external_id || null,
    status: normalizeXpagStatus(source.status),
    xpag_status: source.status || body.status || null,
    method: 'spei',
    paymentMethod: 'SPEI',
    amount: source.amount ?? body.amount ?? fallback.amount ?? null,
    fee: source.fee ?? body.fee ?? null,
    currency: source.currency || body.currency || 'MXN',
    clabe: source.clabe || body.clabe || fallback.clabe || '',
    bank_name: source.bank_name || body.bank_name || fallback.bank_name || 'STP (Sandbox)',
    beneficiary: source.beneficiary || body.beneficiary || fallback.beneficiary || 'XPAG SANDBOX',
    reference: source.reference || body.reference || fallback.reference || '',
    _gateway: 'xpag',
    _gateway_mode: config.mode,
    _sandbox_only: config.mode !== 'live',
    _verified_by_gateway: true,
    _gateway_checked_at: new Date().toISOString(),
    _raw_gateway_response: body
  };
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET' && !req.url.includes('?')) {
    return sendJson(res, 200, { ok: true, route: 'xpag-status', mode: getXpagConfig().mode });
  }
  if (!['GET', 'POST'].includes(req.method)) return sendJson(res, 405, { error: 'method not allowed' });

  try {
    const input = req.method === 'POST' ? await readBody(req) : {};
    const currentUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
    const transactionId = cleanIdentifier(input.transaction_id || input.transactionId || input.id || currentUrl.searchParams.get('transaction_id') || currentUrl.searchParams.get('transactionId') || currentUrl.searchParams.get('id'));
    const requestNumber = cleanIdentifier(input.request_number || currentUrl.searchParams.get('request_number'));
    const externalId = cleanIdentifier(input.external_id || currentUrl.searchParams.get('external_id'));

    if (!transactionId && !requestNumber && !externalId) {
      return sendJson(res, 400, { error: 'transaction_id, request_number ou external_id é obrigatório.' });
    }

    const cacheKeys = [transactionId && `xpag:tx:${transactionId}`, requestNumber && `xpag:req:${requestNumber}`, externalId && `xpag:ext:${externalId}`].filter(Boolean);
    for (const key of cacheKeys) {
      const cached = localGet(key) || await kvGetJson(key);
      if (cached && normalizeXpagStatus(cached.status) === 'COMPLETED') return sendJson(res, 200, cached);
    }

    const config = getXpagConfig();
    if (!config.clientId || !config.clientSecret) {
      return sendJson(res, 500, {
        error: 'Credenciales XPag ausentes.',
        missing_fields: ['XPAG_CLIENT_ID', 'XPAG_CLIENT_SECRET'],
        mode: config.mode
      });
    }

    const query = new URLSearchParams();
    if (transactionId) query.set('transaction_id', transactionId);
    else if (requestNumber) query.set('request_number', requestNumber);
    else query.set('external_id', externalId);

    const response = await fetch(`${config.baseUrl}/consult-transaction?${query.toString()}`, {
      headers: {
        'X-Client-Id': config.clientId,
        'X-Client-Secret': config.clientSecret,
        'User-Agent': 'pt-main-mexico-lab/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });
    const text = await response.text();
    let body;
    try { body = JSON.parse(text || '{}'); } catch { body = { raw: text }; }

    if (!response.ok || body.ok === false) {
      return sendJson(res, response.status || 502, {
        error: 'XPag rejeitou a consulta SPEI.',
        gateway_status: response.status,
        gateway_response: body,
        _gateway_mode: config.mode,
        _sandbox_only: config.mode !== 'live'
      });
    }

    const payload = normalizeXpagPayload(body, input, config);
    for (const key of cacheKeys) {
      localSet(key, payload);
      await kvSetJson(key, payload);
    }
    if (payload.transaction_id) {
      localSet('tx:' + payload.transaction_id, payload);
      await kvSetJson('tx:' + payload.transaction_id, payload);
    }
    return sendJson(res, 200, payload);
  } catch (error) {
    return sendJson(res, 502, {
      error: 'No fue posible consultar XPag.',
      details: error.message || String(error),
      _sandbox_only: false
    });
  }
};
