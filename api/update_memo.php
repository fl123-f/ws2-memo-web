<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../lib/sqlite3_helper.php';

try {
    $db = new SQLite3Helper(__DIR__ . '/../../data/memo.db');

    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['id']) || !isset($data['title']) || !isset($data['content'])) {
        echo json_encode(['success' => false, 'message' => 'ID、タイトル、内容が必要です']);
        exit;
    }

    $id = (int)$data['id'];
    $title = trim($data['title']);
    $content = trim($data['content']);
    $category = isset($data['category']) ? trim($data['category']) : '';

    $ok = $db->updateMemo($id, $title, $content, $category);

    if ($ok) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'データベースの更新に失敗しました']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
