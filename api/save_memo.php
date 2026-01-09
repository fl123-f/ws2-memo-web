<?php
header('Content-Type: application/json; charset=utf-8');

// 关闭警告输出，防止破坏 JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    $dbFile = __DIR__ . '/../data/memo.db';
    
    // 使用 SQLite3Helper
    require_once __DIR__ . '/../lib/sqlite3_helper.php';
    $dbHelper = new SQLite3Helper($dbFile);
    
    // 获取 POST JSON
    $rawInput = file_get_contents('php://input');
    
    // 尝试不同的编码方式
    $data = json_decode($rawInput, true);
    
    // 如果json_decode失败，尝试处理编码问题（GBK到UTF-8）
    if (json_last_error() !== JSON_ERROR_NONE) {
        // 尝试将GBK转换为UTF-8
        if (function_exists('mb_convert_encoding')) {
            $utf8Input = mb_convert_encoding($rawInput, 'UTF-8', 'GBK');
            $data = json_decode($utf8Input, true);
        } else {
            // 如果mb_convert_encoding不可用，尝试iconv
            $utf8Input = iconv('GBK', 'UTF-8', $rawInput);
            if ($utf8Input !== false) {
                $data = json_decode($utf8Input, true);
            }
        }
    }
    
    // 如果仍然失败，尝试使用JSON_INVALID_UTF8_IGNORE
    if (json_last_error() !== JSON_ERROR_NONE) {
        $data = json_decode($rawInput, true, 512, JSON_INVALID_UTF8_IGNORE);
    }
    
    $title = isset($data['title']) ? trim($data['title']) : '';
    $content = isset($data['content']) ? trim($data['content']) : '';
    $category = isset($data['category']) ? trim($data['category']) : '';

    // 空笔记不存
    if ($title === '' && $content === '') {
        echo json_encode(['success'=>false, 'message'=>'标题和内容不能为空']);
        exit;
    }

    // 使用 SQLite3Helper 插入数据
    $result = $dbHelper->insertMemo($title, $content, $category);
    
    if ($result['success']) {
        // 获取最后插入的ID
        $db = new SQLite3($dbFile);
        $lastInsertId = $db->lastInsertRowID();
        echo json_encode(['success'=>true, 'id'=>$lastInsertId]);
    } else {
        echo json_encode($result);
    }

} catch (Exception $e) {
    echo json_encode(['success'=>false, 'message'=>$e->getMessage()]);
}
