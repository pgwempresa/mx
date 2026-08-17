const { envFirst, setCors, sendJson, readBody } = require('./_lib');

const XPAG_DEFAULT_BASE_URL = 'https://api.xpagamentos.com';
const XPAG_SANDBOX_CLIENT_ID = 'xpagsandbox_00000000';
const XPAG_SANDBOX_CLIENT_SECRET = '202620262026202620262026';

function cleanDigits(value) {
  return String(value || '').replace(/\D+/g, '');
}

function cleanDocument(value) {
  return String(value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 18);
}

function buildExternalId(input) {
  const raw = input.external_id || input.idempotency_key || ('MX-LAB-' + Date.now());
  return String(raw).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 80) || ('MX-LAB-' + Date.now());
}

function getXpagConfig() {
  const requestedMode = String(envFirst(['XPAG_MODE', 'XPAG_ENV'], '')).toLowerCase();
  const realClientId = envFirst(['XPAG_CLIENT_ID', 'XPAGAMENTOS_CLIENT_ID']);
  const realClientSecret = envFirst(['XPAG_CLIENT_SECRET', 'XPAGAMENTOS_CLIENT_SECRET']);
  const hasRealCredentials = Boolean(realClientId && realClientSecret);
  const useLive = requestedMode === 'sandbox' ? false : hasRealCredentials;
  const clientId = useLive ? realClientId : XPAG_SANDBOX_CLIENT_ID;
  const clientSecret = useLive ? realClientSecret : XPAG_SANDBOX_CLIENT_SECRET;
  return {
    mode: useLive ? 'live' : 'sandbox',
    baseUrl: envFirst(['XPAG_BASE_URL', 'XPAGAMENTOS_BASE_URL'], XPAG_DEFAULT_BASE_URL).replace(/\/$/, ''),
    clientId,
    clientSecret,
    liveRequested: requestedMode === 'live' || hasRealCredentials,
    liveEnabled: useLive
  };
}

function normalizeXpagResponse(body, requestPayload, gatewayPayload, config) {
  const transactionId = body.transaction_id || body.request_number || body.reference || requestPayload.external_id;
  return {
    ok: body.ok !== false,
    sandbox: config.mode !== 'live',
    id: transactionId,
    transaction_id: transactionId,
    transactionId,
    request_number: body.request_number || null,
    external_id: body.external_id || requestPayload.external_id,
    status: String(body.status || 'pending').toUpperCase(),
    method: 'spei',
    paymentMethod: 'SPEI',
    amount: body.amount ?? requestPayload.amount,
    fee: body.fee ?? null,
    currency: body.currency || 'MXN',
    reference: body.reference || body.copy_paste || '',
    copy_code: body.clabe || body.copy_paste || body.reference || '',
    qr_code: body.clabe || body.copy_paste || body.reference || '',
    clabe: body.clabe || '',
    bank_name: body.bank_name || 'STP (Sistema de Transferencia y Pagos)',
    beneficiary: body.beneficiary || 'XPAG Sandbox',
    referenceData: {
      clabe: body.clabe || '',
      entity: body.bank_name || 'STP (Sandbox)',
      reference: body.reference || '',
      bank_name: body.bank_name || 'STP (Sistema de Transferencia y Pagos)',
      beneficiary: body.beneficiary || 'XPAG Sandbox'
    },
    entity: body.bank_name || 'STP (Sandbox)',
    payer: requestPayload.payer,
    _gateway: 'xpag',
    _gateway_mode: config.mode,
    _sandbox_only: config.mode !== 'live',
    _created_by_gateway: true,
    _verified_by_gateway: false,
    _gateway_request: gatewayPayload,
    _raw_gateway_response: body
  };
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      route: 'xpag-cashin',
      mode: getXpagConfig().mode,
      gateway: 'XPag',
      currency: 'MXN'
    });
  }
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });

  try {
    const input = await readBody(req);
    const amount = Number(input.amount);
    const payer = { ...(input.payer || {}) };
    const name = String(payer.name || input.name || '').trim();
    const document = cleanDocument(payer.document || payer.curp || payer.rfc || input.document);

    if (!Number.isFinite(amount) || amount <= 0) {
      return sendJson(res, 422, { error: 'Monto MXN invalido para XPag sandbox.', missing_fields: ['amount'] });
    }
    if (name.length < 3) {
      return sendJson(res, 422, { error: 'Nombre incompleto para XPag sandbox.', missing_fields: ['name'] });
    }
    if (document.length < 10) {
      return sendJson(res, 422, { error: 'Documento mexicano incompleto para XPag sandbox.', missing_fields: ['document'] });
    }
    const config = getXpagConfig();
    if (!config.clientId || !config.clientSecret) {
      return sendJson(res, 500, {
        error: 'Credenciales XPag ausentes.',
        missing_fields: ['XPAG_CLIENT_ID', 'XPAG_CLIENT_SECRET'],
        mode: config.mode
      });
    }

    const origin = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const requestPayload = {
      currency: 'MXN',
      amount: Math.round(amount * 100) / 100,
      name,
      document,
      description: 'plano premium',
      external_id: buildExternalId(input),
      payer: { name, document }
    };
    if (origin && !String(origin).includes('127.0.0.1') && !String(origin).includes('localhost')) {
      requestPayload.webhook_url = `${proto}://${origin}/api/xpag-webhook.php`;
    }

    const gatewayPayload = {
      currency: requestPayload.currency,
      amount: requestPayload.amount,
      name: requestPayload.name,
      document: requestPayload.document,
      description: requestPayload.description,
      external_id: requestPayload.external_id
    };
    if (requestPayload.webhook_url) gatewayPayload.webhook_url = requestPayload.webhook_url;

    const response = await fetch(config.baseUrl + '/cashin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': config.clientId,
        'X-Client-Secret': config.clientSecret,
        'User-Agent': 'pt-main-mexico-lab/1.0'
      },
      body: JSON.stringify(gatewayPayload),
      signal: AbortSignal.timeout(20000)
    });
    const text = await response.text();
    let body;
    try { body = JSON.parse(text || '{}'); } catch { body = { raw: text }; }

    if (!response.ok || body.ok === false) {
      return sendJson(res, response.status || 502, {
        error: 'XPag rechazo la creacion SPEI.',
        gateway_status: response.status,
        gateway_response: body,
        _gateway_mode: config.mode,
        _sandbox_only: config.mode !== 'live'
      });
    }
    if (!body.clabe && !body.reference && !body.transaction_id && !body.request_number) {
      return sendJson(res, 502, {
        error: 'XPag no devolvio referencia SPEI valida.',
        expected_fields: ['clabe', 'reference', 'transaction_id', 'request_number'],
        gateway_status: response.status,
        gateway_response: body,
        _gateway_mode: config.mode,
        _sandbox_only: config.mode !== 'live'
      });
    }

    return sendJson(res, 200, normalizeXpagResponse(body, requestPayload, gatewayPayload, config));
  } catch (error) {
    return sendJson(res, 502, {
      error: 'No fue posible contactar XPag.',
      details: error.message || String(error),
      _sandbox_only: false
    });
  }
};
