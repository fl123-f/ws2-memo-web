<?php
// db.php - 统一管理 SQLite 数据库

class DB {
    private $dbFile;
    private $db;

    public function __construct($dbFile = null) {
        // 默认数据库文件在 data/memo.db
        $this->dbFile = $dbFile ?: __DIR__ . '/../data/memo.db';

        // 如果数据库文件不存在，则创建并初始化
        $init = false;
        if (!file_exists($this->dbFile)) {
            $init = true;
        }

        $this->db = new SQLite3($this->dbFile);

        if ($init) {
            $this->initTables();
        }
    }

    // 初始化表
    private function initTables() {
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS memos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                content TEXT,
                category TEXT,
                date TEXT NOT NULL,
                is_pinned INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ");
    }

    

    // 执行查询（返回结果数组）
    public function query($sql, $params = []) {
        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val, SQLITE3_TEXT);
        }
        $res = $stmt->execute();
        $rows = [];
        while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
            $rows[] = $row;
        }
        return $rows;
    }

    // 执行插入/更新/删除
    public function execute($sql, $params = []) {
        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val, SQLITE3_TEXT);
        }
        $result = $stmt->execute();
        return $result !== false;
    }

    // 获取最后插入ID
    public function lastInsertId() {
        return $this->db->lastInsertRowID();
    }
    
    // 获取数据库连接（用于直接访问）
    public function getConnection() {
        return $this->db;
    }

    // 插入新备忘录（来自 SQLite3Helper）
    public function insertMemo($title, $content, $category = '') {
        $title = trim($title);
        $content = trim($content);
        $category = trim($category);

        if ($title === '' || $content === '') {
            return ['success' => false, 'message' => 'タイトルと内容は必須です'];
        }

        $sql = "INSERT INTO memos (title, content, category, date) 
                VALUES (:title, :content, :category, :date)";
        
        $params = [
            ':title' => $title,
            ':content' => $content,
            ':category' => $category,
            ':date' => date('Y-m-d H:i:s')
        ];

        $result = $this->execute($sql, $params);
        
        if ($result) {
            return ['success' => true];
        } else {
            return ['success' => false, 'message' => 'データベースに保存できませんでした'];
        }
    }

    // 获取所有备忘录（按置顶和创建时间降序）
    public function getAllMemos() {
        $sql = "SELECT * FROM memos ORDER BY is_pinned DESC, created_at DESC";
        return $this->query($sql);
    }

    // 更新备忘录
    public function updateMemo($id, $title, $content, $category = '') {
        $sql = "UPDATE memos SET title = :title, content = :content, category = :category WHERE id = :id";
        $params = [
            ':title' => $title,
            ':content' => $content,
            ':category' => $category,
            ':id' => $id
        ];
        return $this->execute($sql, $params);
    }

    // 根据 ID 获取单条备忘录
    public function getMemoById($id) {
        $id = (int)$id;
        if ($id <= 0) return null;
        
        $sql = "SELECT * FROM memos WHERE id = :id";
        $params = [':id' => $id];
        $result = $this->query($sql, $params);
        
        return !empty($result) ? $result[0] : null;
    }
}
