<?php
// レスポンスの Content-Type を JSON に指定（文字コード UTF-8）
header('Content-Type: application/json; charset=utf-8');

// データベースファイルのパス
$dbFile = __DIR__ . '/../../data/memo.db';

// SQLite3 データベース接続を作成
$db = new SQLite3($dbFile);

// テーブルが存在しない場合は作成
$db->exec("CREATE TABLE IF NOT EXISTS memos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,   // ID（自動増分）
    title TEXT NOT NULL,                     // メモのタイトル
    content TEXT NOT NULL,                   // メモの内容
    date TEXT NOT NULL                       // 作成日
)");

// テーブルが空の場合、テスト用のデータを挿入
$result = $db->query("SELECT COUNT(*) AS count FROM memos");
$count = $result->fetchArray(SQLITE3_ASSOC)['count'];
if ($count == 0) {
    $db->exec("INSERT INTO memos (title, content, date) VALUES
        ('テストメモ1', 'これはテスト内容1です', '2025-11-24'),
        ('テストメモ2', 'これはテスト内容2です', '2025-11-23')
    ");
}

// 全てのメモを取得（作成日が新しい順）
$result = $db->query("SELECT * FROM memos ORDER BY date DESC");

// 結果を配列に格納
$memos = [];
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $memos[] = $row;
}

// JSON 形式で返却
echo json_encode($memos, JSON_UNESCAPED_UNICODE);
