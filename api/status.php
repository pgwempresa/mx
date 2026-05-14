<?php

require_once 'utils.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$statusToken = env_first(['STATUS_ACCESS_TOKEN', 'API_STATUS_TOKEN'], '');
$providedToken = $_GET['token'] ?? ($_SERVER['HTTP_X_STATUS_TOKEN'] ?? '');

if ($statusToken === '' || !hash_equals($statusToken, (string) $providedToken)) {
    json_response([
        'ok' => false,
        'error' => 'not_found'
    ], 404);
}

$vorkpaySecret = get_vorkpay_secret();
$vorkpayWebhookSecret = env_first(['VORKPAY_WEBHOOK_SECRET'], '');
$origin = get_request_origin();

json_response([
    'ok' => true,
    'php_runtime' => true,
    'origin' => $origin,
    'kv' => [
        'configured' => !empty($kvUrl) && !empty($kvToken),
        'url_present' => !empty($kvUrl),
        'token_present' => !empty($kvToken)
    ],
    'vorkpay' => [
        'configured' => $vorkpaySecret !== '',
        'secret_present' => $vorkpaySecret !== '',
        'webhook_secret_present' => $vorkpayWebhookSecret !== '',
        'base_url' => get_vorkpay_base_url()
    ],
    'utmify' => [
        'configured' => get_utmify_token() !== '',
        'token_present' => get_utmify_token() !== '',
        'is_test' => env_first(['UTMIFY_IS_TEST'], 'false') === 'true',
        'last' => kv_get_json('utmify:last')
    ],
    'routes' => [
        'create' => '/api/create-mbway.php',
        'check' => '/api/check-mbway.php',
        'webhook' => '/api/waymb-webhook.php',
        'checkout_page' => '/checkout'
    ]
]);
