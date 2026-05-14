const {
  setCors, sendJson, readBody, normalizeStatus, isFinalStatus, kvGetJson, kvSetJson,
  vorkpayRequest, normalizeVorkpayTransaction, persistTransactionSnapshot, sendUtmifyOrder
} = require('./_lib');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') return sendJson(res, 200, { ok: true, route: 'check-mbway', runtime: 'node' });
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });
  try {
    const data = await readBody(req);
    if (data.transaction_id && !data.id) data.id = data.transaction_id;
    if (!data.id) return sendJson(res, 400, { error: 'transaction id is required' });
    const cached = await kvGetJson('tx:' + data.id);
    if (cached?.status) {
      cached.status = normalizeStatus(cached.status);
      if (isFinalStatus(cached.status)) return sendJson(res, 200, cached);
    }
    const result = await vorkpayRequest('GET', '/payments/status', { transactionId: data.id }, 15000);
    if (!result.ok) return sendJson(res, 502, { error: 'Gateway error: ' + result.error });
    const body = JSON.parse(result.body || '{}');
    if (result.status < 200 || result.status >= 300) return sendJson(res, result.status, { error: body.error || 'VorkPay recusou a consulta da transação.', gateway_status: result.status, gateway_response: body });
    const payload = normalizeVorkpayTransaction(body, cached || { id: data.id });
    payload._gateway = 'vorkpay';
    payload._verified_by_gateway = true;
    payload._gateway_checked_at = new Date().toISOString();
    if (cached) for (const key of ['payer', 'trackingParameters', 'pagePath', 'amount', 'method', '_fingerprint', 'paymentDescription']) if (!payload[key] && cached[key]) payload[key] = cached[key];
    await persistTransactionSnapshot(payload);
    if (payload._fingerprint) await kvSetJson('txfinger:' + payload._fingerprint, payload);
    payload._utmify_status = await sendUtmifyOrder(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    return sendJson(res, 500, { error: 'Erro interno ao consultar pagamento.', details: error.message || String(error) });
  }
};
