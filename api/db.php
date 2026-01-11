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
}
