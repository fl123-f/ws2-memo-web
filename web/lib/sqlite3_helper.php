<?php
class SQLite3Helper {
    private $db;

    // コンストラクタ: データベース接続を作成し、テーブルを初期化
    public function __construct($file) {
        $this->db = new SQLite3($file);
        $this->initTable();
    }

    // テーブルの初期化（存在しなければ作成）
    private function initTable() {
        $this->db->exec("CREATE TABLE IF NOT EXISTS memos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,  // ID（自動増分）
            title TEXT NOT NULL,                   // メモのタイトル
            content TEXT NOT NULL,                 // メモの内容
            category TEXT,                         // カテゴリ（任意）
            date TEXT NOT NULL                     // 作成日
        )");
    }

    // 新しいメモを挿入
    public function insertMemo($title, $content, $category = '') {
        $stmt = $this->db->prepare("INSERT INTO memos (title, content, category, date) VALUES (:title, :content, :category, :date)");
        if (!$stmt) return false;
        $stmt->bindValue(':title', $title, SQLITE3_TEXT);
        $stmt->bindValue(':content', $content, SQLITE3_TEXT);
        $stmt->bindValue(':category', $category, SQLITE3_TEXT);
        $stmt->bindValue(':date', date('Y-m-d'), SQLITE3_TEXT); // 今日の日付
        return $stmt->execute() ? true : false;
    }

    // すべてのメモを取得（作成日降順）
    public function getAllMemos() {
        $result = $this->db->query("SELECT * FROM memos ORDER BY date DESC");
        $memos = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $memos[] = $row; // 配列に追加
        }
        return $memos;
    }
}
