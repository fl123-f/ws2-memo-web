<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 启用输出缓冲以捕获所有输出
ob_start();

try {
    require_once __DIR__ . '/db.php';
    $db = new DB();

    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    if (!$data) {
        echo json_encode(['success'=>false, 'message'=>'JSON解析失败', 'raw'=>$rawInput]);
        exit;
    }

    $title = trim($data['title'] ?? '');
    $content = trim($data['content'] ?? '');
    $category = trim($data['category'] ?? '');

    if ($title === '' && $content === '') {
        echo json_encode(['success'=>false,'message'=>'标题和内容不能为空']);
        exit;
    }

    $sql = "INSERT INTO memos (title, content, category, date) VALUES (:title, :content, :category, :date)";
    
    // 直接使用SQLite3进行更详细的错误处理
    $connection = $db->getConnection();
    $stmt = $connection->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success'=>false, 'message'=>'准备SQL语句失败', 'error'=>$connection->lastErrorMsg()]);
        exit;
    }
    
    $stmt->bindValue(':title', $title, SQLITE3_TEXT);
    $stmt->bindValue(':content', $content, SQLITE3_TEXT);
    $stmt->bindValue(':category', $category, SQLITE3_TEXT);
    $stmt->bindValue(':date', date('Y-m-d H:i:s'), SQLITE3_TEXT);
    
    $result = $stmt->execute();
    
    if ($result) {
        echo json_encode(['success'=>true, 'id'=>$connection->lastInsertRowID()]);
    } else {
        echo json_encode(['success'=>false, 'message'=>'写入数据库失败', 'error'=>$connection->lastErrorMsg()]);
    }

} catch (Exception $e) {
    echo json_encode(['success'=>false, 'message'=>$e->getMessage()]);
}

// 获取所有输出
$output = ob_get_clean();
echo $output;
?>
