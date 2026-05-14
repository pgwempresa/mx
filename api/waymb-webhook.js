const crypto = require('crypto');
const {
  envFirst, setCors, sendJson, readRawBody, normalizeVorkpayTransaction, getTransactionId,
  kvGetJson, kvSetJson, isFinalStatus, persistTransactionSnapshot, sendUtmifyOrder
} = require('./_lib');

module.exports = async function handler(req, res) {
  setCors(res, 'Content-Type, X-VorkPay-Signature, X-VorkPay-Event');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });
  try {
    const raw = await readRawBody(req);
    const secret = envFirst(['VORKPAY_WEBHOOK_SECRET']);
    const signature = req.headers['x-vorkpay-signature'] || '';
    if (secret) {
      const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
      const safeA = Buffer.from(String(signature));
      const safeB = Buffer.from(expected);
      if (safeA.length !== safeB.length || !crypto.timingSafeEqual(safeA, safeB)) return sendJson(res, 401, { received: false, error: 'invalid webhook signature' });
    }
    const event = JSON.parse(raw || '{}');
    let data = event && typeof event === 'object' ? (event.data || event) : {};
    const eventName = String(event.event || req.headers['x-vorkpay-event'] || '');
    if (!data.status) {
      if (eventName === 'payment.success') data.status = 'paid';
      else if (eventName === 'payment.failed') data.status = 'failed';
      else if (eventName === 'payment.cancelled') data.status = 'cancelled';
    }
    data = normalizeVorkpayTransaction(data);
    const txId = getTransactionId(data);
    if (!txId) return sendJson(res, 400, { received: false, error: 'transaction id is required' });
    const existing = await kvGetJson('tx:' + txId);
    if (existing) for (const key of ['payer', 'trackingParameters', 'pagePath', 'amount', 'method', '_fingerprint', 'paymentDescription']) if (!data[key] && existing[key]) data[key] = existing[key];
    data._gateway = 'vorkpay';
    data._verified_by_gateway = true;
    data._webhook_received = true;
    data._webhook_event = eventName;
    data._webhook_received_at = new Date().toISOString();
    await persistTransactionSnapshot(data);
    if (data._fingerprint) await kvSetJson('txfinger:' + data._fingerprint, data);
    if (isFinalStatus(data.status || '')) data._utmify_status = await sendUtmifyOrder(data);
    return sendJson(res, 200, { received: true, id: data.id || data.transactionId || null, status: data.status || null, verified: Boolean(data._verified_by_gateway) });
  } catch (error) {
    return sendJson(res, 500, { received: false, error: 'Erro interno no webhook.', details: error.message || String(error) });
  }
};

module.exports.config = { api: { bodyParser: false } };
