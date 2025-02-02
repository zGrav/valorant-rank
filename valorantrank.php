<?php
$name = isset($_GET['name']) ? htmlspecialchars(trim($_GET['name'])) : null;
$tag = isset($_GET['tag']) ? htmlspecialchars(trim($_GET['tag'])) : null;
$region = isset($_GET['region']) ? htmlspecialchars(trim($_GET['region'])) : null;
$format = isset($_GET['format']) ? htmlspecialchars(trim($_GET['format'])) : null;

if (!$region || !$name || !$tag) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "Missing required parameters: 'region', 'name', and 'tag'."
    ]);
    exit;
}

$allowedRegions = ['eu', 'na', 'ap', 'kr', 'latam', 'br'];

if (!in_array($region, $allowedRegions)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid region provided."]);
    exit;
}

$contentType = ($format === 'message') ? 'text/plain' : 'application/json';

$queryParams = http_build_query([
    'name' => $name,
    'tag' => $tag,
    'region' => $region,
    'format' => $format
]);

$apiUrl = "http://localhost:1336/rank?$queryParams";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch) || $httpCode !== 200) {
    error_log('cURL Error: ' . curl_error($ch));
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "Failed to retrieve data from the Node.js server."
    ]);
    curl_close($ch);
    exit;
}

curl_close($ch);

header("Content-Type: $contentType");
echo $response;
