<?php

require_once 'utils.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-VorkPay-Signature, X-VorkPay-Event');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$raw = file_get_contents('php://input') ?: '';
$secret = env_first(['VORKPAY_WEBHOOK_SECRET'], '');
$signature = $_SERVER['HTTP_X_VORKPAY_SIGNATURE'] ?? '';

if ($secret !== '') {
    $expected = 'sha256=' . hash_hmac('sha256', $raw, $secret);

    if ($signature === '' || !hash_equals($expected, $signature)) {
        json_response(['received' => false, 'error' => 'invalid webhook signature'], 401);
    }
}

$event = json_decode($raw, true);
$data = is_array($event) ? ($event['data'] ?? $event) : [];

if (!empty($data)) {
    $eventName = (string) ($event['event'] ?? ($_SERVER['HTTP_X_VORKPAY_EVENT'] ?? ''));

    if (empty($data['status'])) {
        if ($eventName === 'payment.success') {
            $data['status'] = 'paid';
        } elseif ($eventName === 'payment.failed') {
            $data['status'] = 'failed';
        } elseif ($eventName === 'payment.cancelled') {
            $data['status'] = 'cancelled';
        }
    }

    $data = normalize_vorkpay_transaction($data);
    $txId = get_transaction_id($data);

    if (!$txId) {
        json_response([
            'received' => false,
            'error' => 'transaction id is required'
        ], 400);
    }

    $existing = kv_get_json('tx:' . $txId);

    if (is_array($existing)) {
        foreach (['payer', 'trackingParameters', 'pagePath', 'amount', 'method', '_fingerprint', 'paymentDescription'] as $key) {
            if (empty($data[$key]) && !empty($existing[$key])) {
                $data[$key] = $existing[$key];
            }
        }
    }

    $data['_gateway'] = 'vorkpay';
    $data['_verified_by_gateway'] = true;
    $data['_webhook_received'] = true;
    $data['_webhook_event'] = $eventName;
    $data['_webhook_received_at'] = gmdate('c');

    persist_transaction_snapshot($data);
    if (!empty($data['_fingerprint'])) {
        kv_set_json('txfinger:' . $data['_fingerprint'], $data);
    }

    if (is_final_waymb_status($data['status'] ?? '')) {
        $data['_utmify_status'] = send_utmify_order($data);
    }
}

json_response([
    'received' => true,
    'id' => $data['id'] ?? ($data['transactionId'] ?? null),
    'status' => $data['status'] ?? null,
    'verified' => !empty($data['_verified_by_gateway'])
]);
