<?php
echo "PHP Version: " . phpversion() . "\n";
echo "SQLite3 extension loaded: " . (extension_loaded('sqlite3') ? 'Yes' : 'No') . "\n";

// 测试数据库连接
$dbFile = __DIR__ . '/data/memo.db';
echo "Database file: " . $dbFile . "\n";
echo "File exists: " . (file_exists($dbFile) ? 'Yes' : 'No') . "\n";

if (file_exists($dbFile)) {
    try {
        $db = new SQLite3($dbFile);
        echo "SQLite3 connection successful\n";
        
        // 测试查询
        $result = $db->query("SELECT name FROM sqlite_master WHERE type='table'");
        $tables = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $tables[] = $row['name'];
        }
        echo "Tables in database: " . implode(', ', $tables) . "\n";
        
        $db->close();
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "Database file not found\n";
}
?>
