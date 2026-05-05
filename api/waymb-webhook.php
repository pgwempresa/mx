<?php

require_once 'utils.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$data = read_json_input();

if (!empty($data)) {
    if (isset($data['status'])) {
        $data['status'] = normalize_waymb_status($data['status']);
    }

    $txId = get_transaction_id($data);

    if (!$txId) {
        json_response([
            'received' => false,
            'error' => 'transaction id is required'
        ], 400);
    }

    $existing = kv_get_json('tx:' . $txId);
    $gateway = waymb_request('/transactions/info', ['id' => $txId], 15);
    $gatewayPayload = null;

    if ($gateway['ok'] && $gateway['status'] >= 200 && $gateway['status'] < 300) {
        $decoded = json_decode($gateway['body'], true);

        if (is_array($decoded)) {
            $gatewayPayload = $decoded;
        }
    }

    if (is_array($gatewayPayload)) {
        if (isset($gatewayPayload['status'])) {
            $gatewayPayload['status'] = normalize_waymb_status($gatewayPayload['status']);
        }

        $data = $gatewayPayload;
        $data['_verified_by_gateway'] = true;
        $data['_gateway_checked_at'] = gmdate('c');
        $data['_webhook_received'] = true;
    } else {
        $data['_verified_by_gateway'] = false;
        $data['_webhook_received'] = true;
        $data['_webhook_deferred'] = true;
        $data['_gateway_error'] = $gateway['error'] ?: ('HTTP ' . ($gateway['status'] ?? 0));
    }

    if (is_array($existing)) {
        if (empty($data['payer']) && !empty($existing['payer'])) {
            $data['payer'] = $existing['payer'];
        }

        if (empty($data['trackingParameters']) && !empty($existing['trackingParameters'])) {
            $data['trackingParameters'] = $existing['trackingParameters'];
        }

        if (empty($data['pagePath']) && !empty($existing['pagePath'])) {
            $data['pagePath'] = $existing['pagePath'];
        }

        if (empty($data['amount']) && !empty($existing['amount'])) {
            $data['amount'] = $existing['amount'];
        }

        if (empty($data['method']) && !empty($existing['method'])) {
            $data['method'] = $existing['method'];
        }
    }

    persist_transaction_snapshot($data);

    if (!empty($data['_verified_by_gateway'])) {
        $data['_utmify_status'] = send_utmify_order($data);
    }
}

json_response([
    'received' => true,
    'id' => $data['id'] ?? ($data['transactionId'] ?? null),
    'status' => $data['status'] ?? null,
    'verified' => !empty($data['_verified_by_gateway'])
]);
