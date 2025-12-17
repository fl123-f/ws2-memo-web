<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../lib/sqlite3_helper.php';

try {
    // 数据库文件路径
    $dbFile = __DIR__ . '/../../data/memo.db';
    $db = new SQLite3Helper($dbFile);

    // 获取 POST JSON
    $data = json_decode(file_get_contents('php://input'), true);

    $title = isset($data['title']) ? $data['title'] : '';
    $content = isset($data['content']) ? $data['content'] : '';
    $category = isset($data['category']) ? $data['category'] : '';

    $result = $db->insertMemo($title, $content, $category);

    echo json_encode($result, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(['success'=>false, 'message'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
