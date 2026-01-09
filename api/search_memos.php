<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);

try {
    $dbFile = __DIR__ . '/../data/memo.db';
    if (!file_exists($dbFile)) {
        echo json_encode(['success'=>false, 'message'=>'Database not found', 'path'=>$dbFile]);
        exit;
    }

    $db = new SQLite3($dbFile);

    // 获取搜索关键词
    $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
    
    if (empty($keyword)) {
        echo json_encode(['success'=>false, 'message'=>'Search keyword is required']);
        exit;
    }

    // 如果表不存在就创建
    $db->exec("CREATE TABLE IF NOT EXISTS memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        category TEXT,
        is_pinned INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )");

    // 准备搜索查询 - 在标题和内容中搜索关键词
    $stmt = $db->prepare("
        SELECT * FROM memos 
        WHERE title LIKE :keyword OR content LIKE :keyword 
        ORDER BY is_pinned DESC, created_at DESC
    ");
    
    $searchKeyword = '%' . $keyword . '%';
    $stmt->bindValue(':keyword', $searchKeyword, SQLITE3_TEXT);
    
    $result = $stmt->execute();

    $memos = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $memos[] = $row;
    }

    echo json_encode([
        'success' => true, 
        'memos' => $memos,
        'keyword' => $keyword,
        'count' => count($memos)
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(['success'=>false, 'message'=>$e->getMessage()]);
}
