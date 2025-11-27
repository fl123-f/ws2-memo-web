<?php
ini_set('display_errors', '0');
error_reporting(0);
header('Content-Type: application/json; charset=utf-8');

$id = $_GET['id'] ?? null;
if ($id === null) {
    echo json_encode(['success' => false, 'message' => 'id is required']);
    exit;
}

$id = intval($id);
if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'invalid id']);
    exit;
}

try {
    // delete_memo.php 在 web\api，项目根的 data 在 ../../data
    $dbPath = __DIR__ . '/../../data/memo.db';
    if (!file_exists($dbPath)) {
        echo json_encode(['success' => false, 'message' => 'database not found']);
        exit;
    }

    $db = new SQLite3($dbPath);
    $stmt = $db->prepare('DELETE FROM memos WHERE id = :id');
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    $stmt->execute();

    if ($db->changes() > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'not found']);
    }

    $db->close();
} catch (Exception $e) {
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'message' => 'server error']);
}