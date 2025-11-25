<?php
class SQLite3Helper {
    private $db;

    // 构造函数：连接数据库并初始化表
    public function __construct($file) {
        $this->db = new SQLite3($file);
        $this->initTable();
    }

    // 初始化表
    private function initTable() {
        $this->db->exec("CREATE TABLE IF NOT EXISTS memos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT,
            date TEXT NOT NULL
        )");
    }

    // 插入新备忘录
    public function insertMemo($title, $content, $category = '') {
        $title = trim($title);
        $content = trim($content);
        $category = trim($category);

        if ($title === '' || $content === '') {
            return ['success' => false, 'message' => 'タイトルと内容は必須です'];
        }

        $stmt = $this->db->prepare(
            "INSERT INTO memos (title, content, category, date) 
             VALUES (:title, :content, :category, :date)"
        );

        $stmt->bindValue(':title', $title, SQLITE3_TEXT);
        $stmt->bindValue(':content', $content, SQLITE3_TEXT);
        $stmt->bindValue(':category', $category, SQLITE3_TEXT);
        $stmt->bindValue(':date', date('Y-m-d'), SQLITE3_TEXT);

        $result = $stmt->execute();
        if ($result) {
            return ['success' => true];
        } else {
            return ['success' => false, 'message' => 'データベースに保存できませんでした'];
        }
    }

    // 获取所有备忘录（按日期降序）
    public function getAllMemos() {
        $result = $this->db->query("SELECT * FROM memos ORDER BY date DESC");
        $memos = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $memos[] = $row;
        }
        return $memos;
    }

    // 既存の SQLite3Helper クラスに追加
public function updateMemo($id, $title, $content, $category = '') {
    $stmt = $this->db->prepare("UPDATE memos SET title = :title, content = :content, category = :category WHERE id = :id");
    if (!$stmt) return false;
    $stmt->bindValue(':title', $title, SQLITE3_TEXT);
    $stmt->bindValue(':content', $content, SQLITE3_TEXT);
    $stmt->bindValue(':category', $category, SQLITE3_TEXT);
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    return $stmt->execute() ? true : false;
}

}

