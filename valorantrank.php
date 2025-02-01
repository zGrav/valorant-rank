<?php
// Obtain your API token from https://docs.henrikdev.xyz/authentication-and-authorization
const API_TOKEN = "TOKEN";

$name = $_GET['name'] ?? null;
$tag = $_GET['tag'] ?? null;
$region = $_GET['region'] ?? null;
$format = $_GET['format'] ?? null;

if (!$region) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "Please provide region as query parameter. (Available regions: eu/na/ap/kr/latam/br)"
    ]);
    exit;
}

if (!$name || !$tag) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "Please provide name and tag as query parameters."
    ]);
    exit;
}

$apiUrl = "https://api.henrikdev.xyz/valorant/v1/mmr/" . urlencode($region) . "/" . urlencode($name) . "/" . urlencode($tag);

$options = [
    "http" => [
        "header" => "Authorization: " . API_TOKEN
    ]
];

$context = stream_context_create($options);

$response = file_get_contents($apiUrl, false, $context);

if ($response === FALSE) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "Failed to retrieve rank information."
    ]);
    exit;
}

$data = json_decode($response, true);

$currenttierpatched = $data['data']['currenttierpatched'] ?? 'Unknown';
$ranking_in_tier = $data['data']['ranking_in_tier'] ?? 0;

if ($format === 'message') {
    header('Content-Type: text/plain');
    echo "{$name}#{$tag} (" . strtoupper($region) . ") - {$currenttierpatched} - {$ranking_in_tier} RR";
} else {
    header('Content-Type: application/json');
    echo json_encode([
        "name" => $name,
        "tag" => $tag,
        "nameAndTag" => "{$name}#{$tag}",
        "region" => $region,
        "rank" => $currenttierpatched,
        "rankPoints" => $ranking_in_tier
    ]);
}
