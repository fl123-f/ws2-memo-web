<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../lib/sqlite3_helper.php';

$db = new SQLite3Helper(__DIR__ . '/../../data/memo.db');

$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
if ($id === null || $id <= 0) {
	echo json_encode(['success' => false, 'message' => 'IDが指定されていません']);
	exit;
}

$memo = $db->getMemoById($id);
if ($memo === null) {
	echo json_encode(['success' => false, 'message' => '指定されたメモは見つかりませんでした']);
} else {
	echo json_encode(['success' => true, 'memo' => $memo], JSON_UNESCAPED_UNICODE);
}
