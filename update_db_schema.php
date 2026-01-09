<?php
$dbFile = __DIR__ . '/data/memo.db';
$db = new SQLite3($dbFile);

echo "Current table structure:\n";
$result = $db->query("PRAGMA table_info(memos)");
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    echo "Column: {$row['name']}, Type: {$row['type']}\n";
}

echo "\nUpdating table structure...\n";

// 添加 is_pinned 列（如果不存在）
try {
    $db->exec("ALTER TABLE memos ADD COLUMN is_pinned INTEGER DEFAULT 0");
    echo "Added is_pinned column\n";
} catch (Exception $e) {
    echo "is_pinned column may already exist: " . $e->getMessage() . "\n";
}

// 添加 created_at 列（如果不存在）
try {
    $db->exec("ALTER TABLE memos ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP");
    echo "Added created_at column\n";
} catch (Exception $e) {
    echo "created_at column may already exist: " . $e->getMessage() . "\n";
}

// 如果 date 列存在但 created_at 不存在，将数据从 date 复制到 created_at
try {
    $result = $db->query("PRAGMA table_info(memos)");
    $hasDate = false;
    $hasCreatedAt = false;
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        if ($row['name'] == 'date') $hasDate = true;
        if ($row['name'] == 'created_at') $hasCreatedAt = true;
    }
    
    if ($hasDate && $hasCreatedAt) {
        $db->exec("UPDATE memos SET created_at = date WHERE created_at IS NULL OR created_at = ''");
        echo "Copied data from date to created_at\n";
    }
} catch (Exception $e) {
    echo "Error checking/updating columns: " . $e->getMessage() . "\n";
}

echo "\nUpdated table structure:\n";
$result = $db->query("PRAGMA table_info(memos)");
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    echo "Column: {$row['name']}, Type: {$row['type']}\n";
}

$db->close();
?>
