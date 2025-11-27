<?php
// レスポンスの Content-Type を JSON に指定（文字コード UTF-8）
header('Content-Type: application/json; charset=utf-8');

// データベースファイルのパス
$dbFile = __DIR__ . '/../../data/memo.db';

// SQLite3 データベース接続を作成
$db = new SQLite3($dbFile);

// テーブルが存在しない場合は作成（category 列を追加）
$db->exec("CREATE TABLE IF NOT EXISTS memos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,   
    title TEXT NOT NULL,                    
    content TEXT NOT NULL,                 
    category TEXT,                          
    date TEXT NOT NULL                      
)");

// 全てのメモを取得（作成日が新しい順）
$result = $db->query("SELECT * FROM memos ORDER BY date DESC");

// 結果を配列に格納
$memos = [];
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $memos[] = $row;
}

// JSON 形式で返却
echo json_encode($memos, JSON_UNESCAPED_UNICODE);
