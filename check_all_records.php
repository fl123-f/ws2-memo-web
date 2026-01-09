<?php
try {
    $db = new SQLite3('data/memo.db');
    $result = $db->query('SELECT * FROM memos ORDER BY id');
    echo 'All records in memos table:<br>';
    echo '<table border="1">';
    echo '<tr><th>ID</th><th>Title</th><th>Content</th><th>Category</th><th>Date</th><th>Created At</th></tr>';
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        echo '<tr>';
        echo '<td>' . $row['id'] . '</td>';
        echo '<td>' . htmlspecialchars($row['title']) . '</td>';
        echo '<td>' . htmlspecialchars(substr($row['content'], 0, 50)) . '...</td>';
        echo '<td>' . htmlspecialchars($row['category']) . '</td>';
        echo '<td>' . $row['date'] . '</td>';
        echo '<td>' . $row['created_at'] . '</td>';
        echo '</tr>';
    }
    echo '</table>';
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
?>
