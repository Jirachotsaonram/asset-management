<?php
// ไฟล์ทดสอบ API ง่ายๆ
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// ทดสอบว่า API ทำงาน
$response = [
    'success' => true,
    'message' => 'API ทำงานปกติ',
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => $_SERVER['SERVER_NAME'],
    'ip' => $_SERVER['SERVER_ADDR'] ?? 'unknown',
    'base_url' => 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['SCRIPT_NAME']),
    'endpoints' => [
        'login' => '/auth/login (POST)',
        'assets' => '/assets (GET)',
        'register' => '/auth/register (POST)'
    ]
];

echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

