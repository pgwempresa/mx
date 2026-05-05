;(function () {
  'use strict';

  var PIXEL_ID = '1584644955969697';
  var originalFetch = window.fetch;

  if (!window.fbq) {
    var fbq = window.fbq = function () {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
  }

  if (!document.querySelector('script[src*="connect.facebook.net/en_US/fbevents.js"]')) {
    var script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');

  function parseJson(value) {
    try {
      return JSON.parse(value || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function getTransactionId(data) {
    return data && (data.id || data.transaction_id || data.transactionId || data.transactionID);
  }

  function alreadyTracked(transactionId) {
    if (!transactionId) return false;
    var key = 'fb_generate_mbway_' + transactionId;
    try {
      if (sessionStorage.getItem(key)) return true;
      sessionStorage.setItem(key, '1');
    } catch (e) {}
    return false;
  }

  function trackMbwayGenerated(requestBody, responseData) {
    var transactionId = getTransactionId(responseData);
    if (!transactionId || alreadyTracked(transactionId)) return;

    var amount = Number(responseData.amount || requestBody.amount || 0);

    window.fbq('trackCustom', 'GenerateMBWAY', {
      value: Number.isFinite(amount) ? amount : 0,
      currency: 'EUR',
      transaction_id: String(transactionId),
      content_name: responseData.pagePath || requestBody.pagePath || location.pathname,
      payment_method: responseData.method || requestBody.method || 'mbway'
    }, {
      eventID: 'generate-mbway:' + transactionId
    });
  }

  window.fetch = function (url, options) {
    var requestUrl = typeof url === 'string' ? url : ((url && url.url) || '');
    var requestOptions = options || {};
    var method = (requestOptions.method || 'GET').toUpperCase();
    var shouldTrack = method === 'POST' && requestUrl.indexOf('create-mbway') !== -1;
    var requestBody = parseJson(requestOptions.body);

    return originalFetch.apply(this, arguments).then(function (response) {
      if (shouldTrack && response && response.ok) {
        response.clone().json().then(function (data) {
          if (!data || data.error) return;
          trackMbwayGenerated(requestBody, data);
        }).catch(function () {});
      }

      return response;
    });
  };
})();
