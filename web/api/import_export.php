<?php
require_once '../lib/sqlite3_helper.php';
$db = new SQLite3Helper('data/memo.db');

if($_GET['action'] === 'export'){
    $memos = $db->getAllMemos();
    header('Content-Type: application/json');
    echo json_encode($memos);
}
