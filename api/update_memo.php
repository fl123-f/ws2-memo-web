<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    require_once __DIR__ . '/db.php';
    $db = new DB();

    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['id'])) {
        echo json_encode(['success' => false, 'message' => 'IDが必要です']);
        exit;
    }

    $id = (int)$data['id'];
    
    // 检查是更新置顶状态还是更新内容
    if (isset($data['is_pinned'])) {
        // 更新置顶状态
        $is_pinned = (int)$data['is_pinned'];
        $sql = "UPDATE memos SET is_pinned = :is_pinned WHERE id = :id";
        $params = [
            ':is_pinned' => $is_pinned,
            ':id' => $id
        ];
    } else {
        // 更新标题、内容和分类
        if (!isset($data['title']) || !isset($data['content'])) {
            echo json_encode(['success' => false, 'message' => 'タイトルと内容が必要です']);
            exit;
        }
        
        $title = trim($data['title']);
        $content = trim($data['content']);
        $category = isset($data['category']) ? trim($data['category']) : '';
        
        $sql = "UPDATE memos SET title = :title, content = :content, category = :category WHERE id = :id";
        $params = [
            ':title' => $title,
            ':content' => $content,
            ':category' => $category,
            ':id' => $id
        ];
    }

    $result = $db->execute($sql, $params);

    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'データベースの更新に失敗しました']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
