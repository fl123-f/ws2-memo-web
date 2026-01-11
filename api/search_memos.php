<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);

try {
    require_once __DIR__ . '/db.php';
    $db = new DB();

    // 获取搜索关键词
    $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
    
    if (empty($keyword)) {
        echo json_encode(['success'=>false, 'message'=>'Search keyword is required']);
        exit;
    }

    // 准备搜索查询 - 在标题和内容中搜索关键词
    $sql = "
        SELECT * FROM memos 
        WHERE title LIKE :keyword OR content LIKE :keyword 
        ORDER BY is_pinned DESC, created_at DESC
    ";
    
    $searchKeyword = '%' . $keyword . '%';
    $params = [':keyword' => $searchKeyword];
    
    $memos = $db->query($sql, $params);

    echo json_encode([
        'success' => true, 
        'memos' => $memos,
        'keyword' => $keyword,
        'count' => count($memos)
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(['success'=>false, 'message'=>$e->getMessage()]);
}
