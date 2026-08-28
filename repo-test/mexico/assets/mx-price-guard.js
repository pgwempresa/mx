(function () {
  var FRONT_PRICE = 100;
  var BACK_PRICE = 60;

  function money(value) {
    return '$' + Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' MXN';
  }

  function isBackFlow() {
    try {
      var params = new URLSearchParams(location.search || '');
      if (params.get('offer') === 'back') return true;
      if (/\/mexico\/back-redirect\/?$/i.test(location.pathname)) return true;
      var raw = sessionStorage.getItem('ttk_back_redirect_offer');
      if (!raw) return false;
      var saved = JSON.parse(raw);
      return saved && saved.source === 'back-redirect';
    } catch (e) {
      return false;
    }
  }

  function normalizeAmount(value) {
    var amount = Number(value);
    if (isBackFlow()) return BACK_PRICE;
    if (!Number.isFinite(amount) || amount <= 0) return FRONT_PRICE;
    return amount;
  }

  function patchUrlAndStorage() {
    try {
      window.__FUNIL_FEE_FRONT = FRONT_PRICE;
      window.__FUNIL_FEE_BACK = BACK_PRICE;
      window.CENTRAL_PRICES = Object.assign({}, window.CENTRAL_PRICES || {}, {
        front: FRONT_PRICE,
        back: BACK_PRICE
      });

      var params = new URLSearchParams(location.search || '');
      var amount = Number(params.get('amount') || 0);
      if (params.get('offer') === 'back') {
        params.set('amount', BACK_PRICE.toFixed(2));
        history.replaceState(null, '', location.pathname + '?' + params.toString() + location.hash);
      }

      ['ttk_pending_offer', 'ttk_back_redirect_offer'].forEach(function (key) {
        var raw = sessionStorage.getItem(key);
        if (!raw) return;
        var saved = JSON.parse(raw);
        if (!saved || typeof saved !== 'object') return;
        saved.amount = key === 'ttk_back_redirect_offer' || saved.source === 'back-redirect'
          ? BACK_PRICE
          : normalizeAmount(saved.amount);
        saved.amountInCents = Math.round(Number(saved.amount) * 100);
        sessionStorage.setItem(key, JSON.stringify(saved));
      });
    } catch (e) {}
  }

  function patchTextNode(node) {
    var value = node.nodeValue || '';
    var next = value;
    if (isBackFlow()) {
      var parentText = node.parentElement ? (node.parentElement.textContent || '') : '';
      var isOriginalPrice = node.parentElement && node.parentElement.classList && node.parentElement.classList.contains('line-through');
      if (!isOriginalPrice && !/^\s*De\b/i.test(parentText)) {
        next = next.replace(/\$100(?:\.00)?\s*MXN/g, money(BACK_PRICE));
      }
      next = next.replace(/\$60(?:\.00)?\s*MXN/g, money(BACK_PRICE));
    }
    if (next !== value) node.nodeValue = next;
  }

  function patchVisual() {
    if (!document.body) return;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(patchTextNode);
  }

  function patchFetch() {
    if (window.__MX_PRICE_GUARD_FETCH__) return;
    window.__MX_PRICE_GUARD_FETCH__ = true;
    var originalFetch = window.fetch;
    window.fetch = function (url, options) {
      var href = typeof url === 'string' ? url : String(url && url.url || '');
      var method = String((options && options.method) || 'GET').toUpperCase();
      if (method === 'POST' && /\/api\/(?:xpag-cashin|create-mbway)\.php|create-mbway/i.test(href)) {
        try {
          var body = JSON.parse((options && options.body) || '{}') || {};
          body.amount = normalizeAmount(body.amount);
          if (isBackFlow()) body.offer = 'back';
          options = Object.assign({}, options, { body: JSON.stringify(body) });
        } catch (e) {}
      }
      return originalFetch.call(this, url, options);
    };
  }

  function run() {
    patchUrlAndStorage();
    patchFetch();
    patchVisual();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  new MutationObserver(run).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
