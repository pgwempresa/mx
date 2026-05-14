<?php

require_once 'utils.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    readfile(__DIR__ . '/../index.html');
    exit;
}

$data = read_json_input();

if (isset($data['transaction_id']) && !isset($data['id'])) {
    $data['id'] = $data['transaction_id'];
}

if (empty($data['id'])) {
    json_response(['error' => 'transaction id is required'], 400);
}

$cached = kv_get_json('tx:' . $data['id']);

if (is_array($cached) && !empty($cached['status'])) {
    $cached['status'] = normalize_waymb_status($cached['status']);

    if (is_final_waymb_status($cached['status'])) {
        json_response($cached, 200);
    }
}

$result = vorkpay_request('GET', '/payments/status', ['transactionId' => $data['id']], 15);

if (!$result['ok']) {
    json_response(['error' => 'Gateway error: ' . $result['error']], 502);
}

$payload = json_decode($result['body'], true);

if (!is_array($payload)) {
    json_response([
        'error' => 'Resposta inválida da VorkPay.',
        'raw' => $result['body']
    ], 502);
}

if ($result['status'] < 200 || $result['status'] >= 300) {
    json_response([
        'error' => $payload['error'] ?? 'VorkPay recusou a consulta da transação.',
        'gateway_status' => $result['status'],
        'gateway_response' => $payload
    ], $result['status']);
}

$existing = kv_get_json('tx:' . $data['id']);
$payload = normalize_vorkpay_transaction($payload, is_array($existing) ? $existing : ['id' => $data['id']]);
$payload['_gateway'] = 'vorkpay';
$payload['_verified_by_gateway'] = true;
$payload['_gateway_checked_at'] = gmdate('c');

if (is_array($existing)) {
    foreach (['payer', 'trackingParameters', 'pagePath', 'amount', 'method', '_fingerprint', 'paymentDescription'] as $key) {
        if (empty($payload[$key]) && !empty($existing[$key])) {
            $payload[$key] = $existing[$key];
        }
    }
}

persist_transaction_snapshot($payload);
if (!empty($payload['_fingerprint'])) {
    kv_set_json('txfinger:' . $payload['_fingerprint'], $payload);
}
$payload['_utmify_status'] = send_utmify_order($payload);
json_response($payload, 200);
