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

$input = read_json_input();
$idempotencyKey = '';

if (!empty($input['idempotency_key'])) {
    $idempotencyKey = preg_replace('/[^a-zA-Z0-9:_-]/', '', (string) $input['idempotency_key']);
    $cached = kv_get_json('idem:' . $idempotencyKey);

    if (is_array($cached)) {
        $cached['idempotent_replay'] = true;
        json_response($cached, 200);
    }
}

$data = normalize_waymb_create_payload($input);
$fingerprint = build_transaction_fingerprint($data);
$fingerprintKey = 'txfinger:' . $fingerprint;
$cachedByFingerprint = kv_get_json($fingerprintKey);

if (is_reusable_pending_transaction($cachedByFingerprint)) {
    $cachedByFingerprint['idempotent_replay'] = true;
    $cachedByFingerprint['fingerprint_replay'] = true;
    json_response($cachedByFingerprint, 200);
}

$orderId = $idempotencyKey !== '' ? $idempotencyKey : ('order_' . substr($fingerprint, 0, 24));
$initPayload = [
    'orderId' => $orderId,
    'amount' => $data['amount'],
    'currency' => $data['currency'] ?? 'EUR'
];

$init = vorkpay_request('POST', '/payments/init', $initPayload, 30);

if (!$init['ok']) {
    json_response([
        'error' => 'Falha na comunicação com a VorkPay.',
        'details' => $init['error'],
        'method' => $data['method']
    ], 502);
}

$initBody = json_decode($init['body'], true);

if (!is_array($initBody)) {
    json_response([
        'error' => 'Resposta inválida da VorkPay ao iniciar transação.',
        'raw' => $init['body']
    ], 502);
}

if ($init['status'] < 200 || $init['status'] >= 300) {
    json_response([
        'error' => $initBody['error'] ?? 'VorkPay recusou a criação da transação.',
        'gateway_status' => $init['status'],
        'gateway_response' => $initBody
    ], $init['status']);
}

$transactionId = $initBody['transactionId'] ?? null;

if (!$transactionId) {
    json_response([
        'error' => 'VorkPay não retornou transactionId.',
        'gateway_response' => $initBody
    ], 502);
}

$method = strtolower((string) $data['method']);
$paymentPayload = [];

if ($method === 'multibanco') {
    $payment = vorkpay_request('POST', '/payments/multibanco', ['transactionId' => $transactionId], 30);
} else {
    $phone = preg_replace('/\D+/', '', (string) ($data['payer']['phone'] ?? ''));
    $payment = vorkpay_request('POST', '/payments/mbway', [
        'transactionId' => $transactionId,
        'phoneNumber' => $phone
    ], 30);
}

if (!$payment['ok']) {
    json_response([
        'error' => 'Falha na comunicação com a VorkPay para gerar pagamento.',
        'details' => $payment['error'],
        'method' => $method
    ], 502);
}

$paymentBody = json_decode($payment['body'], true);

if (!is_array($paymentBody)) {
    json_response([
        'error' => 'Resposta inválida da VorkPay ao gerar pagamento.',
        'raw' => $payment['body']
    ], 502);
}

if ($payment['status'] < 200 || $payment['status'] >= 300) {
    json_response([
        'error' => $paymentBody['error'] ?? 'VorkPay recusou a geração do pagamento.',
        'gateway_status' => $payment['status'],
        'gateway_response' => $paymentBody
    ], $payment['status']);
}

$payload = normalize_vorkpay_transaction(array_merge($initBody, $paymentBody), [
    'id' => $transactionId,
    'transactionId' => $transactionId,
    'amount' => $data['amount'],
    'currency' => $data['currency'] ?? 'EUR',
    'status' => 'PENDING',
    'method' => $method,
    'paymentMethod' => $method === 'multibanco' ? 'REFERENCE' : 'MBWAY'
]);

$payload['id'] = $transactionId;
$payload['transaction_id'] = $transactionId;
$payload['transactionId'] = $transactionId;
$payload['externalOrderId'] = $orderId;
$payload['status'] = $payload['status'] ?? 'PENDING';
$payload['method'] = $method;
$payload['paymentMethod'] = $method === 'multibanco' ? 'REFERENCE' : 'MBWAY';
$payload['amount'] = $payload['amount'] ?? $data['amount'];
$payload['currency'] = $payload['currency'] ?? ($data['currency'] ?? 'EUR');
$payload['payer'] = $data['payer'];
$payload['trackingParameters'] = $data['trackingParameters'];
$payload['pagePath'] = $data['pagePath'];
$payload['paymentDescription'] = $data['paymentDescription'];
$payload['_gateway'] = 'vorkpay';
$payload['_created_by_gateway'] = true;
$payload['_verified_by_gateway'] = false;
$payload['_created_at'] = $payload['_created_at'] ?? gmdate('c');
$payload['_fingerprint'] = $fingerprint;

if ($method === 'multibanco') {
    $payload['referenceData'] = [
        'entity' => $paymentBody['entity'] ?? null,
        'reference' => $paymentBody['reference'] ?? null,
        'expiresAt' => $paymentBody['expiresAt'] ?? null
    ];
    $payload['entity'] = $payload['referenceData']['entity'];
    $payload['reference'] = $payload['referenceData']['reference'];
    $payload['expiresAt'] = $payload['referenceData']['expiresAt'];
}

if ($idempotencyKey !== '') {
    $payload['_idempotency_key'] = $idempotencyKey;
}

persist_transaction_snapshot($payload);
$payload['_utmify_generated'] = send_utmify_order($payload);

if ($fingerprint !== '') {
    kv_set_json($fingerprintKey, $payload);
}

if ($idempotencyKey !== '') {
    kv_set_json('idem:' . $idempotencyKey, $payload);
}

json_response($payload, 200);
