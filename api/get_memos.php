<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);

try {
    require_once __DIR__ . '/db.php';
    $db = new DB();

    // 获取所有备忘录
    $memos = $db->getAllMemos();

    echo json_encode(['success'=>true, 'memos'=>$memos], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(['success'=>false, 'message'=>$e->getMessage()]);
}
