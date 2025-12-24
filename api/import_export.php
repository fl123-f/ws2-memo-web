<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../lib/sqlite3_helper.php';

$db = new SQLite3Helper(__DIR__ . '/../../data/memo.db');

$action = isset($_GET['action']) ? $_GET['action'] : null;
$format = isset($_GET['format']) ? $_GET['format'] : 'json';

if ($action === 'export') {
    $memos = $db->getAllMemos();
    
    if ($format === 'csv') {
        // CSV形式で出力
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="memos_export_' . date('Ymd_His') . '.csv"');
        
        // BOMを追加してUTF-8を明示
        echo "\xEF\xBB\xBF";
        
        // CSVヘッダー
        echo '"ID","タイトル","内容","カテゴリ","作成日時"' . "\n";
        
        // データ行
        foreach ($memos as $memo) {
            $id = $memo['id'] ?? '';
            $title = str_replace('"', '""', $memo['title'] ?? '');
            $content = str_replace('"', '""', $memo['content'] ?? '');
            $category = $memo['category'] ?? '';
            $created_at = $memo['created_at'] ?? '';
            
            echo "\"$id\",\"$title\",\"$content\",\"$category\",\"$created_at\"\n";
        }
        exit;
    } else {
        // JSON形式で出力（デフォルト）
        echo json_encode($memos, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'invalid action']);
