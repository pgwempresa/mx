;(function () {
  'use strict';

  var pixelIds = (window.FB_PIXEL_IDS || window.FB_PIXEL_ID || '')
    .toString()
    .split(',')
    .map(function (id) { return id.trim(); })
    .filter(Boolean);
  var queue = [];
  var initialized = false;
  var lastPageKey = '';

  function eventId(name, params) {
    if (params && params.transaction_id) return ['meta', name, params.transaction_id].join(':');
    var path = location.pathname || '/';
    var value = params && params.value != null ? String(params.value) : '';
    return [name, path, value, Date.now(), Math.random().toString(36).slice(2, 10)].join(':');
  }

  function cleanParams(params) {
    var result = {};
    Object.keys(params || {}).forEach(function (key) {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        result[key] = params[key];
      }
    });
    return result;
  }

  function alreadySent(id) {
    var key = 'meta_pixel_sent_' + id;
    try {
      if (sessionStorage.getItem(key)) return true;
      sessionStorage.setItem(key, '1');
    } catch (e) {}
    return false;
  }

  function ensureFbq() {
    if (window.fbq && window.fbq.callMethod) return window.fbq;
    if (window.fbq && window.fbq.queue) return window.fbq;

    var fbq = window.fbq = function () {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    return fbq;
  }

  function loadFacebookScript() {
    if (document.querySelector('script[src*="connect.facebook.net/en_US/fbevents.js"]')) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    var first = document.getElementsByTagName('script')[0];
    if (first && first.parentNode) first.parentNode.insertBefore(s, first);
    else document.head.appendChild(s);
  }

  function init() {
    var fbq = window.fbq || (pixelIds.length ? ensureFbq() : null);
    if (!initialized && pixelIds.length) {
      pixelIds.forEach(function (id) { fbq('init', id); });
      loadFacebookScript();
      initialized = true;
    }
    flush();
  }

  function flush() {
    if (!window.fbq) return;
    while (queue.length) {
      var item = queue.shift();
      window.fbq('track', item.name, item.params, { eventID: item.id });
    }
  }

  function normalize(name) {
    var map = {
      CompletePayment: 'Purchase',
      PaymentConfirmed: 'Purchase',
      GeneratePayment: 'InitiateCheckout',
      PaymentGenerated: 'InitiateCheckout'
    };
    return map[name] || name;
  }

  function track(name, params, options) {
    name = normalize(name);
    params = cleanParams(Object.assign({ currency: 'EUR' }, params || {}));
    var id = (options && options.eventID) || eventId(name, params);
    if (alreadySent(id)) return;
    queue.push({ name: name, params: params, id: id });
    init();
  }

  function trackPageView(force) {
    var key = location.pathname + location.search;
    if (!force && key === lastPageKey) return;
    lastPageKey = key;
    track('PageView', { page_path: location.pathname, page_url: location.href });
  }

  window.trackMetaEvent = track;
  window.trackMetaPageView = trackPageView;

  init();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { trackPageView(true); });
  } else {
    trackPageView(true);
  }

  ['pushState', 'replaceState'].forEach(function (method) {
    var original = history[method];
    if (!original || original.__metaPixelWrapped) return;
    history[method] = function () {
      var result = original.apply(this, arguments);
      setTimeout(function () { trackPageView(false); }, 0);
      return result;
    };
    history[method].__metaPixelWrapped = true;
  });

  window.addEventListener('popstate', function () {
    setTimeout(function () { trackPageView(false); }, 0);
  });

  window.addEventListener('mbway:paid', function (event) {
    var detail = event && event.detail || {};
    var amount = Number(detail.amount || detail.value || detail.total || 0);
    track('Purchase', {
      value: Number.isFinite(amount) && amount > 0 ? amount : undefined,
      currency: 'EUR',
      content_name: detail.pagePath || location.pathname,
      transaction_id: detail.transaction_id || detail.id || ''
    });
  });
})();
