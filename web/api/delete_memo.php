<?php
header('Content-Type: application/json; charset=utf-8');

// 数据库文件
$dbFile = __DIR__ . '/../../data/memo.db';
$db = new SQLite3($dbFile);

// 获取 ID，可以是 GET 或 POST
$id = $_GET['id'] ?? null;
if ($id === null) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
}

if ($id === null) {
    echo json_encode(['success'=>false, 'message'=>'IDが指定されていません']);
    exit;
}

$id = (int)$id; // 强制转换为整数
if ($id <= 0) {
    echo json_encode(['success'=>false, 'message'=>'無効なIDです']);
    exit;
}

$stmt = $db->prepare("DELETE FROM memos WHERE id=:id");
$stmt->bindValue(':id', $id, SQLITE3_INTEGER);
$res = $stmt->execute();

if ($res) echo json_encode(['success'=>true]);
else echo json_encode(['success'=>false, 'message'=>'削除に失敗しました']);
