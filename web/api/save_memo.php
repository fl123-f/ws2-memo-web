<?php
// レスポンスを JSON として返す
header('Content-Type: application/json; charset=utf-8');

// エラーを画面に出さず、ログに出す
ini_set('display_errors', 0);
error_reporting(E_ALL);

// デバッグ用：致命的なエラーがあっても、最低限 JSON を返すようにする
function safe_exit($success, $message) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// データベースファイルのパス
$dbFile = __DIR__ . '/../../data/memo.db';

// SQLite3 に接続
try {
    if (!class_exists('SQLite3')) {
        safe_exit(false, 'SQLite3 クラスが利用できません。PHP の設定を確認してください。');
    }

    $db = new SQLite3($dbFile);
} catch (Exception $e) {
    safe_exit(false, 'データベースに接続できませんでした: ' . $e->getMessage());
}

// memos テーブル（category 付き）を作成
$sql = "CREATE TABLE IF NOT EXISTS memos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TEXT NOT NULL
)";

if (!$db->exec($sql)) {
    safe_exit(false, 'テーブル作成に失敗しました。');
}

// JSON 受信
$raw = file_get_contents('php://input');
// ★★ 这行可以在需要时打开，写 log： file_put_contents(__DIR__ . '/../../logs/save_raw.log', $raw . PHP_EOL, FILE_APPEND);
$data = json_decode($raw, true);

if ($data === null) {
    safe_exit(false, 'JSON データの形式が不正です。');
}

$title    = isset($data['title'])    ? trim($data['title'])    : '';
$content  = isset($data['content'])  ? trim($data['content'])  : '';
$category = isset($data['category']) ? trim($data['category']) : '';

if ($title === '' || $content === '') {
    safe_exit(false, 'タイトルと内容は必須です。');
}

$date = date('Y-m-d');

// プリペアドステートメントで INSERT
$stmt = $db->prepare(
    'INSERT INTO memos (title, content, date)
     VALUES (:title, :content, :date)'
);


if (!$stmt) {
    safe_exit(false, 'ステートメントの準備に失敗しました。');
}

$stmt->bindValue(':title',    $title,    SQLITE3_TEXT);
$stmt->bindValue(':content',  $content,  SQLITE3_TEXT);
$stmt->bindValue(':date',     $date,     SQLITE3_TEXT);

$result = $stmt->execute();

if ($result) {
    safe_exit(true, 'メモを保存しました。');
} else {
    safe_exit(false, 'メモの保存に失敗しました。');
}
