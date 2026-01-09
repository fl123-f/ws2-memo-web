<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);

try {
    $dbFile = __DIR__ . '/../data/memo.db';
    if (!file_exists($dbFile)) {
        echo json_encode(['success'=>false, 'message'=>'Database not found', 'path'=>$dbFile]);
        exit;
    }

    // 使用 SQLite3Helper
    require_once __DIR__ . '/../lib/sqlite3_helper.php';
    $dbHelper = new SQLite3Helper($dbFile);

    // 获取所有备忘录
    $memos = $dbHelper->getAllMemos();

    echo json_encode(['success'=>true, 'memos'=>$memos], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(['success'=>false, 'message'=>$e->getMessage()]);
}
