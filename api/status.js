const { envFirst, kvUrl, kvToken, sendJson, setCors, getVorkpaySecret, getVorkpayBaseUrl, kvGetJson } = require('./_lib');

module.exports = async function handler(req, res) {
  setCors(res, 'Content-Type, X-Status-Token');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const statusToken = envFirst(['STATUS_ACCESS_TOKEN', 'API_STATUS_TOKEN']);
  const provided = req.query?.token || req.headers['x-status-token'] || '';
  if (!statusToken || statusToken !== String(provided)) return sendJson(res, 404, { ok: false, error: 'not_found' });
  const vorkpaySecret = getVorkpaySecret();
  return sendJson(res, 200, {
    ok: true,
    runtime: 'node',
    kv: { configured: Boolean(kvUrl && kvToken), url_present: Boolean(kvUrl), token_present: Boolean(kvToken) },
    vorkpay: { configured: Boolean(vorkpaySecret), secret_present: Boolean(vorkpaySecret), webhook_secret_present: Boolean(envFirst(['VORKPAY_WEBHOOK_SECRET'])), base_url: getVorkpayBaseUrl() },
    utmify: { configured: Boolean(envFirst(['UTMIFY_API_TOKEN', 'UTMIFY_TOKEN'])), token_present: Boolean(envFirst(['UTMIFY_API_TOKEN', 'UTMIFY_TOKEN'])), is_test: envFirst(['UTMIFY_IS_TEST'], 'false') === 'true', last: await kvGetJson('utmify:last') },
    routes: { create: '/api/create-mbway.php', check: '/api/check-mbway.php', webhook: '/api/waymb-webhook.php', checkout_page: '/checkout' }
  });
};
