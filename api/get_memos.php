<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);

try {
    $dbFile = __DIR__ . '/../memo.db';
    if (!file_exists($dbFile)) {
        echo json_encode(['success'=>false, 'message'=>'Database not found', 'path'=>$dbFile]);
        exit;
    }

    $db = new SQLite3($dbFile);

    // 如果表不存在就创建
    $db->exec("CREATE TABLE IF NOT EXISTS memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        category TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )");

    // 查询所有笔记
    $result = $db->query("SELECT * FROM memos ORDER BY created_at DESC");

    $memos = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $memos[] = $row;
    }

    echo json_encode(['success'=>true, 'memos'=>$memos], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(['success'=>false, 'message'=>$e->getMessage()]);
}
