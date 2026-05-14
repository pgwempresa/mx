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

    $incomingWebhook = $data;
    $incomingFinal = isset($incomingWebhook['status']) && is_final_waymb_status($incomingWebhook['status']);

    $txId = get_transaction_id($data);

    if (!$txId) {
        json_response([
            'received' => false,
            'error' => 'transaction id is required'
        ], 400);
    }

    $existing = kv_get_json('tx:' . $txId);
    $gateway = waymb_request('/transactions/info', waymb_info_payload($txId), 15);
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

        if ($incomingFinal && !is_final_waymb_status($gatewayPayload['status'] ?? 'PENDING')) {
            $data = array_merge($gatewayPayload, $incomingWebhook);
            $data['status'] = normalize_waymb_status($incomingWebhook['status']);
            $data['_verified_by_gateway'] = true;
            $data['_trusted_webhook_status'] = true;
        } else {
            $data = $gatewayPayload;
            $data['_verified_by_gateway'] = true;
        }
        $data['_gateway_checked_at'] = gmdate('c');
        $data['_webhook_received'] = true;
    } else {
        $data['_verified_by_gateway'] = $incomingFinal;
        $data['_webhook_received'] = true;
        if ($incomingFinal) {
            $data['_trusted_webhook_status'] = true;
        }
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

    if (is_array($existing) && empty($data['_fingerprint']) && !empty($existing['_fingerprint'])) {
        $data['_fingerprint'] = $existing['_fingerprint'];
    }

    persist_transaction_snapshot($data);
    if (!empty($data['_fingerprint'])) {
        kv_set_json('txfinger:' . $data['_fingerprint'], $data);
    }

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
