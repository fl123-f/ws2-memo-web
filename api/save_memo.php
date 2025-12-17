<?php
header('Content-Type: application/json; charset=utf-8');

// 关闭警告输出，防止破坏 JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    $dbFile = __DIR__ . '/../memo.db';

    // 直接用 SQLite3（不依赖 SQLite3Helper）
    $db = new SQLite3($dbFile);

    // 如果表不存在就创建
    $db->exec("CREATE TABLE IF NOT EXISTS memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        category TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )");

    // 获取 POST JSON
    $data = json_decode(file_get_contents('php://input'), true);
    $title = isset($data['title']) ? trim($data['title']) : '';
    $content = isset($data['content']) ? trim($data['content']) : '';
    $category = isset($data['category']) ? trim($data['category']) : '';

    // 空笔记不存
    if ($title === '' && $content === '') {
        echo json_encode(['success'=>false, 'message'=>'标题和内容不能为空']);
        exit;
    }

    // 插入数据库
    $stmt = $db->prepare("INSERT INTO memos (title, content, category) VALUES (:title, :content, :category)");
    $stmt->bindValue(':title', $title, SQLITE3_TEXT);
    $stmt->bindValue(':content', $content, SQLITE3_TEXT);
    $stmt->bindValue(':category', $category, SQLITE3_TEXT);
    $stmt->execute();

    // 返回成功
    echo json_encode(['success'=>true, 'id'=>$db->lastInsertRowID()]);

} catch (Exception $e) {
    echo json_encode(['success'=>false, 'message'=>$e->getMessage()]);
}
