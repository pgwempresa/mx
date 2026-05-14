<?php

function env_first(array $keys, $default = '') {
    foreach ($keys as $key) {
        $value = getenv($key);

        if ($value !== false && $value !== '') {
            return $value;
        }
    }

    return $default;
}

$kvUrl = env_first([
    'KV_REST_API_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_KV_REST_API_URL'
]);

$kvToken = env_first([
    'KV_REST_API_TOKEN',
    'UPSTASH_REDIS_REST_TOKEN',
    'UPSTASH_KV_REST_API_TOKEN'
]);


function read_json_input() {
    $input = file_get_contents('php://input');
    $data = json_decode($input ?: '', true);

    return is_array($data) ? $data : [];
}

function json_response($payload, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function get_request_origin() {
    $proto = 'https';

    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
        $proto = explode(',', $_SERVER['HTTP_X_FORWARDED_PROTO'])[0];
    } elseif (!empty($_SERVER['REQUEST_SCHEME'])) {
        $proto = $_SERVER['REQUEST_SCHEME'];
    } elseif (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        $proto = 'https';
    }

    $host = $_SERVER['HTTP_X_FORWARDED_HOST'] ?? ($_SERVER['HTTP_HOST'] ?? '');

    return $host ? ($proto . '://' . $host) : '';
}

function normalize_waymb_status($status) {
    $normalized = strtoupper(trim((string) $status));

    if ($normalized === 'PAID' || $normalized === 'APPROVED' || $normalized === 'SUCCESS') {
        return 'COMPLETED';
    }

    if ($normalized === 'CANCELLED') {
        return 'CANCELLED';
    }

    if ($normalized === '') {
        return 'PENDING';
    }

    return $normalized;
}

function is_final_waymb_status($status) {
    return in_array(normalize_waymb_status($status), ['COMPLETED', 'DECLINED', 'CANCELED', 'CANCELLED', 'FAILED', 'REFUSED', 'EXPIRED'], true);
}

function build_transaction_fingerprint(array $data) {
    $payer = isset($data['payer']) && is_array($data['payer']) ? $data['payer'] : [];
    $method = strtolower((string) ($data['method'] ?? 'mbway'));
    $amount = isset($data['amount']) ? number_format((float) $data['amount'], 2, '.', '') : '0.00';
    $pagePath = preg_replace('/\?.*/', '', (string) ($data['pagePath'] ?? ''));
    $identity = $method === 'multibanco'
        ? ($payer['name'] ?? ($payer['iban'] ?? ($payer['ibanKey'] ?? ($payer['chaveIban'] ?? ''))))
        : ($payer['phone'] ?? ($payer['number'] ?? ($payer['MBWAYKey'] ?? '')));
    $identity = preg_replace('/\s+/', '', strtolower((string) $identity));

    return hash('sha256', implode('|', [$method, $amount, $pagePath, $identity]));
}

function is_reusable_pending_transaction($payload) {
    if (!is_array($payload) || !get_transaction_id($payload)) {
        return false;
    }

    $status = normalize_waymb_status($payload['status'] ?? 'PENDING');

    if (is_final_waymb_status($status)) {
        return false;
    }

    $createdAtRaw = (string) ($payload['_created_at'] ?? ($payload['createdAt'] ?? ($payload['created_at'] ?? '')));
    $createdAt = $createdAtRaw !== '' ? strtotime($createdAtRaw) : false;

    return !$createdAt || $createdAt >= time() - 3600;
}

function normalize_waymb_create_payload(array $data) {
    $origin = get_request_origin();

    $payer = isset($data['payer']) && is_array($data['payer']) ? $data['payer'] : [];
    $amountRaw = $data['amount'] ?? null;

    if ($amountRaw === null || $amountRaw === '' || !is_numeric($amountRaw)) {
        json_response([
            'error' => 'Valor do pagamento ausente ou inválido.',
            'missing_fields' => ['amount']
        ], 422);
    }

    $amount = round((float) $amountRaw, 2);

    if ($amount <= 0) {
        json_response([
            'error' => 'Valor do pagamento precisa ser maior que zero.',
            'invalid_fields' => ['amount']
        ], 422);
    }

    $description = isset($data['paymentDescription']) ? (string) $data['paymentDescription'] : 'Transaction Payment';

    $data['amount'] = $amount;
    $data['method'] = strtolower((string) ($data['method'] ?? 'mbway'));
    $data['currency'] = $data['currency'] ?? 'EUR';
    $data['paymentDescription'] = function_exists('mb_substr')
        ? mb_substr($description, 0, 50)
        : substr($description, 0, 50);

    $payer['email'] = trim((string) ($payer['email'] ?? ''));
    $payer['name'] = trim((string) ($payer['name'] ?? ''));
    $payer['document'] = preg_replace('/\D+/', '', (string) ($payer['document'] ?? ''));
    $payer['phone'] = preg_replace('/\D+/', '', (string) ($payer['phone'] ?? ($payer['number'] ?? '')));
    $payer['iban'] = strtoupper(preg_replace('/\s+/', '', (string) ($payer['iban'] ?? ($payer['ibanKey'] ?? ($payer['chaveIban'] ?? '')))));
    $payer['ibanKey'] = $payer['iban'];
    if ($data['method'] === 'multibanco') { $data['iban'] = $payer['iban']; $data['ibanKey'] = $payer['iban']; }

    $missing = [];
    $method = strtolower((string) $data['method']);

    if ($payer['name'] === '' || strlen($payer['name']) < 3) {
        $missing[] = 'name';
    }

    if ($payer['email'] !== '' && !filter_var($payer['email'], FILTER_VALIDATE_EMAIL)) {
        $missing[] = 'email';
    }

    if ($method === 'multibanco') {
        // VorkPay Multibanco gera entidade/referência; não precisa de IBAN do cliente.
    } elseif ($payer['phone'] === '' || strlen($payer['phone']) < 9) {
        $missing[] = 'phone';
    }

    if (!empty($missing)) {
        json_response([
            'error' => $method === 'multibanco'
                ? 'Dados do pagador incompletos para gerar Multibanco.'
                : 'Dados do pagador incompletos para gerar MB WAY.',
            'missing_fields' => $missing
        ], 422);
    }

    $data['payer'] = $payer;
    $data['trackingParameters'] = normalize_tracking_parameters($data['trackingParameters'] ?? []);
    $data['pagePath'] = isset($data['pagePath']) ? (string) $data['pagePath'] : '';

    if (empty($data['callbackUrl']) && $origin) {
        $data['callbackUrl'] = $origin . '/api/waymb-webhook.php';
    }

    if (empty($data['success_url']) && $origin) {
        $data['success_url'] = $origin . '/up1/';
    }

    if (empty($data['failed_url']) && $origin) {
        $data['failed_url'] = $origin . '/back-redirect/';
    }

    return $data;
}


function get_vorkpay_secret() {
    return env_first(['VORKPAY_SECRET', 'VORKPAY_API_KEY', 'VORKPAY_TOKEN'], '');
}

function get_vorkpay_base_url() {
    return rtrim(env_first(['VORKPAY_BASE_URL'], 'https://vorkpay.com/api/v1'), '/');
}

function vorkpay_request($method, $path, array $payload = [], $timeout = 20) {
    $secret = get_vorkpay_secret();

    if ($secret === '') {
        return [
            'ok' => false,
            'status' => 500,
            'body' => '',
            'error' => 'VORKPAY_SECRET não configurado na Vercel.'
        ];
    }

    $method = strtoupper($method);
    $url = get_vorkpay_base_url() . $path;

    if ($method === 'GET' && !empty($payload)) {
        $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query($payload);
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $secret,
        'Content-Type: application/json',
        'User-Agent: pt-main/1.0'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);

    if ($method !== 'GET') {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    return [
        'ok' => $response !== false && $curlError === '',
        'status' => $httpCode ?: 502,
        'body' => $response,
        'error' => $curlError
    ];
}

function get_vorkpay_transaction_id(array $payload) {
    return $payload['transactionId'] ?? ($payload['transaction_id'] ?? ($payload['id'] ?? null));
}

function normalize_vorkpay_transaction(array $payload, array $fallback = []) {
    $txId = get_vorkpay_transaction_id($payload) ?: get_transaction_id($fallback);

    if ($txId) {
        $payload['id'] = $payload['id'] ?? $txId;
        $payload['transaction_id'] = $payload['transaction_id'] ?? $txId;
        $payload['transactionId'] = $payload['transactionId'] ?? $txId;
    }

    $payload['status'] = normalize_waymb_status($payload['status'] ?? ($fallback['status'] ?? 'PENDING'));
    $payload['amount'] = $payload['amount'] ?? ($fallback['amount'] ?? null);
    $payload['currency'] = $payload['currency'] ?? ($fallback['currency'] ?? 'EUR');

    $paymentMethod = strtoupper((string) ($payload['paymentMethod'] ?? ($fallback['paymentMethod'] ?? '')));
    if ($paymentMethod === 'REFERENCE') {
        $payload['method'] = 'multibanco';
    } elseif ($paymentMethod === 'MBWAY') {
        $payload['method'] = 'mbway';
    } elseif (empty($payload['method']) && !empty($fallback['method'])) {
        $payload['method'] = $fallback['method'];
    }

    if (!empty($payload['mb']) && is_array($payload['mb'])) {
        $payload['referenceData'] = [
            'entity' => $payload['mb']['entity'] ?? null,
            'reference' => $payload['mb']['reference'] ?? null,
            'expiresAt' => $payload['mb']['expiresAt'] ?? null
        ];
        $payload['entity'] = $payload['referenceData']['entity'];
        $payload['reference'] = $payload['referenceData']['reference'];
        $payload['expiresAt'] = $payload['referenceData']['expiresAt'];
    }

    return $payload;
}

function kv_get_json($key) {
    global $kvUrl, $kvToken;

    if (!$kvUrl || !$kvToken) {
        return null;
    }

    $ch = curl_init(rtrim($kvUrl, '/') . '/get/' . rawurlencode($key));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $kvToken
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);

    $response = curl_exec($ch);
    curl_close($ch);

    if (!$response) {
        return null;
    }

    $decoded = json_decode($response, true);

    if (!isset($decoded['result']) || $decoded['result'] === null) {
        return null;
    }

    $result = json_decode($decoded['result'], true);

    return is_array($result) ? $result : null;
}

function kv_set_json($key, array $value) {
    global $kvUrl, $kvToken;

    if (!$kvUrl || !$kvToken) {
        return false;
    }

    $ch = curl_init(rtrim($kvUrl, '/') . '/set/' . rawurlencode($key));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $kvToken
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);

    $response = curl_exec($ch);
    curl_close($ch);

    return $response !== false;
}

function normalize_tracking_parameters($tracking) {
    $keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 'fbclid', 'fbp', 'fbc'];
    $result = [];

    if (!is_array($tracking)) {
        $tracking = [];
    }

    foreach ($keys as $key) {
        $value = $tracking[$key] ?? null;
        $result[$key] = $value === null || $value === '' ? null : (string) $value;
    }

    return $result;
}

function get_utmify_token() {
    $token = env_first(['UTMIFY_API_TOKEN', 'UTMIFY_TOKEN'], '');

    if ($token !== '') {
        return $token;
    }

    $stored = kv_get_json('utmify_credentials');

    return is_array($stored) && !empty($stored['api_token']) ? (string) $stored['api_token'] : '';
}

function get_transaction_id(array $payload) {
    return $payload['id'] ?? $payload['transactionID'] ?? $payload['transactionId'] ?? $payload['transaction_id'] ?? null;
}

function get_utmify_status(array $payload) {
    $status = normalize_waymb_status($payload['status'] ?? 'PENDING');

    if ($status === 'COMPLETED') {
        return 'paid';
    }

    if (in_array($status, ['DECLINED', 'CANCELED', 'CANCELLED', 'FAILED'], true)) {
        return 'refused';
    }

    return 'waiting_payment';
}

function get_utmify_product(array $payload) {
    $path = (string) ($payload['pagePath'] ?? '');
    $description = (string) ($payload['paymentDescription'] ?? 'Pagamento MB WAY');

    $map = [
        '/confirmar-saque' => ['front', 'Ticket inicial'],
        '/back-redirect' => ['back_redirect', 'Back redirect'],
        '/up1' => ['up1', 'Upsell 1'],
        '/upsell-1' => ['up1', 'Upsell 1'],
        '/up2' => ['up2', 'Upsell 2'],
        '/upsell-2' => ['up2', 'Upsell 2'],
        '/up3' => ['up3', 'Upsell 3'],
        '/upsell-3' => ['up3', 'Upsell 3'],
        '/up4' => ['up4', 'Upsell 4'],
        '/upsell-4' => ['up4', 'Upsell 4'],
        '/up5' => ['upsell-5', 'Upsell 5'],
        '/upsell-5' => ['upsell-5', 'Upsell 5']
    ];

    foreach ($map as $needle => $product) {
        if ($path !== '' && strpos($path, $needle) === 0) {
            return $product;
        }
    }

    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $description));
    $slug = trim($slug ?: 'mbway', '-');

    return [$slug, $description ?: 'Pagamento MB WAY'];
}

function build_utmify_order_payload(array $payload) {
    $txId = get_transaction_id($payload);

    if (!$txId) {
        return null;
    }

    $payer = isset($payload['payer']) && is_array($payload['payer']) ? $payload['payer'] : [];
    $amount = isset($payload['amount']) ? (float) $payload['amount'] : 0.0;
    $priceInCents = max(0, (int) round($amount * 100));
    [$productId, $productName] = get_utmify_product($payload);
    $status = get_utmify_status($payload);
    $now = gmdate('c', time() - 300);
    $createdAt = (string) ($payload['createdAt'] ?? $payload['created_at'] ?? $now);

    if (strtotime($createdAt) === false || strtotime($createdAt) > time() - 60) {
        $createdAt = $now;
    }

    return [
        'isTest' => env_first(['UTMIFY_IS_TEST'], 'false') === 'true',
        'status' => $status,
        'orderId' => (string) $txId,
        'customer' => [
            'name' => (string) ($payer['name'] ?? 'Cliente'),
            'email' => (string) ($payer['email'] ?? ''),
            'phone' => (string) ($payer['phone'] ?? ''),
            'country' => 'PT',
            'document' => preg_replace('/\D+/', '', (string) ($payer['document'] ?? ''))
        ],
        'platform' => 'VorkPay',
        'products' => [[
            'id' => $productId,
            'name' => $productName,
            'planId' => $productId,
            'planName' => $productName,
            'quantity' => 1,
            'priceInCents' => $priceInCents
        ]],
        'createdAt' => $createdAt,
        'commission' => [
            'gatewayFeeInCents' => 0,
            'totalPriceInCents' => $priceInCents,
            'userCommissionInCents' => $priceInCents,
            'currency' => 'EUR'
        ],
        'refundedAt' => null,
        'approvedDate' => $status === 'paid' ? (string) ($payload['approvedDate'] ?? $payload['paidAt'] ?? $payload['paid_at'] ?? $now) : null,
        'paymentMethod' => 'unknown',
        'trackingParameters' => normalize_tracking_parameters($payload['trackingParameters'] ?? [])
    ];
}

function send_utmify_order(array $payload) {
    $order = build_utmify_order_payload($payload);

    if (!$order) {
        return [
            'attempted' => false,
            'accepted' => false,
            'reason' => 'missing_order_data'
        ];
    }

    $token = get_utmify_token();

    if ($token === '') {
        return [
            'attempted' => false,
            'accepted' => false,
            'reason' => 'missing_token',
            'orderId' => $order['orderId'],
            'statusName' => $order['status']
        ];
    }

    $dedupeKey = 'utmify:' . $order['orderId'] . ':' . $order['status'];

    $previous = kv_get_json($dedupeKey);

    if (is_array($previous) && !empty($previous['ok'])) {
        return [
            'attempted' => false,
            'accepted' => true,
            'deduped' => true,
            'orderId' => $order['orderId'],
            'statusName' => $order['status'],
            'httpStatus' => $previous['status'] ?? null
        ];
    }

    $ch = curl_init('https://api.utmify.com.br/api-credentials/orders');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($order, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'x-api-token: ' . $token
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 12);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    $ok = $response !== false && $curlError === '' && $httpCode >= 200 && $httpCode < 300;

    $summary = [
        'ok' => $ok,
        'status' => $httpCode ?: 0,
        'sent_at' => gmdate('c'),
        'response' => is_string($response) ? substr($response, 0, 500) : '',
        'error' => $curlError
    ];

    kv_set_json($dedupeKey, $summary);
    kv_set_json('utmify:last', [
        'orderId' => $order['orderId'],
        'statusName' => $order['status'],
        'product' => $order['products'][0]['id'] ?? null,
        'amountInCents' => $order['commission']['totalPriceInCents'] ?? null,
        'ok' => $ok,
        'httpStatus' => $httpCode ?: 0,
        'sent_at' => $summary['sent_at'],
        'response' => $summary['response'],
        'error' => $curlError
    ]);

    return [
        'attempted' => true,
        'accepted' => $ok,
        'deduped' => false,
        'orderId' => $order['orderId'],
        'statusName' => $order['status'],
        'httpStatus' => $httpCode ?: 0,
        'response' => $summary['response'],
        'error' => $curlError
    ];
}

function persist_transaction_snapshot(array $payload) {
    $txId = get_transaction_id($payload);

    if (!$txId) {
        return;
    }

    if (isset($payload['status'])) {
        $payload['status'] = normalize_waymb_status($payload['status']);
    }

    kv_set_json('tx:' . $txId, $payload);
}
