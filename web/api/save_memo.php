<?php
header('Content-Type: application/json; charset=utf-8'); 
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../lib/sqlite3_helper.php';  // 引入 Helper

// 数据库路径（从 api 目录往上两层到 code，再进入 data）
$db = new SQLite3Helper(__DIR__ . '/../../data/memo.db');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['title']) || !isset($data['content'])) {
    echo json_encode(['success' => false, 'message' => 'タイトルと内容が必要です']);
    exit;
}

$title = trim($data['title']);
$content = trim($data['content']);
$category = isset($data['category']) ? trim($data['category']) : '';

$ok = $db->insertMemo($title, $content, $category);

if ($ok) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'データベースに保存できませんでした']);
}
