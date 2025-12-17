<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../lib/sqlite3_helper.php';

$db = new SQLite3Helper(__DIR__ . '/../../data/memo.db');

$action = isset($_GET['action']) ? $_GET['action'] : null;
if ($action === 'export') {
    $memos = $db->getAllMemos();
    echo json_encode($memos, JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['success' => false, 'message' => 'invalid action']);
