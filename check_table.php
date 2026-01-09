<?php
try {
    $db = new SQLite3('data/memo.db');
    $result = $db->query('PRAGMA table_info(memos)');
    echo 'Table structure for memos:<br>';
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        echo 'Column: ' . $row['name'] . ', Type: ' . $row['type'] . ', NotNull: ' . $row['notnull'] . ', Default: ' . $row['dflt_value'] . '<br>';
    }
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
?>
