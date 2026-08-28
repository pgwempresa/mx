;(function () {
  window.__MX_LAB_MODE__ = true;
  document.documentElement.lang = 'es-MX';

  var priceMap = {
    front: 199.9,
    back: 100,
    up1: 89.9,
    up2: 149.9,
    up3: 179.9,
    up4: 99.9,
    up5: 229.9,
    up6: 249.9,
    up7: 119.9,
    up8: 299.9,
    up9: 399.9
  };

  function money(n) {
    var value = Number(n || 0);
    return '$ ' + value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MXN';
  }

  function patchPrices() {
    window.CENTRAL_PRICES = Object.assign({}, window.CENTRAL_PRICES || {}, priceMap);
    window.__FUNIL_FEE_FRONT = priceMap.front;
    window.__FUNIL_FEE_BACK = priceMap.back;
    window.__FUNIL_AMOUNT_SAQUE_1 = 58800;
    window.getCentralPrice = function (key, fallback) {
      return Object.prototype.hasOwnProperty.call(priceMap, key) ? priceMap[key] : fallback;
    };
    window.trackMetaEvent = function () {};
    window.fbq = window.fbq || function () {};
    window.pixelId = 'mx-lab-disabled';
    window.__TTK_PRESERVED_QUERY = 'mx_lab=1';
    try {
      if (/method=mbway/i.test(location.search)) {
        history.replaceState(null, '', location.pathname + location.search.replace(/method=mbway/ig, 'method=spei'));
      }
    } catch (e) {}
    try {
      sessionStorage.setItem('ttk_preserved_query', 'mx_lab=1');
      sessionStorage.setItem('ttk_confirmar_state', JSON.stringify({
        amount: '58800',
        MBWAYKeyType: 'spei',
        MBWAYKey: 'CLABE',
        customerData: { name: '', method: 'spei' }
      }));
      localStorage.setItem('withdrawMethod', 'multibanco');
      localStorage.removeItem('pending_mbway');
    } catch (e) {}
  }

  function translateText(text) {
    return String(text || '')
      .replace(/Meta Portugal/g, 'Meta Mexico')
      .replace(/MBWAY/g, 'SPEI')
      .replace(/MB Way/g, 'SPEI')
      .replace(/MB WAY/g, 'SPEI')
      .replace(/MBway/g, 'SPEI')
      .replace(/mbway/g, 'SPEI')
      .replace(/Multibanco/g, 'SPEI')
      .replace(/multibanco/g, 'SPEI')
      .replace(/IBAN/g, 'CLABE')
      .replace(/iban/g, 'CLABE')
      .replace(/Parabéns!/g, '¡Felicidades!')
      .replace(/Parabéns/g, '¡Felicidades!')
      .replace(/Retirar dinheiro/g, 'Retirar dinero')
      .replace(/Garantiste/g, 'Ganaste')
      .replace(/A tua Mega Recompensa foi conquistada com sucesso/g, 'Tu mega recompensa fue obtenida con exito')
      .replace(/Mega Recompensa/g, 'Mega recompensa')
      .replace(/Resgatar recompensa/g, 'Canjear recompensa')
      .replace(/Código de convite/g, 'Codigo de invitacion')
      .replace(/Resumo da tua atividade na plataforma/g, 'Resumen de tu actividad en la plataforma')
      .replace(/Como obtiveste/g, 'Como obtuviste')
      .replace(/Partilhaste o tu link e tus amigos acederam ao Meta,/g, 'Compartiste tu enlace y tus amigos accedieron a Meta,')
      .replace(/se registaram e ingresaron o tu codigo de invitacion/g, 'se registraron e ingresaron tu codigo de invitacion')
      .replace(/Os tus amigos viram interagiu com/g, 'Tus amigos vieron e interactuaron con')
      .replace(/publicações por dia durante o período/g, 'publicaciones por dia durante el periodo')
      .replace(/recebidos/g, 'recibidos')
      .replace(/Partilhaste/g, 'Compartiste')
      .replace(/os teus amigos/g, 'tus amigos')
      .replace(/registaram-se/g, 'se registraron')
      .replace(/inseriram/g, 'ingresaron')
      .replace(/código de convite/g, 'codigo de invitacion')
      .replace(/recebidos/g, 'recibidos')
      .replace(/Concluído/g, 'Completado')
      .replace(/Resumo da sua atividade/g, 'Resumen de tu actividad')
      .replace(/Contribuição de segurança/g, 'Contribucion de seguridad')
      .replace(/Composição da taxa/g, 'Composicion de la tarifa')
      .replace(/Dados para reembolso/g, 'Datos de retiro')
      .replace(/Validação BdP/g, 'Validacion SPEI')
      .replace(/Seguro antifraude/g, 'Proteccion antifraude')
      .replace(/Banco de Portugal/g, 'sistema SPEI')
      .replace(/Banco do Mexico/g, 'sistema SPEI')
      .replace(/Confirmação de levantamento/g, 'Confirmacion de retiro')
      .replace(/Confirmação/g, 'Confirmacion')
      .replace(/levantamento/g, 'retiro')
      .replace(/levantou/g, 'retiro')
      .replace(/Levantar/g, 'Retirar')
      .replace(/levantar/g, 'retirar')
      .replace(/Saldo disponível/g, 'Saldo disponible')
      .replace(/Aguardando confirmação de levantamento/g, 'Esperando confirmacion del retiro')
      .replace(/As tuas transações/g, 'Tus transacciones')
      .replace(/Tempo restante/g, 'Tiempo restante')
      .replace(/Nome Completo/g, 'Nombre completo')
      .replace(/Nome completo/g, 'Nombre completo')
      .replace(/Número SPEI/g, 'CLABE interbancaria (18 digitos)')
      .replace(/Introduza o seu número SPEI/g, 'Ingresa tu CLABE de 18 digitos')
      .replace(/Introduza o NIF/g, 'Ingresa tu CLABE de 18 digitos')
      .replace(/\bNIF\b/g, 'CLABE interbancaria (18 digitos)')
      .replace(/Chave IBAN/g, 'CLABE interbancaria (18 digitos)')
      .replace(/chave IBAN/g, 'CLABE interbancaria (18 digitos)')
      .replace(/Introduza a chave IBAN/g, 'Ingresa tu CLABE de 18 digitos')
      .replace(/Preenche nome completo e número SPEI antes de continuar/g, 'Completa nombre completo y CLABE de 18 digitos antes de continuar')
      .replace(/Preenche nome completo e número MB WAY antes de continuar/g, 'Completa nombre completo y CLABE de 18 digitos antes de continuar')
      .replace(/Gera referência Multibanco/g, 'Ingresa tu CLABE de 18 digitos')
      .replace(/Contribuição Multibanco/g, 'CLABE interbancaria (18 digitos)')
      .replace(/\s*\/\s*IBAN/g, '')
      .replace(/\bCLABE\b/g, 'CLABE')
      .replace(/SPEI\s*\/\s*SPEI/g, 'SPEI')
      .replace(/SPEI\s+SPEI/g, 'SPEI')
      .replace(/Referencia bancaria/g, 'SPEI')
      .replace(/Pago movil/g, 'SPEI')
      .replace(/SPEI\s*-\s*SPEI/g, 'SPEI')
      .replace(/Recebimento Imediato/g, 'Transferencia bancaria')
      .replace(/Transferência bancária/g, 'Transferencia bancaria')
      .replace(/Alterar/g, 'Cambiar')
      .replace(/CONFIRMAR E LIBERAR/g, 'CONFIRMAR Y LIBERAR')
      .replace(/Reembolso de/g, 'Reembolso de')
      .replace(/em 1 minuto/g, 'en 1 minuto')
      .replace(/Pagar/g, 'Pagar')
      .replace(/na conta/g, 'en la cuenta')
      .replace(/QUEM JÁ LEVANTOU HOJE/g, 'QUIEN YA RETIRO HOY')
      .replace(/Pagamento Seguro/g, 'Pago seguro')
      .replace(/SPEI Protegido/g, 'SPEI protegido')
      .replace(/Saque Solicitado/g, 'Retiro solicitado')
      .replace(/Receber Agora/g, 'Recibir ahora')
      .replace(/Aguardar 30 Dias/g, 'Esperar 30 dias')
      .replace(/Dinheiro na conta em segundos/g, 'Dinero en la cuenta en segundos')
      .replace(/Prioridade em campanhas Meta/g, 'Prioridad en campanas Meta')
      .replace(/Sem risco de cancelamento/g, 'Sin riesgo de cancelacion')
      .replace(/Pagamento confirmado/g, 'Pago confirmado')
      .replace(/Aguardando confirmação/g, 'Esperando confirmacion')
      .replace(/Contribucion de seguridad exigida pelo sistema SPEI para libertação do retiro/g, 'Contribucion de seguridad requerida por el sistema SPEI para liberar el retiro')
      .replace(/será devolvido integralmente via SPEI em 1 minuto/g, 'sera devuelto integralmente via SPEI en 1 minuto')
      .replace(/será devolvido integralmente via SPEI en 1 minuto/g, 'sera devuelto integralmente via SPEI en 1 minuto')
      .replace(/libertação do retiro/g, 'liberar el retiro')
      .replace(/A tua/g, 'Tu')
      .replace(/teu/g, 'tu')
      .replace(/tua/g, 'tu')
      .replace(/teus/g, 'tus')
      .replace(/tuas/g, 'tus')
      .replace(/foi conquistada com sucesso/g, 'fue obtenida con exito')
      .replace(/foi conquistado com sucesso/g, 'fue obtenido con exito')
      .replace(/atividade/g, 'actividad')
      .replace(/plataforma/g, 'plataforma')
      .replace(/Cancelar/g, 'Cancelar')
      .replace(/Valor a receber/g, 'Valor a recibir')
      .replace(/Retirar dinero/g, 'Retirar dinero')
      .replace(/Lisboa/g, 'Ciudad de Mexico')
      .replace(/Porto/g, 'Guadalajara')
      .replace(/Braga/g, 'Monterrey')
      .replace(/Coimbra/g, 'Puebla');
  }

  function translateMoney(text) {
    return String(text || '')
      .replace(/\b2\.800,00\b/g, '58,800.00')
      .replace(/\b2\.800\b/g, '58,800')
      .replace(/\b2800,00\b/g, '58,800.00')
      .replace(/\b2800\b/g, '58,800')
      .replace(/€\s*([0-9.,]+)/g, function (_, raw) {
      var normalized = raw.replace(/\./g, '').replace(',', '.');
      var eur = Number(normalized);
      if (!Number.isFinite(eur)) return '$ ' + raw + ' MXN';
      if (Math.abs(eur - 58.8) < 0.01 || Math.abs(eur - 58.80) < 0.01) return money(58800);
      if (Math.abs(eur - 97.23) < 0.01) return money(97.23);
      if (Math.abs(eur - 99.95) < 0.01) return money(99.95);
      if (Math.abs(eur - 100.00) < 0.01) return money(100);
      var isLabPrice = Object.keys(priceMap).some(function (key) {
        return Math.abs(Number(priceMap[key]) - eur) < 0.01;
      });
      if (isLabPrice) return money(eur);
      return money(eur * 21).replace('$ ', '$');
    });
  }

  function translateNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    var next = translateMoney(translateText(node.nodeValue));
    if (next !== node.nodeValue) node.nodeValue = next;
  }

  function walk(root) {
    var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateNode);
  }

  function addBadge() {
    if (document.getElementById('mx-lab-badge')) return;
    var badge = document.createElement('div');
    badge.id = 'mx-lab-badge';
    badge.textContent = 'SIMULACION MX - pagos reales desactivados';
    badge.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#111827;color:#fff;font:700 12px/1.2 sans-serif;text-align:center;padding:8px 10px;letter-spacing:.02em';
    document.body.appendChild(badge);
  }

  function addStyles() {
    if (document.getElementById('mx-lab-style')) return;
    var style = document.createElement('style');
    style.id = 'mx-lab-style';
    style.textContent = [
      'body{padding-bottom:36px!important}',
      '#root{max-width:430px;margin:0 auto}',
      '#mx-lab-badge{box-shadow:0 -8px 24px rgba(15,23,42,.18)}',
      'p,span,h1,h2,h3,button{overflow-wrap:normal!important;word-break:normal!important}',
      '.rounded-full{min-width:0!important}',
      '.rounded-full p,.rounded-full span{font-size:10px!important;line-height:1.05!important;white-space:nowrap!important;letter-spacing:-.06em!important}',
      '.rounded-full:has(svg){overflow:hidden!important}',
      '.rounded-full p:has(+ p),.rounded-full span:has(+ span){letter-spacing:-.04em!important}',
      '[class*="text-4xl"],[class*="text-3xl"]{letter-spacing:-.03em!important}',
      '[class*="font-black"]{line-height:1.05!important}',
      'button{white-space:normal!important}',
      '.mx-lab-spei-logo{width:42px!important;height:28px!important;object-fit:contain!important;border-radius:0!important;background:#fff!important}',
      '.mx-lab-hide{display:none!important}',
      '.mx-lab-method-title{font-weight:800!important;color:#111827!important}',
      '.mx-lab-method-row{display:inline-flex!important;align-items:center!important;gap:7px!important;color:#111827!important;font-size:14px!important;font-weight:800!important;white-space:nowrap!important}',
      '.mx-lab-method-row img{width:34px!important;height:22px!important;object-fit:contain!important}',
      '.mx-lab-method-row small{color:#64748b!important;font-size:13px!important;font-weight:500!important}',
      '.mx-lab-single-spei{display:flex!important;align-items:center!important;gap:8px!important;color:#111827!important;font-weight:800!important}',
      '.mx-lab-single-spei small{font-size:13px!important;font-weight:500!important;color:#64748b!important}',
      'button:has(img[src*="spei-logo"]) + button:has(img[src*="spei-logo"]){display:none!important}',
      'button:has(img[alt="SPEI"]) + button:has(img[alt="SPEI"]){display:none!important}',
      'body:before{content:"SIMULACION DE INVESTIGACION";position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:99999;background:#f59e0b;color:#111827;font:800 10px/1 sans-serif;padding:5px 9px;border-radius:0 0 8px 8px;letter-spacing:.06em}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function patchSpeiVisuals() {
    document.querySelectorAll('.mx-lab-single-spei').forEach(function (el) {
      el.remove();
    });

    var images = document.querySelectorAll('img');
    images.forEach(function (img) {
      var src = img.getAttribute('src') || '';
      var alt = img.getAttribute('alt') || '';
      if (/\/mb\.png|\/iban\.png|MB WAY|MBWAY|Multibanco|IBAN|SPEI/i.test(src + ' ' + alt)) {
        img.src = '/assets/spei-logo.png';
        img.alt = 'SPEI';
        img.classList.add('mx-lab-spei-logo');
      }
    });

    document.querySelectorAll('button').forEach(function (button) {
      var text = (button.textContent || '').trim();
      if (/Pago movil|MB Way|MB WAY|MBWAY|IBAN|Multibanco/i.test(text) && !/SPEI|Cambiar|CONFIRMAR|Canjear|Retirar|Pagar/i.test(text)) {
        button.classList.add('mx-lab-hide');
      }
      if (/Adicionar método|Adicionar metodo|Adicionar método de saque/i.test(text)) {
        button.textContent = 'Metodo de retiro';
      }
    });

    document.querySelectorAll('p,span,h1,h2,h3,label,button').forEach(function (el) {
      var text = (el.textContent || '').trim();
      if (text === 'SPEI') el.classList.add('mx-lab-method-title');
    });

    document.querySelectorAll('div,p,button').forEach(function (el) {
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/SPEI/i.test(text) || text.indexOf('/') === -1 || text.length > 70) return;
      if (el.querySelector('div,section,article')) return;
      el.innerHTML = '<span class="mx-lab-method-row"><img src="/assets/spei-logo.png" alt="SPEI"><span>SPEI</span><small>- Transferencia bancaria</small></span>';
    });

    document.querySelectorAll('div').forEach(function (panel) {
      var panelText = (panel.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/Adicionar método de saque|Metodo de retiro|SPEI\s+Transferencia bancaria/i.test(panelText)) return;
      var options = Array.prototype.filter.call(panel.children || [], function (child) {
        var text = (child.textContent || '').replace(/\s+/g, ' ').trim();
        return /^SPEI\s+Transferencia bancaria/i.test(text) && child.querySelector('img[src*="spei-logo"]');
      });
      options.forEach(function (option, index) {
        if (index > 0) option.classList.add('mx-lab-hide');
      });
    });

    var modal = Array.prototype.find.call(document.querySelectorAll('div'), function (el) {
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      return /Adicionar método de saque|Metodo de retiro/i.test(text) && /SPEI\s+Transferencia bancaria/i.test(text);
    });
    if (modal) {
      var speiRows = Array.prototype.filter.call(modal.querySelectorAll('button,div'), function (el) {
        var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!/^SPEI\s+Transferencia bancaria/i.test(text)) return false;
        if (!el.querySelector('img[src*="spei-logo"]')) return false;
        return el.offsetParent !== null;
      });
      var uniqueRows = speiRows.filter(function (row) {
        return !speiRows.some(function (other) {
          return other !== row && other.contains(row);
        });
      });
      uniqueRows.forEach(function (row, index) {
        row.classList.toggle('mx-lab-hide', index > 0);
      });
    }

    var visibleSpeiOptions = Array.prototype.filter.call(document.querySelectorAll('button'), function (button) {
      var text = (button.textContent || '').replace(/\s+/g, ' ').trim();
      var rect = button.getBoundingClientRect();
      return /^SPEI\s+Transferencia bancaria/i.test(text) &&
        button.querySelector('img[src*="spei-logo"]') &&
        rect.width > 120 &&
        rect.height > 35;
    });
    visibleSpeiOptions.forEach(function (button, index) {
      if (index > 0) button.style.display = 'none';
    });

    document.querySelectorAll('input').forEach(function (input) {
      var placeholder = input.getAttribute('placeholder') || '';
      if (/Nombre/i.test(placeholder)) {
        input.addEventListener('input', function () {
          try { localStorage.setItem('mx_lab_name', input.value.trim()); } catch (e) {}
        });
      }
      if (/NIF|MBway|IBAN|CURP|RFC|numero|número|referencia|referência|CLABE/i.test(placeholder)) {
        input.setAttribute('placeholder', 'Ingresa tu CLABE de 18 digitos');
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('maxlength', '18');
        input.setAttribute('autocomplete', 'off');
        input.addEventListener('input', function () {
          var clean = input.value.replace(/\D/g, '').slice(0, 18);
          if (input.value !== clean) input.value = clean;
        });
      }
    });

    document.querySelectorAll('span').forEach(function (prefix) {
      if ((prefix.textContent || '').trim() !== 'CLABE') return;
      var wrap = prefix.parentElement;
      if (!wrap || wrap.querySelector('.mx-lab-clabe-input')) return;
      var original = wrap.querySelector('input');
      if (!original) return;
      original.style.display = 'none';
      var clone = document.createElement('input');
      clone.className = original.className + ' mx-lab-clabe-input';
      clone.type = 'text';
      clone.inputMode = 'numeric';
      clone.maxLength = 18;
      clone.autocomplete = 'off';
      clone.placeholder = 'Ingresa tu CLABE de 18 digitos';
      clone.value = (original.value || '').replace(/\D/g, '').slice(0, 18);
      clone.addEventListener('input', function () {
        clone.value = clone.value.replace(/\D/g, '').slice(0, 18);
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        if (setter && setter.set) setter.set.call(original, clone.value.slice(0, 9));
        else original.value = clone.value.slice(0, 9);
        original.dispatchEvent(new Event('input', { bubbles: true }));
        original.dispatchEvent(new Event('change', { bubbles: true }));
      });
      wrap.appendChild(clone);
    });

    document.querySelectorAll('label').forEach(function (label) {
      if (/IBAN|NIF|Contribui|MBway|CLABE/i.test(label.textContent || '')) {
        label.textContent = 'CLABE interbancaria (18 digitos)';
      }
    });

    document.querySelectorAll('span').forEach(function (span) {
      if ((span.textContent || '').trim() === 'PT +351') {
        span.textContent = 'CLABE';
      }
      if (/^PT\s*\+351/i.test(span.textContent || '')) {
        span.textContent = 'SPEI';
      }
      if (/^\s*\/\s*SPEI\s*$/i.test(span.textContent || '') || /^\s*\/\s*IBAN\s*$/i.test(span.textContent || '')) {
        span.textContent = '';
        span.classList.add('mx-lab-hide');
      }
    });

    var hasContribution = !!Array.prototype.find.call(document.querySelectorAll('p,h2,h3,div'), function (el) {
      return /Contribucion de seguridad/i.test((el.textContent || '').replace(/\s+/g, ' ').trim()) && el.offsetParent !== null;
    });
    document.querySelectorAll('div,p').forEach(function (el) {
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (/Reembolso de \$(?:199\.90|197\.23|100\.00|100) MXN en 1 minuto/i.test(text)) {
        el.classList.toggle('mx-lab-hide', !hasContribution);
      }
      if (/^1\s*Pagar\s*\$(?:199\.90|197\.23|100\.00|100) MXN/i.test(text) && /2\s*Reembolso/i.test(text) && /3\s*\$58,800 MXN/i.test(text)) {
        el.classList.toggle('mx-lab-hide', !hasContribution);
      }
    });

    document.querySelectorAll('div').forEach(function (box) {
      var text = (box.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/DATOS DE RETIRO|Datos de retiro|Dados para reembolso/i.test(text) || !/Valor a recibir|Valor a receber|\$58,800 MXN/i.test(text)) return;
      var name = '';
      try {
        name = localStorage.getItem('mx_lab_name') || (document.querySelector('input[placeholder*="Nombre"]') || document.querySelector('input[type="text"]') || {}).value || '';
      } catch (e) {}
      if (!name) name = 'Nombre informado';
      var rows = Array.prototype.filter.call(box.querySelectorAll('div'), function (row) {
        var rowText = (row.textContent || '').replace(/\s+/g, ' ').trim();
        return /Data|Fecha|SPEI|Valor a receber|\$58,800 MXN/i.test(rowText) && row.children.length <= 3;
      });
      var speiRow = rows.find(function (row) {
        return /^SPEI\s+SPEI$|SPEI.*PT\s*\+351|SPEI.*\d{6,}/i.test((row.textContent || '').replace(/\s+/g, ' ').trim());
      });
      if (speiRow) {
        speiRow.innerHTML = '<span class="text-muted-foreground text-[15px]">SPEI</span><span class="font-semibold text-[15px] text-foreground">Transferencia bancaria</span>';
      }
      var dateRow = rows.find(function (row) { return /Data|Fecha/i.test(row.textContent || ''); });
      if (dateRow && !/Nombre/i.test(box.textContent || '')) {
        var nameRow = dateRow.cloneNode(true);
        nameRow.innerHTML = '<span class="text-muted-foreground text-[15px]">Nombre</span><span class="font-semibold text-[15px] text-foreground"></span>';
        nameRow.querySelector('span:last-child').textContent = name;
        dateRow.parentElement.insertBefore(nameRow, dateRow.nextSibling);
      }
      var nameValue = Array.prototype.find.call(box.querySelectorAll('span,strong,div'), function (el) {
        return (el.textContent || '').trim() === 'Nombre informado' || (el.previousElementSibling && /Nombre/i.test(el.previousElementSibling.textContent || ''));
      });
      if (nameValue && name) nameValue.textContent = name;
    });
  }

  function normalizeMoneyNodes(root) {
    var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var value = node.nodeValue;
      if (!value) return;
      value = value.replace(/MB\s*WAY|MBWAY|MBway|mbway|Multibanco|multibanco/g, 'SPEI');
      value = value.replace(/\bIBAN\b|\biban\b/g, 'CLABE');
      value = value.replace(/\$1,234\.80 MXN/g, '$58,800.00 MXN');
      value = value.replace(/\$192\.32 MXN/g, '$199.90 MXN');
      value = value.replace(/\$197\.23 MXN/g, '$199.90 MXN');
      value = value.replace(/\$1,938\.72 MXN/g, '$97.23 MXN');
      value = value.replace(/\$2,041\.83 MXN/g, '$97.23 MXN');
      value = value.replace(/\$2,098\.95 MXN/g, '$99.95 MXN');
      value = value.replace(/\$2,098\.94 MXN/g, '$99.95 MXN');
      value = value.replace(/\$2,070\.92 MXN/g, '$99.95 MXN');
      value = value.replace(/\$2,070\.91 MXN/g, '$99.95 MXN');
      value = value.replace(/\$2,071\.13 MXN/g, '$99.95 MXN');
      value = value.replace(/\$2,070\.71 MXN/g, '$99.95 MXN');
      value = value.replace(/Economia de\s+\$[0-9,.]+\s+MXN/g, 'Economia de $97.23 MXN');
      value = value.replace(/\$1,050 MXN/g, '$50.00 MXN');
      value = value.replace(/\$1,050\.00 MXN/g, '$50.00 MXN');
      value = value.replace(/Como obtuviste \$5,880\.00 MXN/g, 'Como obtuviste $58,800 MXN');
      value = value.replace(/Como obtuviste \$5,880 MXN/g, 'Como obtuviste $58,800 MXN');
      value = value.replace(/\$210\.00 MXN recibidos/g, '$2,100 MXN recibidos');
      value = value.replace(/\$210 MXN recibidos/g, '$2,100 MXN recibidos');
      value = value.replace(/\$5,670\.00 MXN recibidos/g, '$56,700 MXN recibidos');
      value = value.replace(/\$5,670 MXN recibidos/g, '$56,700 MXN recibidos');
      value = value.replace(/\+\$420\.00 MXN/g, '+$4,200 MXN');
      value = value.replace(/\+\$1,050\.00 MXN/g, '+$10,500 MXN');
      value = value.replace(/\+\$4,200\.00 MXN/g, '+$42,000 MXN');
      value = value.replace(/\$\s+/g, '$').replace(/\s+MXN/g, ' MXN');
      value = value.replace(/\$([0-9]{1,3}(?:,[0-9]{3})+)\.00 MXN/g, '$$$1 MXN');
      if (value !== node.nodeValue) node.nodeValue = value;
    });
  }

  function interceptPayments() {
    var originalFetch = window.fetch;
    window.fetch = function (url, opts) {
      var href = typeof url === 'string' ? url : String(url && url.url || '');
      var method = String((opts && opts.method) || 'GET').toUpperCase();
      if (method === 'POST' && href.indexOf('create-mbway') !== -1) {
        var tx = 'mx_lab_' + Date.now();
        return Promise.resolve(new Response(JSON.stringify({
          id: tx,
          transaction_id: tx,
          transactionId: tx,
          status: 'PENDING',
          method: 'mx_lab',
          paymentMethod: 'SIMULATION',
          amount: 0,
          currency: 'MXN',
          reference: 'SIMULACION',
          _lab: true,
          _message: 'Pago simulado. No se contacto ningun gateway.'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      if (method === 'POST' && href.indexOf('check-mbway') !== -1) {
        return Promise.resolve(new Response(JSON.stringify({
          status: 'PENDING',
          _lab: true,
          _message: 'Confirmacion simulada en modo laboratorio.'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return originalFetch.apply(this, arguments);
    };
  }

  function blockUpsellRoutes() {
    setInterval(function () {
      if (/\/(?:up|upsell)-?\d/i.test(location.pathname)) {
        var basePath = location.pathname.indexOf('/mexico') === 0 ? '/mexico' : '';
        location.replace(basePath + '/resgatar?mx_lab=1');
      }
    }, 400);
  }

  patchPrices();
  interceptPayments();
  blockUpsellRoutes();

  function run() {
    if (!document.body) return;
    addStyles();
    walk(document.body);
    normalizeMoneyNodes(document.body);
    patchSpeiVisuals();
    addBadge();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  new MutationObserver(function () { requestAnimationFrame(run); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
