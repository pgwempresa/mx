;(function () {
	  window.__MX_LAB_MODE__ = true;
	  window.__ttkBase = '/mexico/assets';
	  document.documentElement.lang = 'es-MX';

  var priceMap = {
    front: 50,
    back: 40,
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
    return '$' + value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MXN';
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  function getTrackingParameters() {
    var params = new URLSearchParams(location.search || '');
    var fbclid = params.get('fbclid') || '';
    return {
      fbp: getCookie('_fbp'),
      fbc: getCookie('_fbc') || (fbclid ? 'fb.1.' + Date.now() + '.' + fbclid : ''),
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || '',
      utm_term: params.get('utm_term') || ''
    };
  }

  function trackMetaEvent(eventName, data, options) {
    if (typeof window.fbq !== 'function') return;
    if (eventName === 'Purchase' && !isMexicoThankYouPage()) return;
    var payload = Object.assign({
      currency: 'MXN',
      value: 0,
      content_name: 'plano premium',
      payment_method: 'spei',
      page_path: location.pathname
    }, data || {});
    if (payload.currency === 'EUR') payload.currency = 'MXN';
    try {
      if (options && options.eventID) window.fbq('track', eventName, payload, { eventID: String(options.eventID) });
      else if (/^(SPEIGenerated)$/i.test(eventName)) window.fbq('trackCustom', eventName, payload);
      else window.fbq('track', eventName, payload);
    } catch (e) {}
  }

  function trackOnce(key, eventName, data, options) {
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch (e) {}
    trackMetaEvent(eventName, data, options);
  }

  function patchPrices() {
    window.CENTRAL_PRICES = Object.assign({}, window.CENTRAL_PRICES || {}, priceMap);
    window.__FUNIL_FEE_FRONT = priceMap.front;
    window.__FUNIL_FEE_BACK = priceMap.back;
    window.__FUNIL_AMOUNT_SAQUE_1 = 32800;
    window.getCentralPrice = function (key, fallback) {
      return Object.prototype.hasOwnProperty.call(priceMap, key) ? priceMap[key] : fallback;
    };
    window.trackMetaEvent = trackMetaEvent;
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
        amount: '32800',
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
      .replace(/Dados gerados!/g, 'Datos generados')
      .replace(/Meta agora/g, 'Meta ahora')
      .replace(/\bagora\b/g, 'ahora')
      .replace(/Transferência pendente/g, 'Transferencia pendiente')
      .replace(/a aguardar pagamento da taxa de libertação/g, 'esperando el pago de la tarifa de liberacion')
      .replace(/CONTRIBUIÇÃO DE SEGURIDAD/g, 'CONTRIBUCION DE SEGURIDAD')
      .replace(/CONTRIBUIÇÃO/g, 'CONTRIBUCION')
      .replace(/Contribuição/g, 'Contribucion')
      .replace(/Contribuição de seguridad exigida pelo sistema SPEI/g, 'Contribucion de seguridad requerida por el sistema SPEI')
      .replace(/após a confirmação SPEI/g, 'despues de la confirmacion SPEI')
      .replace(/PAGUE POR SPEI/g, 'Pagar mediante SPEI')
      .replace(/PAGUE POR/g, 'Pague la tarifa de verificación de identidad')
      .replace(/Pague por SPEI/g, 'Pagar mediante SPEI')
      .replace(/Pague por/g, 'Pague la tarifa de verificación de identidad')
      .replace(/Use a entidade e referência no app do seu banco\./g, 'Usa los datos SPEI en la app de tu banco.')
      .replace(/Entidade:/g, 'Método de pago:')
      .replace(/Referência:/g, 'Referencia:')
      .replace(/Aguardando pagamento/g, 'Esperando pago')
      .replace(/Oferta expira em/g, 'La oferta expira en')
      .replace(/Espere um pouco!/g, '¡Espera un momento!')
      .replace(/Seu saque de/g, 'Tu retiro de')
      .replace(/ainda está reservado/g, 'todavia esta reservado')
      .replace(/Você está prestes a perder/g, 'Estas a punto de perder')
      .replace(/A verificação de segurança é a última etapa para liberar seu saque\. Sem ela, o valor retorna ao fundo da plataforma\./g, 'La verificacion de seguridad es el ultimo paso para liberar tu retiro. Sin ella, el valor regresa al fondo de la plataforma.')
      .replace(/A verificação de segurança é a última etapa para liberar tu retiro\. Sin ella, el valor regresa al fondo de la plataforma\./g, 'La verificacion de seguridad es el ultimo paso para liberar tu retiro. Sin ella, el valor regresa al fondo de la plataforma.')
      .replace(/A verificação de segurança é a última etapa/g, 'La verificacion de seguridad es el ultimo paso')
      .replace(/A verificacion de seguridad es el ultimo paso/g, 'La verificacion de seguridad es el ultimo paso')
      .replace(/verificação/g, 'verificacion')
      .replace(/segurança/g, 'seguridad')
      .replace(/última/g, 'ultimo')
      .replace(/é\s+a\s+ultimo\s+etapa/g, 'es el ultimo paso')
      .replace(/é\s+a\s+ultimo\s+paso/g, 'es el ultimo paso')
      .replace(/é\s+a/g, 'es el')
      .replace(/ultimo\s+etapa/g, 'ultimo paso')
      .replace(/para liberar seu saque/g, 'para liberar tu retiro')
      .replace(/Sem ela, o valor retorna ao fundo da plataforma/g, 'Sin ella, el valor regresa al fondo de la plataforma')
      .replace(/DESCONTO EXCLUSIVO APLICADO/g, 'DESCUENTO EXCLUSIVO APLICADO')
      .replace(/Desconto exclusivo aplicado/g, 'Descuento exclusivo aplicado')
      .replace(/Como essa é sua primeira verificação, conseguimos um desconto especial na contribuição de segurança:/g, 'Como esta es tu primera verificacion, conseguimos un descuento especial en la contribucion de seguridad:')
      .replace(/Como essa é sua primeira verificacion, conseguimos um desconto especial na contribucion de seguridad:/g, 'Como esta es tu primera verificacion, conseguimos un descuento especial en la contribucion de seguridad:')
      .replace(/Como essa é/g, 'Como esta es')
      .replace(/sua\s+primeira/g, 'tu primera')
      .replace(/\bsua\b/g, 'tu')
      .replace(/\bprimeira\b/g, 'primera')
      .replace(/conseguimos um/g, 'conseguimos un')
      .replace(/na contribuição/g, 'en la contribucion')
      .replace(/desconto especial/g, 'descuento especial')
      .replace(/De /g, 'De ')
      .replace(/por apenas:/g, 'por solo:')
      .replace(/Economia de/g, 'Ahorro de')
      .replace(/LIBERAR MEU SAQUE DE/g, 'LIBERAR MI RETIRO DE')
      .replace(/gente eu tava quase desistindo kkk mas paguei a taxinha e caiu na hora, obrigada Meta/g, 'casi me estaba rindiendo, pero pague la tarifa y se libero al momento; gracias Meta')
      .replace(/não acreditei até cair no SPEI kkkkk paguei o desconto e em 2 min já tava en la cuenta, é real demais/g, 'no lo crei hasta verlo reflejado; pague con descuento y en 2 minutos ya estaba en la cuenta')
      .replace(/Mandaste muito bem como utilizador ativo na plataforma\. O teu envolvimento foi reconhecido e a tua recompensa já está disponível\./g, 'Lo hiciste muy bien como usuario activo en la plataforma. Tu actividad fue reconocida y tu recompensa ya esta disponible.')
      .replace(/Mandaste muito bem como utilizador ativo na plataforma\. O tu envolvimento foi reconhecido e a tu recompensa já está disponível\./g, 'Lo hiciste muy bien como usuario activo en la plataforma. Tu actividad fue reconocida y tu recompensa ya esta disponible.')
      .replace(/Mandaste muito bem/g, 'Lo hiciste muy bien')
      .replace(/utilizador ativo/g, 'usuario activo')
      .replace(/O teu envolvimento foi reconhecido/g, 'Tu actividad fue reconocida')
      .replace(/O tu envolvimento foi reconhecido/g, 'Tu actividad fue reconocida')
      .replace(/a tua recompensa já está disponível/g, 'tu recompensa ya esta disponible')
      .replace(/a tu recompensa já está disponível/g, 'tu recompensa ya esta disponible')
      .replace(/Continuar/g, 'Continuar')
      .replace(/24 de fev - 10 de mar/g, '24 de feb - 10 de mar')
      .replace(/Garantiste/g, 'Ganaste')
      .replace(/A tua Mega Recompensa foi conquistada com sucesso/g, 'Tu mega recompensa fue obtenida con exito')
      .replace(/Mega Recompensa/g, 'Mega recompensa')
      .replace(/Resgatar recompensa/g, 'Canjear recompensa')
      .replace(/Código de convite/g, 'Codigo de invitacion')
      .replace(/Resumo da tua atividade na plataforma/g, 'Resumen de tu actividad en la plataforma')
      .replace(/Parabéns! Por seres um utilizador ativo na plataforma, estás a ser recompensado com base no teu envolvimento contínuo\./g, '¡Felicidades! Por ser un usuario activo en la plataforma, estas siendo recompensado con base en tu actividad continua.')
      .replace(/Por seres um utilizador ativo na plataforma, estás a ser recompensado com base no teu envolvimento contínuo\./g, 'Por ser un usuario activo en la plataforma, estas siendo recompensado con base en tu actividad continua.')
      .replace(/Por seres um usuario activo na plataforma, estás a ser recompensado com base no tu envolvimento contínuo\./g, 'Por ser un usuario activo en la plataforma, estas siendo recompensado con base en tu actividad continua.')
      .replace(/Partilhaste o teu link e os teus amigos acederam ao Meta, registaram-se e inseriram o teu código de convite\./g, 'Compartiste tu enlace y tus amigos accedieron a Meta, se registraron e ingresaron tu codigo de invitacion.')
      .replace(/Compartiste o tu link e tus amigos acederam ao Meta, se registraron e ingresaron o tu codigo de invitacion\./g, 'Compartiste tu enlace y tus amigos accedieron a Meta, se registraron e ingresaron tu codigo de invitacion.')
      .replace(/Os teus amigos viram interagiu com publicações por dia durante o período completo\./g, 'Tus amigos vieron e interactuaron con publicaciones por dia durante el periodo completo.')
      .replace(/Tus amigos vieron e interacturon con publicaciones por dia durante el periodo completo\./g, 'Tus amigos vieron e interactuaron con publicaciones por dia durante el periodo completo.')
      .replace(/Ver detalhes/g, 'Ver detalles')
      .replace(/Mais de 100 vídeos partilhados com amigos/g, 'Mas de 100 videos compartidos con amigos')
      .replace(/Mais de 250 horas vistas na plataforma/g, 'Mas de 250 horas vistas en la plataforma')
      .replace(/Mais de 420 anúncios visualizados/g, 'Mas de 420 anuncios vistos')
      .replace(/Mais de 1\.000 vídeos com gosto/g, 'Mas de 1,000 videos con me gusta')
      .replace(/7 dias consecutivos a aceder diariamente/g, '7 dias consecutivos accediendo diariamente')
      .replace(/Atividade consistente validada durante todo o período da campanha/g, 'Actividad constante validada durante todo el periodo de la campana')
      .replace(/Estas ações confirmam que todos os critérios exigidos pela campanha foram integralmente cumpridos\./g, 'Estas acciones confirman que todos los criterios requeridos por la campana fueron cumplidos.')
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
      .replace(/Quem já levantou hoje/gi, 'QUIEN YA RETIRO HOY')
      .replace(/Quem já retiro hoje/gi, 'QUIEN YA RETIRO HOY')
      .replace(/Contribuição de segurança/g, 'Contribucion de seguridad')
      .replace(/Composição da taxa/g, 'Composicion de la tarifa')
      .replace(/Dados para reembolso/g, 'Datos de retiro')
      .replace(/reembolsável/gi, 'reembolsable')
      .replace(/O valor de/g, 'Una vez completada la verificación, los')
      .replace(/El valor de/g, 'Una vez completada la verificación, los')
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
      .replace(/O teu saldo/g, 'Tu saldo')
      .replace(/O tu saldo/g, 'Tu saldo')
      .replace(/ponto\(s\)/g, 'punto(s)')
      .replace(/Aguardando confirmação de levantamento/g, 'Esperando confirmacion del retiro')
      .replace(/As tuas transações/g, 'Tus transacciones')
      .replace(/As tus transações/g, 'Tus transacciones')
      .replace(/transações/g, 'transacciones')
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
      .replace(/em 1 min/g, 'en 1 min')
      .replace(/Pagar/g, 'Pagar')
      .replace(/na conta/g, 'en la cuenta')
      .replace(/QUEM JÁ LEVANTOU HOJE/g, 'QUIEN YA RETIRO HOY')
      .replace(/QUEM JÁ RETIRO HOJE/g, 'QUIEN YA RETIRO HOY')
      .replace(/\+8\.432 levantamentos confirmados hoje/g, '+8,432 retiros confirmados hoy')
      .replace(/\+8\.432 retiros confirmados hoje/g, '+8,432 retiros confirmados hoy')
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
      .replace(/Contribucion de seguridad exigida pelo sistema SPEI para libertação do retiro/g, 'El sistema SPEI requiere una garantía para liberar el retiro')
      .replace(/Contribucion de seguridad requerida por el sistema SPEI para liberar el retiro/g, 'El sistema SPEI requiere una garantía para liberar el retiro')
      .replace(/será devolvido integralmente via SPEI em 1 minuto/g, 'serán reembolsados íntegramente a través de SPEI en un plazo de 1 minuto')
      .replace(/será devolvido integralmente via SPEI en 1 minuto/g, 'serán reembolsados íntegramente a través de SPEI en un plazo de 1 minuto')
      .replace(/sera devuelto integralmente via SPEI en 1 minuto/g, 'serán reembolsados íntegramente a través de SPEI en un plazo de 1 minuto')
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
      .replace(/Resgatar saldo/g, 'Canjear saldo')
      .replace(/Para levantares dinheiro, precisas de um saldo mínimo de €10\. Os limites de levantamento para transações individuais e mensais podem variar conforme o país ou a região\./g, 'Para retirar dinero, necesitas un saldo minimo de $10 MXN. Los limites de retiro para transacciones individuales y mensuales pueden variar segun el pais o la region.')
      .replace(/Para retirares dinheiro, precisas de um saldo mínimo de \$10\. MXN Os limites de retiro para transações individuais e mensais podem variar conforme o país ou a região\./g, 'Para retirar dinero, necesitas un saldo minimo de $10 MXN. Los limites de retiro para transacciones individuales y mensuales pueden variar segun el pais o la region.')
      .replace(/Para\s+retirares\s+dinheiro,[^.]+região\./g, 'Para retirar dinero, necesitas un saldo minimo de $10 MXN. Los limites de retiro para transacciones individuales y mensuales pueden variar segun el pais o la region.')
      .replace(/Obtém Moedas para a LIVE/g, 'Obtén monedas para LIVE')
      .replace(/Use Moedas para enviar presentes virtuis para os tus hosts de LIVE favoritos\./g, 'Usa monedas para enviar regalos virtuales a tus hosts favoritos de LIVE.')
      .replace(/Use Moedas para enviar presentes virtuais para os teus hosts de LIVE favoritos\./g, 'Usa monedas para enviar regalos virtuales a tus hosts favoritos de LIVE.')
      .replace(/regalos virtules/g, 'regalos virtuales')
      .replace(/Indisponível/g, 'No disponible')
      .replace(/Retirar dinero/g, 'Retirar dinero')
      .replace(/Precisa de ajuda/g, 'Necesitas ayuda')
      .replace(/Supervisionado/g, 'Supervisado')
      .replace(/Processo/g, 'Proceso')
      .replace(/Data/g, 'Fecha')
      .replace(/há/g, 'hace')
      .replace(/Parceiro/g, 'Socio')
      .replace(/paguei a achar que era golpe kkk mas o reembolso chegou antes do retiro, nunca mais duvido/g, 'pense que era fraude, pero el reembolso llego antes del retiro; ya no tengo dudas')
      .replace(/estava cheia de medo mas fiz e chegou certinho, obrigada Meta por esta oportunidade a sério/g, 'tenia miedo, pero lo hice y llego correctamente; gracias Meta por esta oportunidad')
      .replace(/terceira vez a retirar já, de cada vez chega em menos de 2 min, não tem erro nenhum/g, 'tercera vez retirando; siempre llega en menos de 2 minutos, sin ningun problema')
      .replace(/terceira vez a levantar já, de cada vez chega em menos de 2 min, não tem erro nenhum/g, 'tercera vez retirando; siempre llega en menos de 2 minutos, sin ningun problema')
      .replace(/quase não fiz por causa da taxa mas devolveram tão rápido que nem deu tempo de me arrepender kkk/g, 'casi no lo hice por la tarifa, pero la devolvieron tan rapido que ni alcance a arrepentirme')
      .replace(/Lisboa/g, 'Ciudad de Mexico')
      .replace(/Porto/g, 'Guadalajara')
      .replace(/Braga/g, 'Monterrey')
      .replace(/Coimbra/g, 'Puebla')
      .replace(/Recife, PE/g, 'Ciudad de Mexico')
      .replace(/Belo Horizonte, MG/g, 'Guadalajara');
  }

  function translateMoney(text) {
    return String(text || '')
      .replace(/\b2\.800,00\b/g, '32,800.00')
      .replace(/\b2\.800\b/g, '32,800')
      .replace(/\b2800,00\b/g, '32,800.00')
      .replace(/\b2800\b/g, '32,800')
      .replace(/€\s*([0-9.,]+)/g, function (_, raw) {
      if (/^(?:32[,.]800|32[,.]800[,.]00|2\.800|2\.800,00|2800|2800,00)$/i.test(raw)) return money(32800);
      var normalized = raw.replace(/\./g, '').replace(',', '.');
      var eur = Number(normalized);
      if (!Number.isFinite(eur)) return '$ ' + raw + ' MXN';
      if (Math.abs(eur - 32800) < 0.01 || Math.abs(eur - 2800) < 0.01) return money(32800);
      if (Math.abs(eur - 58800) < 0.01 || Math.abs(eur - 2800) < 0.01) return money(32800);
      if (Math.abs(eur - 32.8) < 0.01 || Math.abs(eur - 32.80) < 0.01) return money(32800);
      if (Math.abs(eur - 58.8) < 0.01 || Math.abs(eur - 58.80) < 0.01) return money(32800);
      if (Math.abs(eur - 97.23) < 0.01) return money(97.23);
      if (Math.abs(eur - 99.95) < 0.01) return money(99.95);
      if (Math.abs(eur - 100.00) < 0.01) return money(100);
      var isLabPrice = Object.keys(priceMap).some(function (key) {
        return Math.abs(Number(priceMap[key]) - eur) < 0.01;
      });
      if (isLabPrice) return money(eur);
      return '$' + raw + ' MXN';
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
    badge.textContent = '';
    badge.style.cssText = 'display:none!important';
    document.body.appendChild(badge);
  }

  function addStyles() {
    if (document.getElementById('mx-lab-style')) return;
    var style = document.createElement('style');
    style.id = 'mx-lab-style';
    style.textContent = [
      'html,body{overflow-x:hidden!important;background:#f5f5f5!important}',
      'body{padding-bottom:0!important}',
      '#root{max-width:430px;margin:0 auto}',
      '#mx-lab-badge{display:none!important}',
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
      '.mx-lab-reward-card{width:86px!important;height:118px!important;padding:8px 6px!important;align-items:center!important;justify-content:center!important;overflow:hidden!important}',
      '.mx-lab-reward-card > span{display:block!important;width:100%!important;text-align:center!important;font-size:13px!important;line-height:1.12!important;letter-spacing:-.03em!important;white-space:normal!important;overflow:visible!important;margin-top:6px!important}',
      '.mx-lab-document-wrap{display:block!important}',
      '.mx-lab-document-wrap label{color:#64748b!important;font-size:13px!important;margin-bottom:4px!important;display:block!important}',
      '.mx-lab-document-input{width:100%!important;height:44px!important;border:2px solid #E5E7EB!important;border-radius:10px!important;padding:0 12px!important;font-size:15px!important;color:#111827!important;background:#fff!important;outline:none!important;text-transform:uppercase!important}',
      '.mx-lab-document-input:focus{border-color:#1877F2!important}',
      '.mx-lab-clabe-input{width:100%!important;height:44px!important;border:2px solid #E5E7EB!important;border-radius:10px!important;padding:0 12px!important;font-size:15px!important;color:#111827!important;background:#fff!important;outline:none!important}',
      '.mx-lab-clabe-input:focus{border-color:#1877F2!important}',
      '.mx-lab-reference-text{display:block!important;max-width:100%!important;min-width:0!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-all!important;line-height:1.35!important}',
      '.mx-lab-reference-box{max-width:100%!important;min-width:0!important;overflow:hidden!important;box-sizing:border-box!important;display:block!important;text-align:left!important}',
      '.mx-lab-reference-box *{min-width:0!important;max-width:100%!important}',
      '.mx-lab-reference-box .mx-lab-reference-text{font-size:14px!important}',
      '.mx-lab-copy-reference-btn{width:100%!important;height:48px!important;border:0!important;border-radius:12px!important;background:#1877F2!important;color:#fff!important;font-size:15px!important;font-weight:800!important;display:flex!important;align-items:center!important;justify-content:center!important;margin:12px 0 0!important;box-shadow:none!important;cursor:pointer!important}',
      'button:has(img[src*="spei-logo"]) + button:has(img[src*="spei-logo"]){display:none!important}',
      'button:has(img[alt="SPEI"]) + button:has(img[alt="SPEI"]){display:none!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function isMexicoThankYouPage() {
    return /^\/mexico\/(?:gracias|obrigado)\/?$/i.test(location.pathname || '');
  }

  function renderMexicoThankYouPage() {
    if (!isMexicoThankYouPage() || !document.body) return false;
    var root = document.getElementById('root') || document.body;
    if (document.getElementById('mx-lab-thankyou-page')) return true;
    var name = 'Cliente';
    var amount = '$32,800 MXN';
    var clabe = '';
    try {
      name = localStorage.getItem('mx_lab_name') || name;
      clabe = localStorage.getItem('mx_lab_clabe') || '';
    } catch (e) {}
    try {
      var paid = JSON.parse(localStorage.getItem('mx_lab_paid_transaction') || '{}') || {};
      var txId = paid.transaction_id || paid.transactionId || paid.id || paid.external_id || 'mx-paid';
      trackOnce('mx_purchase_paid_' + txId, 'Purchase', {
        currency: 'MXN',
        value: Number(paid.amount || 0) || 0,
        content_name: 'plano premium',
        payment_method: 'spei',
        transaction_id: String(txId),
        page_path: location.pathname
      }, { eventID: txId });
    } catch (e) {}
    root.setAttribute('data-mx-lab-thankyou', '1');
    root.innerHTML = [
      '<main id="mx-lab-thankyou-page" style="min-height:100vh;background:#eef3f8;max-width:430px;margin:0 auto;padding:28px 20px 48px;font-family:Arial,sans-serif;color:#0f172a;box-sizing:border-box">',
      '<section style="display:flex;flex-direction:column;align-items:center;text-align:center">',
      '<div style="width:84px;height:84px;border-radius:999px;background:#16a34a;display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px rgba(22,163,74,.28);margin-top:18px">',
      '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>',
      '</div>',
      '<h1 style="font-size:30px;line-height:1.05;font-weight:900;margin:24px 0 0">Pago confirmado</h1>',
      '<p style="font-size:15px;line-height:1.5;color:#64748b;margin:12px 0 0">Gracias, ' + escapeHtml(name) + '. La confirmacion SPEI fue recibida correctamente.</p>',
      '</section>',
      '<section style="background:#fff;border-radius:24px;padding:20px;margin-top:26px;box-shadow:0 20px 60px rgba(15,23,42,.08)">',
      '<p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#94a3b8;font-weight:900;text-align:center;margin:0">saldo programado</p>',
      '<p style="font-size:34px;font-weight:900;text-align:center;margin:6px 0 0">' + amount + '</p>',
      '<div style="height:1px;background:#e2e8f0;margin:20px 0"></div>',
      '<div style="display:flex;gap:12px;margin-bottom:16px"><span style="width:28px;height:28px;border-radius:999px;background:#dbeafe;color:#1d4ed8;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;flex:0 0 auto">1</span><div><strong style="display:block;font-size:14px">Validacion completada</strong><span style="display:block;color:#64748b;font-size:13px;line-height:1.35;margin-top:3px">El sistema marco el pago como confirmado en XPagamentos.</span></div></div>',
      '<div style="display:flex;gap:12px"><span style="width:28px;height:28px;border-radius:999px;background:#dcfce7;color:#15803d;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;flex:0 0 auto">2</span><div><strong style="display:block;font-size:14px">Retiro en procesamiento</strong><span style="display:block;color:#64748b;font-size:13px;line-height:1.35;margin-top:3px">El saldo puede aparecer en la cuenta bancaria dentro de hasta 24 horas.</span></div></div>',
      '</section>',
      '<section style="background:#0f172a;color:#fff;border-radius:20px;padding:16px;margin-top:18px;text-align:center">',
      '<p style="font-size:13px;line-height:1.45;margin:0">Mantén disponible tu cuenta SPEI' + (clabe ? ' terminada en ' + escapeHtml(clabe.slice(-4)) : '') + '. Si hay demora, espera la ventana de validacion bancaria de 24 horas.</p>',
      '</section>',
      '</main>'
    ].join('');
    addBadge();
    return true;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
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
        img.src = '/mexico/assets/spei-logo.png';
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

	    document.querySelectorAll('p,span,div').forEach(function (el) {
	      if (el.children && el.children.length > 0) return;
	      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
	      if (/^A verificacion de seguridad es el ultimo paso/i.test(text)) {
	        el.textContent = text.replace(/^A verificacion/i, 'La verificacion');
	      }
	      if (/^\s*€\s*58,800\.00\s*$/i.test(text) || /^\s*\$\s*58,800\.00\s*MXN\s*$/i.test(text) || /^\s*€\s*32,800\.00\s*$/i.test(text)) {
	        el.textContent = '$32,800 MXN';
	      }
	      if (/^\s*=\s*28\s*000\s*punto\(s\)\s*$/i.test(text) || /^\s*=\s*58,800\s*MXN\s*$/i.test(text)) {
	        el.textContent = '= 32,800 MXN';
	      }
	    });

    document.querySelectorAll('div,p,button').forEach(function (el) {
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/SPEI/i.test(text) || text.indexOf('/') === -1 || text.length > 70) return;
      if (el.querySelector('div,section,article')) return;
      el.innerHTML = '<span class="mx-lab-method-row"><img src="/mexico/assets/spei-logo.png" alt="SPEI"><span>SPEI</span><small>- Transferencia bancaria</small></span>';
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

    patchRewardCards();
    patchXpagGeneratedPanel();
    patchDocumentField();
    patchClabeField();

    document.querySelectorAll('input').forEach(function (input) {
      if (input.classList.contains('mx-lab-document-input')) return;
      var placeholder = input.getAttribute('placeholder') || '';
      if (/Nombre|Nome/i.test(placeholder)) {
        input.addEventListener('input', function () {
          try { localStorage.setItem('mx_lab_name', input.value.trim()); } catch (e) {}
        });
      }
      if (/NIF|MBway|IBAN|numero|número|referencia|referência|CLABE/i.test(placeholder)) {
        input.setAttribute('placeholder', 'Ingresa tu CLABE de 18 digitos');
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('maxlength', '18');
        input.setAttribute('autocomplete', 'off');
        input.addEventListener('input', function () {
          var clean = input.value.replace(/\D/g, '').slice(0, 18);
          if (input.value !== clean) input.value = clean;
          try {
            var saved = localStorage.getItem('mx_lab_clabe') || '';
            if (!saved || clean.length >= saved.length || clean.length === 18) localStorage.setItem('mx_lab_clabe', clean);
          } catch (e) {}
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
	        try { localStorage.setItem('mx_lab_clabe', clone.value); } catch (e) {}
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
      return /Contribuci[oó]n de seguridad/i.test((el.textContent || '').replace(/\s+/g, ' ').trim()) && el.offsetParent !== null;
    });
    document.querySelectorAll('div,p').forEach(function (el) {
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length > 220 || el.querySelector('section,header,main')) return;
      if (el.querySelector('button')) return;
      if (/Reembolso de \$(?:199\.90|197\.23|100\.00|100|60\.00|60|50\.00|50|40\.00|40) MXN en 1 minuto/i.test(text)) {
        el.classList.toggle('mx-lab-hide', !hasContribution);
      }
      if (/^1\s*Pagar\s*\$(?:199\.90|197\.23|100\.00|100|60\.00|60|50\.00|50|40\.00|40) MXN/i.test(text) && /2\s*Reembolso/i.test(text) && /3\s*\$(?:58,800|32,800) MXN/i.test(text)) {
        el.classList.toggle('mx-lab-hide', !hasContribution);
      }
    });

    patchWithdrawalDataCards();
  }

  function patchXpagGeneratedPanel() {
    document.querySelectorAll('p,h1,h2,h3,span,button,div').forEach(function (el) {
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      Array.prototype.forEach.call(el.childNodes || [], function (node) {
        if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue) return;
        var next = node.nodeValue
          .replace(/PAGUE POR SPEI/g, 'PAGA POR SPEI')
          .replace(/PAGUE POR/g, 'PAGA POR')
          .replace(/Pague por SPEI/g, 'Paga por SPEI')
          .replace(/Pague por/g, 'Paga por');
        if (next !== node.nodeValue) node.nodeValue = next;
      });
      if (text === 'PAGA POR SPEI' || text === 'PAGUE POR SPEI' || text === 'PAGUE VIA SPEI' || text === 'Pague via SPEI' || text === 'Pagar mediante SPEI') el.textContent = 'Pagar mediante SPEI';
      if (text === 'PAGA POR' || text === 'PAGUE POR' || text === 'Confirme o pedido no app SPEI.' || text === 'Confirme o pedido no app SPEI' || text === 'Pague la tarifa de verificación de identidad') el.textContent = 'Pague la tarifa de verificación de identidad';
      if (text === 'Paga por SPEI' || text === 'Pague por SPEI') el.textContent = 'Pagar mediante SPEI';
      if (text === 'Entidade:' || text === 'Banco:') el.textContent = 'Banco:';
      if (text === 'Referência:') el.textContent = 'Referencia:';
      if (text === 'Aguardando pagamento...') el.textContent = 'Esperando pago...';
    });
  }

  function patchDocumentField() {
    var nameInput = Array.prototype.find.call(document.querySelectorAll('input'), function (input) {
      var placeholder = input.getAttribute('placeholder') || '';
      return input.offsetParent !== null && /Nombre|Nome/i.test(placeholder);
    });
    if (!nameInput) return;
    var nameBlock = nameInput.closest('div');
    var formBlock = nameBlock && nameBlock.parentElement;
    if (!nameBlock || !formBlock || formBlock.querySelector('.mx-lab-document-input')) return;

    var wrap = document.createElement('div');
    wrap.className = 'mx-lab-document-wrap';
    var label = document.createElement('label');
    label.textContent = 'Documento mexicano (CURP/RFC)';
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'mx-lab-document-input';
    input.placeholder = 'Ingresa CURP o RFC';
    input.maxLength = 18;
    input.autocomplete = 'off';
    try { input.value = localStorage.getItem('mx_lab_document') || ''; } catch (e) {}
    input.addEventListener('input', function () {
      input.value = input.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 18);
      try { localStorage.setItem('mx_lab_document', input.value); } catch (e) {}
    });
    wrap.appendChild(label);
    wrap.appendChild(input);
    formBlock.insertBefore(wrap, nameBlock.nextSibling);
  }

  function patchClabeField() {
    document.querySelectorAll('input').forEach(function (original) {
      if (original.classList.contains('mx-lab-document-input') || original.classList.contains('mx-lab-clabe-input')) return;
      var placeholder = original.getAttribute('placeholder') || '';
      if (!/CLABE|IBAN|MBway|numero|número|referencia|referência|NIF/i.test(placeholder)) return;
      var wrap = original.parentElement;
      if (!wrap || wrap.querySelector('.mx-lab-clabe-input')) return;

      original.style.display = 'none';
      var clone = document.createElement('input');
      clone.className = (original.className || '') + ' mx-lab-clabe-input';
      clone.type = 'text';
      clone.inputMode = 'numeric';
      clone.maxLength = 18;
      clone.autocomplete = 'off';
      clone.placeholder = 'Ingresa tu CLABE de 18 digitos';
      try {
        clone.value = (localStorage.getItem('mx_lab_clabe') || original.value || '').replace(/\D/g, '').slice(0, 18);
      } catch (e) {
        clone.value = String(original.value || '').replace(/\D/g, '').slice(0, 18);
      }
      clone.addEventListener('input', function () {
        clone.value = clone.value.replace(/\D/g, '').slice(0, 18);
        try { localStorage.setItem('mx_lab_clabe', clone.value); } catch (e) {}
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        if (setter && setter.set) setter.set.call(original, clone.value.slice(0, 9));
        else original.value = clone.value.slice(0, 9);
        original.dispatchEvent(new Event('input', { bubbles: true }));
        original.dispatchEvent(new Event('change', { bubbles: true }));
      });
      wrap.appendChild(clone);
    });
  }

  function patchRewardCards() {
    document.querySelectorAll('span').forEach(function (span) {
      var text = (span.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/^\$(?:280|5,?880|58,?800)(?:\.00)?\s*MXN$/i.test(text)) return;
      var card = span.parentElement;
      if (!card || !card.querySelector('svg')) return;
      var rect = card.getBoundingClientRect();
      if (rect.width > 120 || rect.height < 70) return;
      card.classList.add('mx-lab-reward-card');
      span.textContent = text.replace(/\s*MXN$/i, '\nMXN');
    });
  }

  function persistCustomerData() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll('input'));
    var visibleInputs = inputs.filter(function (input) {
      return input.offsetParent !== null && window.getComputedStyle(input).display !== 'none';
    });
    var sourceInputs = visibleInputs.length ? visibleInputs : inputs;
    var nameInput = sourceInputs.find(function (input) {
      var placeholder = input.getAttribute('placeholder') || '';
      return /Nombre|Nome/i.test(placeholder) && !/CLABE/i.test(placeholder);
    });
    var clabeInput = sourceInputs.find(function (input) {
      var placeholder = input.getAttribute('placeholder') || '';
      return input.classList.contains('mx-lab-clabe-input') || /CLABE/i.test(placeholder);
    });
    var documentInput = sourceInputs.find(function (input) {
      return input.classList.contains('mx-lab-document-input') || /CURP|RFC|Documento/i.test(input.getAttribute('placeholder') || '');
    });
    try {
      if (nameInput && nameInput.value.trim()) localStorage.setItem('mx_lab_name', nameInput.value.trim());
      if (documentInput && documentInput.value.trim()) {
        localStorage.setItem('mx_lab_document', documentInput.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 18));
      }
      if (clabeInput && clabeInput.value.trim()) {
        var cleanClabe = clabeInput.value.replace(/\D/g, '').slice(0, 18);
        var savedClabe = localStorage.getItem('mx_lab_clabe') || '';
        if (!savedClabe || cleanClabe.length >= savedClabe.length || cleanClabe.length === 18) {
          localStorage.setItem('mx_lab_clabe', cleanClabe);
        }
      }
    } catch (e) {}
  }

  function patchWithdrawalDataCards() {
    persistCustomerData();
    var name = 'Nombre informado';
    var documentValue = 'Documento informado';
    var clabe = 'CLABE informada';
    try {
      name = localStorage.getItem('mx_lab_name') || name;
      documentValue = localStorage.getItem('mx_lab_document') || documentValue;
      clabe = (localStorage.getItem('mx_lab_clabe') || clabe).replace(/\D/g, '').slice(0, 18) || clabe;
    } catch (e) {}

    document.querySelectorAll('div').forEach(function (box) {
      var text = (box.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/DATOS DE RETIRO|Datos de retiro|Dados para reembolso/i.test(text) || !/Valor a recibir|Valor a receber|\$58,800 MXN/i.test(text)) return;
      if (box.querySelector('section,header,main,button,input')) return;

      var signature = name + '|' + documentValue + '|' + clabe;
      if (box.getAttribute('data-mx-lab-withdrawal') === signature) return;
      box.setAttribute('data-mx-lab-withdrawal', signature);
      box.innerHTML =
        '<p class="text-muted-foreground text-[12px] uppercase tracking-wide font-bold mb-4">DATOS DE RETIRO</p>' +
        '<div class="flex items-center justify-between py-3 border-b border-[#F0F0F0]"><span class="text-muted-foreground text-[15px]">Fecha</span><span class="font-semibold text-[15px] text-foreground">14/08/2026</span></div>' +
        '<div class="flex items-center justify-between py-3 border-b border-[#F0F0F0]"><span class="text-muted-foreground text-[15px]">Nombre</span><span class="font-semibold text-[15px] text-foreground"></span></div>' +
        '<div class="flex items-center justify-between py-3 border-b border-[#F0F0F0]"><span class="text-muted-foreground text-[15px]">Documento</span><span class="font-semibold text-[15px] text-foreground"></span></div>' +
        '<div class="flex items-center justify-between py-3 border-b border-[#F0F0F0]"><span class="flex items-center gap-2 text-muted-foreground text-[15px]"><img src="/mexico/assets/spei-logo.png" alt="SPEI" class="h-[20px] object-contain"><strong class="text-foreground">SPEI</strong></span><span class="font-semibold text-[15px] text-foreground"></span></div>' +
        '<div class="flex items-center justify-between py-3 border-b border-[#F0F0F0]"><span class="text-muted-foreground text-[15px]">Valor a recibir</span><span class="font-bold text-[15px] text-foreground">$58,800 MXN</span></div>';
      var values = box.querySelectorAll('div > span:last-child');
      if (values[1]) values[1].textContent = name;
      if (values[2]) values[2].textContent = documentValue;
      if (values[3]) values[3].textContent = clabe;
    });
  }

  function getCurrentSpeiReference() {
    try {
      var pending = JSON.parse(localStorage.getItem('pending_mbway') || '{}') || {};
      var data = pending.data || {};
      return data.copy_code || data.qr_code || data.reference || data.ref ||
        (data.referenceData && (data.referenceData.reference || data.referenceData.clabe)) ||
        data.clabe || localStorage.getItem('mx_lab_spei_reference') || '';
    } catch (e) {
      try { return localStorage.getItem('mx_lab_spei_reference') || ''; } catch (_) { return ''; }
    }
  }

  function rememberSpeiReference(value) {
    var clean = String(value || '').trim();
    if (!clean || clean.length < 8) return;
    try { localStorage.setItem('mx_lab_spei_reference', clean); } catch (e) {}
  }

  function extractSpeiReference(text) {
    var value = String(text || '');
    var match = value.match(/sbx_[a-z0-9]{10,}/i) || value.match(/\b[a-z0-9]{22,}\b/i) || value.match(/\b[0-9]{12,22}\b/);
    return match ? match[0] : '';
  }

  function patchSpeiReferenceLayout() {
    var copyButtons = Array.prototype.filter.call(document.querySelectorAll('button'), function (button) {
      return button.classList.contains('mx-lab-copy-reference-btn') || /copiar.*(?:referencia|spei)|(?:referencia|spei).*copiar/i.test(button.textContent || '');
    });
    var heading = Array.prototype.find.call(document.querySelectorAll('p,span,div,strong,h1,h2,h3'), function (el) {
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      return /^(?:PAGUE|PAGA)(?: POR| VIA)? SPEI$/i.test(text) || text === 'Pagar mediante SPEI';
    });
    var paymentCard = heading;
    while (paymentCard && paymentCard !== document.body) {
      var cardText = (paymentCard.textContent || '').replace(/\s+/g, ' ');
      if (/(?:Banco|Método de pago):/i.test(cardText) && /(?:Referencia|CLABE):/i.test(cardText)) break;
      paymentCard = paymentCard.parentElement;
    }
    if (!paymentCard || paymentCard === document.body) {
      copyButtons.forEach(function (button) { button.remove(); });
      return;
    }

    copyButtons.forEach(function (button) {
      if (!paymentCard.contains(button)) button.remove();
    });

    var reference = getCurrentSpeiReference();
    var referenceBox = Array.prototype.filter.call(paymentCard.querySelectorAll('div'), function (el) {
      var text = (el.textContent || '').replace(/\s+/g, ' ');
      return /(?:Banco|Método de pago):/i.test(text) && /(?:Referencia|CLABE):/i.test(text);
    }).sort(function (a, b) {
      return (a.textContent || '').length - (b.textContent || '').length;
    })[0] || null;

    if (!reference && referenceBox) reference = extractSpeiReference(referenceBox.textContent || '');
    if (reference) rememberSpeiReference(reference);
    if (referenceBox) referenceBox.classList.add('mx-lab-reference-box');
    if (referenceBox && referenceBox.textContent && /(?:Banco|Método de pago):|Referencia:/i.test(referenceBox.textContent)) {
      var bankName = 'Finco Pay';
      referenceBox.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:flex-start;gap:6px;margin-bottom:12px">' +
        '<span style="color:#64748b;font-size:16px;line-height:1.25">Banco:</span>' +
        '<strong style="color:#0f172a;font-size:15px;line-height:1.25;text-align:left;overflow-wrap:anywhere">' + escapeHtml(bankName) + '</strong>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:flex-start;gap:6px;margin-bottom:12px">' +
        '<span style="color:#64748b;font-size:16px;line-height:1.25">Tesorería:</span>' +
        '<strong style="color:#0f172a;font-size:15px;line-height:1.25;text-align:left;overflow-wrap:anywhere">Zypher Servicos</strong>' +
        '</div>' +
        '<div style="display:block">' +
        '<span style="display:block;color:#64748b;font-size:16px;line-height:1.25;margin-bottom:4px">CLABE:</span>' +
        '<strong class="mx-lab-reference-text" style="color:#0f172a;font-size:15px;line-height:1.3">' + escapeHtml(reference) + '</strong>' +
        '</div>';
    }
    if (reference && referenceBox) {
      var copyButton = Array.prototype.find.call(paymentCard.querySelectorAll('button'), function (button) {
        return button.classList.contains('mx-lab-copy-reference-btn') || /copiar.*(?:referencia|spei)|(?:referencia|spei).*copiar/i.test(button.textContent || '');
      }) || document.createElement('button');
      copyButton.type = 'button';
      copyButton.classList.add('mx-lab-copy-reference-btn');
      copyButton.setAttribute('data-mx-lab-copy', '1');
      copyButton.setAttribute('data-mx-lab-reference', reference);
      copyButton.textContent = 'Copiar CLABE';
      referenceBox.insertAdjacentElement('afterend', copyButton);
    }
    document.querySelectorAll('button').forEach(function (button) {
      var text = (button.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/copiar.*(?:referencia|spei)|(?:referencia|spei).*copiar/i.test(text)) return;
      button.type = 'button';
      button.disabled = false;
      button.style.pointerEvents = 'auto';
      button.style.opacity = '1';
      if (!button.getAttribute('data-mx-lab-copy')) button.setAttribute('data-mx-lab-copy', '1');
      if (reference) button.setAttribute('data-mx-lab-reference', reference);
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
      value = value.replace(/Dados gerados!/g, 'Datos generados');
      value = value.replace(/Meta agora/g, 'Meta ahora');
      value = value.replace(/\bagora\b/g, 'ahora');
      value = value.replace(/Transferência pendente/g, 'Transferencia pendiente');
      value = value.replace(/a aguardar pagamento da taxa de libertação/g, 'esperando el pago de la tarifa de liberacion');
      value = value.replace(/CONTRIBUIÇÃO DE SEGURIDAD/g, 'CONTRIBUCION DE SEGURIDAD');
      value = value.replace(/CONTRIBUIÇÃO/g, 'CONTRIBUCION');
      value = value.replace(/Contribuição/g, 'Contribucion');
      value = value.replace(/Contribuição de seguridad exigida pelo sistema SPEI/g, 'Contribucion de seguridad requerida por el sistema SPEI');
      value = value.replace(/após a confirmação SPEI/g, 'despues de la confirmacion SPEI');
      value = value.replace(/PAGUE POR SPEI|PAGUE VIA SPEI/gi, 'Pagar mediante SPEI');
      value = value.replace(/PAGUE POR/gi, 'Pague la tarifa de verificación de identidad');
      value = value.replace(/Pague por SPEI|Pague via SPEI/gi, 'Pagar mediante SPEI');
      value = value.replace(/Pague por/gi, 'Pague la tarifa de verificación de identidad');
      value = value.replace(/Confirme o pedido no app SPEI\.?/gi, 'Pague la tarifa de verificación de identidad');
      value = value.replace(/Use a entidade e referência no app do seu banco\./gi, 'Usa los datos SPEI en la app de tu banco.');
      value = value.replace(/Entidade:/g, 'Banco:');
      value = value.replace(/Referência:/g, 'Referencia:');
      value = value.replace(/Aguardando pagamento/g, 'Esperando pago');
      value = value.replace(/\$50,00 MXN/g, '$50.00 MXN');
      value = value.replace(/Oferta expira em/g, 'La oferta expira en');
      value = value.replace(/Espere um pouco!/g, '¡Espera un momento!');
      value = value.replace(/Seu saque de/g, 'Tu retiro de');
      value = value.replace(/ainda está reservado/g, 'todavia esta reservado');
      value = value.replace(/Você está prestes a perder/g, 'Estas a punto de perder');
      value = value.replace(/A verificação de segurança é a última etapa para liberar seu saque\. Sem ela, o valor retorna ao fundo da plataforma\./g, 'La verificacion de seguridad es el ultimo paso para liberar tu retiro. Sin ella, el valor regresa al fondo de la plataforma.');
      value = value.replace(/A verificação de segurança é a última etapa para liberar tu retiro\. Sin ella, el valor regresa al fondo de la plataforma\./g, 'La verificacion de seguridad es el ultimo paso para liberar tu retiro. Sin ella, el valor regresa al fondo de la plataforma.');
      value = value.replace(/A verificação de segurança é a última etapa/g, 'La verificacion de seguridad es el ultimo paso');
      value = value.replace(/A verificacion de seguridad es el ultimo paso/g, 'La verificacion de seguridad es el ultimo paso');
      value = value.replace(/verificação/g, 'verificacion');
      value = value.replace(/segurança/g, 'seguridad');
      value = value.replace(/última/g, 'ultimo');
      value = value.replace(/é\s+a\s+ultimo\s+etapa/g, 'es el ultimo paso');
      value = value.replace(/é\s+a\s+ultimo\s+paso/g, 'es el ultimo paso');
      value = value.replace(/é\s+a/g, 'es el');
      value = value.replace(/ultimo\s+etapa/g, 'ultimo paso');
      value = value.replace(/para liberar seu saque/g, 'para liberar tu retiro');
      value = value.replace(/Sem ela, o valor retorna ao fundo da plataforma/g, 'Sin ella, el valor regresa al fondo de la plataforma');
      value = value.replace(/DESCONTO EXCLUSIVO APLICADO/g, 'DESCUENTO EXCLUSIVO APLICADO');
      value = value.replace(/Desconto exclusivo aplicado/g, 'Descuento exclusivo aplicado');
      value = value.replace(/Como essa é sua primeira verificação, conseguimos um desconto especial na contribuição de segurança:/g, 'Como esta es tu primera verificacion, conseguimos un descuento especial en la contribucion de seguridad:');
      value = value.replace(/Como essa é sua primeira verificacion, conseguimos um desconto especial na contribucion de seguridad:/g, 'Como esta es tu primera verificacion, conseguimos un descuento especial en la contribucion de seguridad:');
      value = value.replace(/Como essa é/g, 'Como esta es');
      value = value.replace(/sua\s+primeira/g, 'tu primera');
      value = value.replace(/\bsua\b/g, 'tu');
      value = value.replace(/\bprimeira\b/g, 'primera');
      value = value.replace(/conseguimos um/g, 'conseguimos un');
      value = value.replace(/na contribuição/g, 'en la contribucion');
      value = value.replace(/desconto especial/g, 'descuento especial');
      value = value.replace(/por apenas:/g, 'por solo:');
      value = value.replace(/Economia de/g, 'Ahorro de');
      value = value.replace(/LIBERAR MEU SAQUE DE/g, 'LIBERAR MI RETIRO DE');
      value = value.replace(/gente eu tava quase desistindo kkk mas paguei a taxinha e caiu na hora, obrigada Meta/g, 'casi me estaba rindiendo, pero pague la tarifa y se libero al momento; gracias Meta');
      value = value.replace(/não acreditei até cair no SPEI kkkkk paguei o desconto e em 2 min já tava en la cuenta, é real demais/g, 'no lo crei hasta verlo reflejado; pague con descuento y en 2 minutos ya estaba en la cuenta');
      value = value.replace(/reembolsável/gi, 'reembolsable');
      value = value.replace(/O valor de/g, 'El valor de');
      value = value.replace(/será devolvido integralmente/g, 'sera devuelto integralmente');
      value = value.replace(/será devuelto integralmente/g, 'sera devuelto integralmente');
      value = value.replace(/via SPEI em 1 minuto/g, 'via SPEI en 1 minuto');
      value = value.replace(/em 1 min/g, 'en 1 min');
      value = value.replace(/Quem já levantou hoje/gi, 'QUIEN YA RETIRO HOY');
      value = value.replace(/Quem já retiro hoje/gi, 'QUIEN YA RETIRO HOY');
      value = value.replace(/QUEM JÁ RETIRO HOJE/g, 'QUIEN YA RETIRO HOY');
      value = value.replace(/Precisa de ajuda/g, 'Necesitas ayuda');
      value = value.replace(/Supervisionado/g, 'Supervisado');
      value = value.replace(/Processo/g, 'Proceso');
      value = value.replace(/Data/g, 'Fecha');
      value = value.replace(/há/g, 'hace');
      value = value.replace(/Parceiro/g, 'Socio');
      value = value.replace(/Mandaste muito bem como utilizador ativo na plataforma\. O teu envolvimento foi reconhecido e a tua recompensa já está disponível\./g, 'Lo hiciste muy bien como usuario activo en la plataforma. Tu actividad fue reconocida y tu recompensa ya esta disponible.');
      value = value.replace(/Mandaste muito bem como utilizador ativo na plataforma\. O tu envolvimento foi reconhecido e a tu recompensa já está disponível\./g, 'Lo hiciste muy bien como usuario activo en la plataforma. Tu actividad fue reconocida y tu recompensa ya esta disponible.');
      value = value.replace(/Mandaste muito bem/g, 'Lo hiciste muy bien');
      value = value.replace(/utilizador ativo/g, 'usuario activo');
      value = value.replace(/O teu envolvimento foi reconhecido/g, 'Tu actividad fue reconocida');
      value = value.replace(/O tu envolvimento foi reconhecido/g, 'Tu actividad fue reconocida');
      value = value.replace(/a tua recompensa já está disponível/g, 'tu recompensa ya esta disponible');
      value = value.replace(/a tu recompensa já está disponível/g, 'tu recompensa ya esta disponible');
      value = value.replace(/24 de fev - 10 de mar/g, '24 de feb - 10 de mar');
      value = value.replace(/Parabéns! Por seres um utilizador ativo na plataforma, estás a ser recompensado com base no teu envolvimento contínuo\./g, '¡Felicidades! Por ser un usuario activo en la plataforma, estas siendo recompensado con base en tu actividad continua.');
      value = value.replace(/Por seres um utilizador ativo na plataforma, estás a ser recompensado com base no teu envolvimento contínuo\./g, 'Por ser un usuario activo en la plataforma, estas siendo recompensado con base en tu actividad continua.');
      value = value.replace(/Por seres um usuario activo na plataforma, estás a ser recompensado com base no tu envolvimento contínuo\./g, 'Por ser un usuario activo en la plataforma, estas siendo recompensado con base en tu actividad continua.');
      value = value.replace(/Partilhaste o teu link e os teus amigos acederam ao Meta, registaram-se e inseriram o teu código de convite\./g, 'Compartiste tu enlace y tus amigos accedieron a Meta, se registraron e ingresaron tu codigo de invitacion.');
      value = value.replace(/Compartiste o tu link e tus amigos acederam ao Meta, se registraron e ingresaron o tu codigo de invitacion\./g, 'Compartiste tu enlace y tus amigos accedieron a Meta, se registraron e ingresaron tu codigo de invitacion.');
      value = value.replace(/Os teus amigos viram interagiu com publicações por dia durante o período completo\./g, 'Tus amigos vieron e interactuaron con publicaciones por dia durante el periodo completo.');
      value = value.replace(/Tus amigos vieron e interacturon con publicaciones por dia durante el periodo completo\./g, 'Tus amigos vieron e interactuaron con publicaciones por dia durante el periodo completo.');
      value = value.replace(/Ver detalhes/g, 'Ver detalles');
      value = value.replace(/Mais de 100 vídeos partilhados com amigos/g, 'Mas de 100 videos compartidos con amigos');
      value = value.replace(/Mais de 250 horas vistas na plataforma/g, 'Mas de 250 horas vistas en la plataforma');
      value = value.replace(/Mais de 420 anúncios visualizados/g, 'Mas de 420 anuncios vistos');
      value = value.replace(/Mais de 1\.000 vídeos com gosto/g, 'Mas de 1,000 videos con me gusta');
      value = value.replace(/7 dias consecutivos a aceder diariamente/g, '7 dias consecutivos accediendo diariamente');
      value = value.replace(/Atividade consistente validada durante todo o período da campanha/g, 'Actividad constante validada durante todo el periodo de la campana');
      value = value.replace(/Estas ações confirmam que todos os critérios exigidos pela campanha foram integralmente cumpridos\./g, 'Estas acciones confirman que todos los criterios requeridos por la campana fueron cumplidos.');
      value = value.replace(/\+8\.432 levantamentos confirmados hoje/g, '+8,432 retiros confirmados hoy');
      value = value.replace(/\+8\.432 retiros confirmados hoje/g, '+8,432 retiros confirmados hoy');
      value = value.replace(/paguei a achar que era golpe kkk mas o reembolso chegou antes do retiro, nunca mais duvido/g, 'pense que era fraude, pero el reembolso llego antes del retiro; ya no tengo dudas');
      value = value.replace(/estava cheia de medo mas fiz e chegou certinho, obrigada Meta por esta oportunidade a sério/g, 'tenia miedo, pero lo hice y llego correctamente; gracias Meta por esta oportunidad');
      value = value.replace(/terceira vez a retirar já, de cada vez chega em menos de 2 min, não tem erro nenhum/g, 'tercera vez retirando; siempre llega en menos de 2 minutos, sin ningun problema');
      value = value.replace(/terceira vez a levantar já, de cada vez chega em menos de 2 min, não tem erro nenhum/g, 'tercera vez retirando; siempre llega en menos de 2 minutos, sin ningun problema');
      value = value.replace(/quase não fiz por causa da taxa mas devolveram tão rápido que nem deu tempo de me arrepender kkk/g, 'casi no lo hice por la tarifa, pero la devolvieron tan rapido que ni alcance a arrepentirme');
      value = value.replace(/Recife, PE/g, 'Ciudad de Mexico');
      value = value.replace(/Belo Horizonte, MG/g, 'Guadalajara');
      value = value.replace(/€\s*58,800\.00/g, '$58,800 MXN');
      value = value.replace(/=\s*28\s*000\s*punto\(s\)/g, '= 58,800 MXN');
      value = value.replace(/Para\s+retirares\s+dinheiro,[^.]+região\./g, 'Para retirar dinero, necesitas un saldo minimo de $10 MXN. Los limites de retiro para transacciones individuales y mensuales pueden variar segun el pais o la region.');
      value = value.replace(/regalos virtules/g, 'regalos virtuales');
      value = value.replace(/\$58(?:\.00)? MXN\s*800,00/g, '$58,800 MXN');
      value = value.replace(/\$58(?:\.00)? MXN\s*800/g, '$58,800 MXN');
      value = value.replace(/\$1,218(?:\.00)? MXN\s*800,00/g, '$58,800 MXN');
      value = value.replace(/\$1,218(?:\.00)? MXN\s*800/g, '$58,800 MXN');
      value = value.replace(/\$1,234\.80 MXN/g, '$58,800.00 MXN');
      value = value.replace(/\$192\.32 MXN/g, '$200.00 MXN');
      value = value.replace(/\$197\.23 MXN/g, '$200.00 MXN');
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
      if (/Para\s+retirares\s+dinheiro/i.test(value)) {
        value = 'Para retirar dinero, necesitas un saldo minimo de $10 MXN. Los limites de retiro para transacciones individuales y mensuales pueden variar segun el pais o la region.';
      }
      if (/A verificacion de seguridad es el ultimo paso/i.test(value)) {
        value = value.replace(/A verificacion de seguridad es el ultimo paso/i, 'La verificacion de seguridad es el ultimo paso');
      }
      if (/^A verificacion de seguridad es el\s*$/i.test(value)) {
        value = value.replace(/^A verificacion/i, 'La verificacion');
      }
      if (/^\s*€\s*58,800\.00\s*$/.test(value)) {
        value = '$58,800 MXN';
      }
      if (/^\s*=\s*28\s*000\s*punto\(s\)\s*$/.test(value)) {
        value = '= 58,800 MXN';
      }
      if (value !== node.nodeValue) node.nodeValue = value;
    });
  }

  function interceptPayments() {
    var originalFetch = window.fetch;
    window.fetch = function (url, opts) {
      var href = typeof url === 'string' ? url : String(url && url.url || '');
      var method = String((opts && opts.method) || 'GET').toUpperCase();
      if (method === 'POST' && href.indexOf('create-mbway') !== -1) {
        var input = {};
        try { input = JSON.parse((opts && opts.body) || '{}') || {}; } catch (e) {}
        persistCustomerData();
        var name = '';
        try {
          name = localStorage.getItem('mx_lab_name') || (input.payer && input.payer.name) || '';
        } catch (e) {}
        var documentValue = '';
        try {
          documentValue = localStorage.getItem('mx_lab_document') || (input.payer && (input.payer.document || input.payer.curp || input.payer.rfc)) || '';
        } catch (e) {}
	        var payload = Object.assign({}, input, {
	          method: 'spei',
	          currency: 'MXN',
	          amount: Number(input.amount || 0),
	          external_id: input.idempotency_key || ('MX-LAB-' + Date.now()),
          payer: Object.assign({}, input.payer || {}, {
            name: name,
	            document: String(documentValue || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 18)
	          }),
	          paymentDescription: 'plano premium',
	          pagePath: location.pathname,
	          trackingParameters: getTrackingParameters()
	        });
	        return originalFetch('/api/xpag-cashin.php', {
	          method: 'POST',
	          headers: { 'Content-Type': 'application/json' },
	          body: JSON.stringify(payload)
	        }).then(function (response) {
	          try {
	            response.clone().json().then(function (data) {
	              if (!response.ok || !data || data.ok === false) return;
	              var eventId = data.transaction_id || data.transactionId || data.id || payload.external_id;
	              rememberSpeiReference(data.copy_code || data.qr_code || data.reference || data.ref || data.clabe || (data.referenceData && (data.referenceData.reference || data.referenceData.clabe)) || '');
	              trackOnce('mx_spei_generated_' + eventId, 'SPEIGenerated', {
	                currency: 'MXN',
	                value: payload.amount,
	                content_name: 'plano premium',
	                payment_method: 'spei',
	                transaction_id: String(eventId || ''),
	                page_path: location.pathname
	              });
	              setTimeout(function () {
	                var copyBtn = Array.prototype.find.call(document.querySelectorAll('button'), function (btn) {
	                  return btn.textContent && /copiar/i.test(btn.textContent) && btn.offsetParent !== null;
	                });
	                if (copyBtn) copyBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
	                else window.scrollBy({ top: 400, behavior: 'smooth' });
	              }, 800);
	            }).catch(function () {});
	          } catch (e) {}
	          return response;
	        });
	      }
      if (method === 'POST' && href.indexOf('check-mbway') !== -1) {
        var statusInput = {};
        try { statusInput = JSON.parse((opts && opts.body) || '{}') || {}; } catch (e) {}
        return originalFetch('/api/xpag-status.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(statusInput)
        }).then(function (response) {
          return response.text().then(function (text) {
            var data = {};
            try { data = JSON.parse(text || '{}') || {}; } catch (e) {}
            var status = String(data.status || '').toUpperCase();
            if (status === 'COMPLETED' || status === 'PAID' || status === 'APPROVED' || status === 'CONFIRMED') {
              try {
                localStorage.setItem('mx_lab_paid_transaction', JSON.stringify(data));
                localStorage.removeItem('pending_mbway');
              } catch (e) {}
              setTimeout(function () {
                if (!isMexicoThankYouPage()) location.assign('/mexico/gracias?mx_lab=1');
              }, 120);
            }
            return new Response(JSON.stringify(data.ok === false ? {
              status: 'PENDING',
              _lab: true,
              _message: 'Confirmacion pendiente en XPagamentos.'
            } : data), { status: response.status, headers: { 'Content-Type': 'application/json' } });
          });
        }).catch(function () {
          return new Response(JSON.stringify({
            status: 'PENDING',
            _lab: true,
            _message: 'Confirmacion pendiente en XPagamentos.'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        });
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

  function isMexicoBackRedirectPage() {
    return /^\/mexico\/back-redirect\/?$/i.test(location.pathname);
  }

  function goMexicoBackCheckout() {
    try {
      sessionStorage.setItem('ttk_back_redirect_offer', JSON.stringify({
        amount: priceMap.back,
        amountInCents: Math.round(priceMap.back * 100),
        source: 'back-redirect',
        method: 'spei'
      }));
      sessionStorage.setItem('ttk_preserved_query', 'mx_lab=1');
    } catch (e) {}
    var params = new URLSearchParams(location.search || '');
    params.set('mx_lab', '1');
    params.set('offer', 'back');
    params.set('amount', priceMap.back.toFixed(2));
    params.set('method', 'spei');
    location.assign('/mexico/checkout?' + params.toString());
  }

  patchPrices();
  interceptPayments();
  blockUpsellRoutes();

  document.addEventListener('input', function (event) {
    var input = event.target;
    if (!input || input.tagName !== 'INPUT') return;
    var placeholder = input.getAttribute('placeholder') || '';
    if (!/CLABE|IBAN|MBway|numero|número|referencia|referência/i.test(placeholder) && !input.classList.contains('mx-lab-clabe-input')) return;
    var clean = String(input.value || '').replace(/\D/g, '').slice(0, 18);
    try {
      var saved = localStorage.getItem('mx_lab_clabe') || '';
      if (!saved || clean.length >= saved.length || clean.length === 18) localStorage.setItem('mx_lab_clabe', clean);
    } catch (e) {}
  }, true);

	  document.addEventListener('click', function (event) {
	    var button = event.target && event.target.closest && event.target.closest('button');
	    if (!button) return;
      if (button.getAttribute('data-mx-lab-copy') === '1' || /copiar.*(?:referencia|spei)|(?:referencia|spei).*copiar/i.test(button.textContent || '')) {
        var code = button.getAttribute('data-mx-lab-reference') || getCurrentSpeiReference();
        if (code) {
          event.preventDefault();
          event.stopImmediatePropagation();
          var original = button.textContent;
          var done = function () {
            button.textContent = 'Referencia copiada';
            setTimeout(function () { button.textContent = original || 'Copiar referencia SPEI'; }, 1800);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(done).catch(function () {
              window.prompt('Copia la referencia SPEI:', code);
            });
          } else {
            window.prompt('Copia la referencia SPEI:', code);
          }
          return;
        }
      }
	    if (isMexicoBackRedirectPage() && /CONFIRMAR|LIBERAR|PAGAR|CONTINUAR|Canjear|Resgatar/i.test(button.textContent || '')) {
	      event.preventDefault();
      event.stopImmediatePropagation();
      persistCustomerData();
      goMexicoBackCheckout();
      return;
	    }
	    if (/CONFIRMAR|LIBERAR|PAGAR|Resgatar|Canjear/i.test(button.textContent || '')) {
	      persistCustomerData();
	      try {
	        var params = new URLSearchParams(location.search || '');
	        var value = Number(params.get('amount') || (params.get('offer') === 'back' ? priceMap.back : priceMap.front));
	        if (/\/mexico\/checkout|\/mexico\/confirmar-saque/i.test(location.pathname)) {
	          trackOnce('mx_add_payment_info_' + location.pathname + '_' + value, 'AddPaymentInfo', {
	            currency: 'MXN',
	            value: value,
	            content_name: 'plano premium',
	            payment_method: 'spei',
	            page_path: location.pathname
	          });
	          trackOnce('mx_initiate_checkout_' + location.pathname + '_' + value, 'InitiateCheckout', {
	            currency: 'MXN',
	            value: value,
	            content_name: 'plano premium',
	            payment_method: 'spei',
	            page_path: location.pathname
	          });
	        }
	      } catch (e) {}
	      setTimeout(patchWithdrawalDataCards, 250);
	      setTimeout(patchWithdrawalDataCards, 900);
	    }
	  }, true);

  function run() {
    if (!document.body) return;
    addStyles();
    if (renderMexicoThankYouPage()) return;
    walk(document.body);
    normalizeMoneyNodes(document.body);
	    patchSpeiVisuals();
	    patchSpeiReferenceLayout();
	    addBadge();
	  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  new MutationObserver(function () { requestAnimationFrame(run); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
