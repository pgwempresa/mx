const {
  setCors, sendJson, readBody, normalizeCreatePayload, buildTransactionFingerprint,
  isReusablePendingTransaction, kvGetJson, kvSetJson, vorkpayRequest,
  normalizeVorkpayTransaction, persistTransactionSnapshot, sendUtmifyOrder
} = require('./_lib');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') return sendJson(res, 200, { ok: true, route: 'create-mbway', runtime: 'node' });
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });
  try {
    const input = await readBody(req);
    let idempotencyKey = '';
    if (input.idempotency_key) {
      idempotencyKey = String(input.idempotency_key).replace(/[^a-zA-Z0-9:_-]/g, '');
      const cached = await kvGetJson('idem:' + idempotencyKey);
      if (cached) return sendJson(res, 200, { ...cached, idempotent_replay: true });
    }
    const data = normalizeCreatePayload(input, req);
    const fingerprint = buildTransactionFingerprint(data);
    const fingerprintKey = 'txfinger:' + fingerprint;
    const cachedByFingerprint = await kvGetJson(fingerprintKey);
    if (isReusablePendingTransaction(cachedByFingerprint)) return sendJson(res, 200, { ...cachedByFingerprint, idempotent_replay: true, fingerprint_replay: true });
    const orderId = idempotencyKey || 'order_' + fingerprint.slice(0, 24);
    const method = String(data.method || 'mbway').toLowerCase();
    const customer = {
      name: data.payer.name,
      email: data.payer.email || '',
      phone: data.payer.phone || '',
      country: 'PT',
      document: data.payer.document || data.payer.nif || ''
    };
    if (method === 'multibanco' && (!customer.document || /^(\d)\1{8}$/.test(customer.document))) {
      return sendJson(res, 422, { error: 'NIF inválido para gerar Multibanco.', missing_fields: ['nif'] });
    }
    const init = await vorkpayRequest('POST', '/payments/init', { orderId, amount: data.amount, currency: data.currency || 'EUR', customer }, 30000);
    if (!init.ok) return sendJson(res, 502, { error: 'Falha na comunicação com a VorkPay.', details: init.error, method: data.method });
    const initBody = JSON.parse(init.body || '{}');
    if (init.status < 200 || init.status >= 300) return sendJson(res, init.status, { error: initBody.error || 'VorkPay recusou a criação da transação.', gateway_status: init.status, gateway_response: initBody });
    const transactionId = initBody.transactionId;
    if (!transactionId) return sendJson(res, 502, { error: 'VorkPay não retornou transactionId.', gateway_response: initBody });
    const payment = method === 'multibanco'
      ? await vorkpayRequest('POST', '/payments/multibanco', { transactionId }, 30000)
      : await vorkpayRequest('POST', '/payments/mbway', { transactionId, phoneNumber: data.payer.phone }, 30000);
    if (!payment.ok) return sendJson(res, 502, { error: 'Falha na comunicação com a VorkPay para gerar pagamento.', details: payment.error, method });
    const paymentBody = JSON.parse(payment.body || '{}');
    if (payment.status < 200 || payment.status >= 300) return sendJson(res, payment.status, { error: paymentBody.error || 'VorkPay recusou a geração do pagamento.', gateway_status: payment.status, gateway_response: paymentBody });
    const payload = normalizeVorkpayTransaction({ ...initBody, ...paymentBody }, { id: transactionId, transactionId, amount: data.amount, currency: data.currency || 'EUR', status: 'PENDING', method, paymentMethod: method === 'multibanco' ? 'REFERENCE' : 'MBWAY' });
    Object.assign(payload, { id: transactionId, transaction_id: transactionId, transactionId, externalOrderId: orderId, status: payload.status || 'PENDING', method, paymentMethod: method === 'multibanco' ? 'REFERENCE' : 'MBWAY', amount: payload.amount ?? data.amount, currency: payload.currency || data.currency || 'EUR', payer: data.payer, trackingParameters: data.trackingParameters, pagePath: data.pagePath, paymentDescription: data.paymentDescription, _gateway: 'vorkpay', _created_by_gateway: true, _verified_by_gateway: false, _created_at: payload._created_at || new Date().toISOString(), _fingerprint: fingerprint });
    if (method === 'multibanco') {
      payload.referenceData = { entity: paymentBody.entity || null, reference: paymentBody.reference || null, expiresAt: paymentBody.expiresAt || null };
      payload.entity = payload.referenceData.entity;
      payload.reference = payload.referenceData.reference;
      payload.expiresAt = payload.referenceData.expiresAt;
    }
    if (idempotencyKey) payload._idempotency_key = idempotencyKey;
    await persistTransactionSnapshot(payload);
    payload._utmify_generated = await sendUtmifyOrder(payload);
    await kvSetJson(fingerprintKey, payload);
    if (idempotencyKey) await kvSetJson('idem:' + idempotencyKey, payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    if (error.payload) return sendJson(res, error.status || 422, error.payload);
    return sendJson(res, 500, { error: 'Erro interno ao gerar pagamento.', details: error.message || String(error) });
  }
};
