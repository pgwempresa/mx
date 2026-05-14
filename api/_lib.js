const crypto = require('crypto');

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

async function readRawBody(req) {
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

function getRequestOrigin(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return host ? proto + '://' + host : '';
}

function normalizeStatus(status) {
  const normalized = String(status || '').trim().toUpperCase();
  if (['PAID', 'APPROVED', 'SUCCESS'].includes(normalized)) return 'COMPLETED';
  if (normalized === 'CANCELLED') return 'CANCELLED';
  return normalized || 'PENDING';
}

function isFinalStatus(status) {
  return ['COMPLETED', 'DECLINED', 'CANCELED', 'CANCELLED', 'FAILED', 'REFUSED', 'EXPIRED'].includes(normalizeStatus(status));
}

function cleanDigits(value) {
  return String(value || '').replace(/\D+/g, '');
}

function normalizeTrackingParameters(tracking = {}) {
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 'fbclid', 'fbp', 'fbc'];
  const result = {};
  for (const key of keys) result[key] = tracking[key] == null || tracking[key] === '' ? null : String(tracking[key]);
  return result;
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || String(req.headers['x-real-ip'] || req.socket?.remoteAddress || '').trim();
}

function normalizeCreatePayload(input, req) {
  const data = { ...(input || {}) };
  const payer = { ...(data.payer || {}) };
  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    const err = new Error('Valor do pagamento ausente ou inválido.');
    err.status = 422;
    err.payload = { error: err.message, missing_fields: ['amount'] };
    throw err;
  }
  data.amount = Math.round(amount * 100) / 100;
  data.method = String(data.method || 'mbway').toLowerCase();
  data.currency = data.currency || 'EUR';
  data.paymentDescription = String(data.paymentDescription || 'Transaction Payment').slice(0, 50);
  payer.email = String(payer.email || '').trim();
  payer.name = String(payer.name || '').trim();
  payer.document = cleanDigits(payer.document || payer.nif || payer.NIF);
  payer.nif = payer.document;
  payer.phone = cleanDigits(payer.phone || payer.number);
  payer.iban = String(payer.iban || payer.ibanKey || payer.chaveIban || '').replace(/\s+/g, '').toUpperCase();
  payer.ibanKey = payer.iban;
  const missing = [];
  if (payer.name.length < 3) missing.push('name');
  if (payer.email && !/^\S+@\S+\.\S+$/.test(payer.email)) missing.push('email');
  if (data.method === 'multibanco' && payer.document.length < 9) missing.push('nif');
  if (data.method !== 'multibanco' && payer.phone.length < 9) missing.push('phone');
  if (missing.length) {
    const err = new Error(data.method === 'multibanco' ? 'Dados do pagador incompletos para gerar Multibanco.' : 'Dados do pagador incompletos para gerar MB WAY.');
    err.status = 422;
    err.payload = { error: err.message, missing_fields: missing };
    throw err;
  }
  data.payer = payer;
  data.trackingParameters = normalizeTrackingParameters(data.trackingParameters || {});
  data.pagePath = data.pagePath ? String(data.pagePath) : '';
  const origin = getRequestOrigin(req);
  data._request = { ip: getClientIp(req), userAgent: String(req.headers['user-agent'] || ''), origin };
  if (!data.callbackUrl && origin) data.callbackUrl = origin + '/api/waymb-webhook.php';
  if (!data.success_url && origin) data.success_url = origin + '/up1/';
  if (!data.failed_url && origin) data.failed_url = origin + '/back-redirect/';
  return data;
}

function buildTransactionFingerprint(data) {
  const payer = data.payer || {};
  const method = String(data.method || 'mbway').toLowerCase();
  const amount = Number(data.amount || 0).toFixed(2);
  const pagePath = String(data.pagePath || '').replace(/\?.*/, '');
  const identity = method === 'multibanco' ? (payer.document || payer.nif || payer.name || '') : (payer.phone || payer.number || '');
  return crypto.createHash('sha256').update([method, amount, pagePath, String(identity).replace(/\s+/g, '').toLowerCase()].join('|')).digest('hex');
}

function getTransactionId(payload = {}) {
  return payload.id || payload.transactionID || payload.transactionId || payload.transaction_id || null;
}

function isReusablePendingTransaction(payload) {
  if (!payload || !getTransactionId(payload)) return false;
  if (isFinalStatus(payload.status || 'PENDING')) return false;
  const raw = payload._created_at || payload.createdAt || payload.created_at;
  const createdAt = raw ? Date.parse(raw) : 0;
  return !createdAt || createdAt >= Date.now() - 3600 * 1000;
}

function getVorkpaySecret() {
  return envFirst(['VORKPAY_SECRET', 'VORKPAY_API_KEY', 'VORKPAY_TOKEN']);
}

function getVorkpayBaseUrl() {
  return envFirst(['VORKPAY_BASE_URL'], 'https://vorkpay.com/api/v1').replace(/\/$/, '');
}

async function vorkpayRequest(method, path, payload = {}, timeoutMs = 20000) {
  const secret = getVorkpaySecret();
  if (!secret) return { ok: false, status: 500, body: '', error: 'VORKPAY_SECRET não configurado na Vercel.' };
  const upper = method.toUpperCase();
  let url = getVorkpayBaseUrl() + path;
  const options = {
    method: upper,
    headers: { Authorization: 'Bearer ' + secret, 'Content-Type': 'application/json', 'User-Agent': 'pt-main/1.0' },
    signal: AbortSignal.timeout(timeoutMs)
  };
  if (upper === 'GET') {
    const qs = new URLSearchParams(payload).toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  } else {
    options.body = JSON.stringify(payload);
  }
  try {
    const response = await fetch(url, options);
    return { ok: true, status: response.status, body: await response.text(), error: '' };
  } catch (error) {
    return { ok: false, status: 502, body: '', error: error.message || String(error) };
  }
}

function normalizeVorkpayTransaction(payload = {}, fallback = {}) {
  const result = { ...payload };
  const txId = result.transactionId || result.transaction_id || result.id || getTransactionId(fallback);
  if (txId) {
    result.id = result.id || txId;
    result.transaction_id = result.transaction_id || txId;
    result.transactionId = result.transactionId || txId;
  }
  result.status = normalizeStatus(result.status || fallback.status || 'PENDING');
  result.amount = result.amount ?? fallback.amount ?? null;
  result.currency = result.currency || fallback.currency || 'EUR';
  const paymentMethod = String(result.paymentMethod || fallback.paymentMethod || '').toUpperCase();
  if (paymentMethod === 'REFERENCE') result.method = 'multibanco';
  else if (paymentMethod === 'MBWAY') result.method = 'mbway';
  else if (!result.method && fallback.method) result.method = fallback.method;
  if (result.mb && typeof result.mb === 'object') {
    result.referenceData = { entity: result.mb.entity || null, reference: result.mb.reference || null, expiresAt: result.mb.expiresAt || null };
    result.entity = result.referenceData.entity;
    result.reference = result.referenceData.reference;
    result.expiresAt = result.referenceData.expiresAt;
  }
  return result;
}

async function kvGetJson(key) {
  if (!kvUrl || !kvToken) return null;
  try {
    const response = await fetch(kvUrl.replace(/\/$/, '') + '/get/' + encodeURIComponent(key), { headers: { Authorization: 'Bearer ' + kvToken }, signal: AbortSignal.timeout(5000) });
    const decoded = await response.json().catch(() => null);
    if (!decoded || decoded.result == null) return null;
    const parsed = JSON.parse(decoded.result);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch { return null; }
}

async function kvSetJson(key, value) {
  if (!kvUrl || !kvToken) return false;
  try {
    await fetch(kvUrl.replace(/\/$/, '') + '/set/' + encodeURIComponent(key), { method: 'POST', headers: { Authorization: 'Bearer ' + kvToken }, body: JSON.stringify(value), signal: AbortSignal.timeout(5000) });
    return true;
  } catch { return false; }
}

function getUtmifyToken() {
  return envFirst(['UTMIFY_API_TOKEN', 'UTMIFY_TOKEN']);
}

function getUtmifyStatus(payload) {
  const status = normalizeStatus(payload.status || 'PENDING');
  if (status === 'COMPLETED') return 'paid';
  if (['DECLINED', 'CANCELED', 'CANCELLED', 'FAILED'].includes(status)) return 'refused';
  return 'waiting_payment';
}

function getPaymentMethodLabel(payload) {
  const method = String(payload.method || payload.paymentMethod || '').toLowerCase();
  if (method === 'multibanco' || method === 'reference') return ['multibanco', 'Multibanco'];
  return ['mbway', 'MB Way'];
}

function getUtmifyProduct(payload) {
  const path = String(payload.pagePath || '');
  const description = String(payload.paymentDescription || 'Pagamento MB WAY');
  const [methodSlug, methodLabel] = getPaymentMethodLabel(payload);
  const map = [
    ['/confirmar-saque', ['front', 'Ticket inicial']], ['/back-redirect', ['back_redirect', 'Back redirect']],
    ['/up1', ['up1', 'Upsell 1']], ['/upsell-1', ['up1', 'Upsell 1']],
    ['/up2', ['up2', 'Upsell 2']], ['/upsell-2', ['up2', 'Upsell 2']],
    ['/up3', ['up3', 'Upsell 3']], ['/upsell-3', ['up3', 'Upsell 3']],
    ['/up4', ['up4', 'Upsell 4']], ['/upsell-4', ['up4', 'Upsell 4']],
    ['/up5', ['upsell-5', 'Upsell 5']], ['/upsell-5', ['upsell-5', 'Upsell 5']]
  ];
  for (const [needle, product] of map) {
    if (path && path.startsWith(needle)) return [product[0] + '_' + methodSlug, product[1] + ' - ' + methodLabel];
  }
  const slug = description.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'pagamento';
  return [slug + '_' + methodSlug, (description || 'Pagamento') + ' - ' + methodLabel];
}

function sha256(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized ? crypto.createHash('sha256').update(normalized).digest('hex') : undefined;
}

function getMetaPixelId() {
  return envFirst(['META_PIXEL_ID', 'FACEBOOK_PIXEL_ID', 'FB_PIXEL_ID'], '1584644955969697');
}

function getMetaAccessToken() {
  return envFirst(['META_ACCESS_TOKEN', 'FACEBOOK_ACCESS_TOKEN', 'FB_ACCESS_TOKEN']);
}

function buildMetaUserData(payload) {
  const payer = payload.payer || {};
  const tracking = normalizeTrackingParameters(payload.trackingParameters || {});
  const request = payload._request || {};
  const nameParts = String(payer.name || '').trim().split(/\s+/).filter(Boolean);
  const userData = {
    client_ip_address: request.ip || undefined,
    client_user_agent: request.userAgent || undefined,
    fbp: tracking.fbp || undefined,
    fbc: tracking.fbc || undefined,
    em: sha256(payer.email),
    ph: sha256(payer.phone),
    fn: sha256(nameParts[0]),
    ln: sha256(nameParts.slice(1).join(' ')),
    external_id: sha256(getTransactionId(payload))
  };
  return Object.fromEntries(Object.entries(userData).filter(([, value]) => value));
}

async function sendMetaConversionEvent(payload, eventName = 'Purchase') {
  const token = getMetaAccessToken();
  const pixelId = getMetaPixelId();
  if (!token || !pixelId) return { attempted: false, accepted: false, reason: 'missing_meta_credentials' };
  const txId = getTransactionId(payload);
  if (!txId) return { attempted: false, accepted: false, reason: 'missing_transaction_id' };
  const amount = Number(payload.amount || 0);
  const request = payload._request || {};
  const eventSourceUrl = request.origin && payload.pagePath ? request.origin + payload.pagePath : undefined;
  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: String(txId),
    action_source: 'website',
    event_source_url: eventSourceUrl,
    user_data: buildMetaUserData(payload),
    custom_data: {
      currency: payload.currency || 'EUR',
      value: Number.isFinite(amount) ? amount : 0,
      content_name: payload.method === 'multibanco' ? 'Multibanco gerado' : 'MB WAY gerado',
      payment_method: payload.method || 'mbway',
      transaction_id: String(txId)
    }
  };
  const body = { data: [event] };
  const testCode = envFirst(['META_TEST_EVENT_CODE', 'FACEBOOK_TEST_EVENT_CODE', 'FB_TEST_EVENT_CODE']);
  if (testCode) body.test_event_code = testCode;
  let status = 0, responseText = '', error = '';
  try {
    const response = await fetch('https://graph.facebook.com/v19.0/' + encodeURIComponent(pixelId) + '/events?access_token=' + encodeURIComponent(token), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000)
    });
    status = response.status;
    responseText = (await response.text()).slice(0, 500);
  } catch (err) { error = err.message || String(err); }
  const ok = status >= 200 && status < 300 && !error;
  await kvSetJson('meta:last', { eventName, eventId: String(txId), method: payload.method || null, amount, ok, httpStatus: status, sent_at: new Date().toISOString(), response: responseText, error });
  return { attempted: true, accepted: ok, eventName, eventId: String(txId), httpStatus: status, response: responseText, error };
}

function buildUtmifyOrderPayload(payload) {
  const txId = getTransactionId(payload);
  if (!txId) return null;
  const payer = payload.payer || {};
  const amount = Number(payload.amount || 0);
  const priceInCents = Math.max(0, Math.round(amount * 100));
  const [productId, productName] = getUtmifyProduct(payload);
  const [, methodLabel] = getPaymentMethodLabel(payload);
  const status = getUtmifyStatus(payload);
  const now = new Date(Date.now() - 300000).toISOString();
  let createdAt = payload.createdAt || payload.created_at || now;
  if (Number.isNaN(Date.parse(createdAt)) || Date.parse(createdAt) > Date.now() - 60000) createdAt = now;
  return {
    isTest: envFirst(['UTMIFY_IS_TEST'], 'false') === 'true',
    status,
    orderId: String(txId),
    customer: { name: String(payer.name || 'Cliente'), email: String(payer.email || ''), phone: String(payer.phone || ''), country: 'PT', document: cleanDigits(payer.document) },
    platform: 'VorkPay ' + methodLabel,
    products: [{ id: productId, name: productName, planId: productId, planName: productName, quantity: 1, priceInCents }],
    createdAt,
    commission: { gatewayFeeInCents: 0, totalPriceInCents: priceInCents, userCommissionInCents: priceInCents, currency: 'EUR' },
    refundedAt: null,
    approvedDate: status === 'paid' ? String(payload.approvedDate || payload.paidAt || payload.paid_at || now) : null,
    paymentMethod: 'pix',
    trackingParameters: normalizeTrackingParameters(payload.trackingParameters || {})
  };
}

async function sendUtmifyOrder(payload) {
  const order = buildUtmifyOrderPayload(payload);
  if (!order) return { attempted: false, accepted: false, reason: 'missing_order_data' };
  const token = getUtmifyToken();
  if (!token) return { attempted: false, accepted: false, reason: 'missing_token', orderId: order.orderId, statusName: order.status };
  const dedupeKey = 'utmify:' + order.orderId + ':' + order.status;
  const previous = await kvGetJson(dedupeKey);
  if (previous && previous.ok) return { attempted: false, accepted: true, deduped: true, orderId: order.orderId, statusName: order.status, httpStatus: previous.status || null };
  let responseText = '', status = 0, error = '';
  try {
    const response = await fetch('https://api.utmify.com.br/api-credentials/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-token': token }, body: JSON.stringify(order), signal: AbortSignal.timeout(12000) });
    status = response.status;
    responseText = (await response.text()).slice(0, 500);
  } catch (err) { error = err.message || String(err); }
  const ok = status >= 200 && status < 300 && !error;
  const summary = { ok, status, sent_at: new Date().toISOString(), response: responseText, error };
  await kvSetJson(dedupeKey, summary);
  await kvSetJson('utmify:last', { orderId: order.orderId, statusName: order.status, product: order.products[0]?.id || null, productName: order.products[0]?.name || null, platform: order.platform, paymentMethod: order.paymentMethod, amountInCents: order.commission.totalPriceInCents, ok, httpStatus: status, sent_at: summary.sent_at, response: responseText, error });
  return { attempted: true, accepted: ok, deduped: false, orderId: order.orderId, statusName: order.status, httpStatus: status, response: responseText, error };
}

async function persistTransactionSnapshot(payload) {
  const txId = getTransactionId(payload);
  if (!txId) return;
  await kvSetJson('tx:' + txId, { ...payload, status: normalizeStatus(payload.status) });
}

module.exports = {
  envFirst, kvUrl, kvToken, sendJson, setCors, readBody, readRawBody, getRequestOrigin,
  normalizeStatus, isFinalStatus, normalizeCreatePayload, buildTransactionFingerprint,
  isReusablePendingTransaction, getVorkpaySecret, getVorkpayBaseUrl, vorkpayRequest,
  normalizeVorkpayTransaction, getTransactionId, kvGetJson, kvSetJson, sendUtmifyOrder,
  sendMetaConversionEvent, persistTransactionSnapshot
};
