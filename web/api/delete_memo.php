<?php
require_once '../lib/sqlite3_helper.php';
$db = new SQLite3Helper('data/memo.db');

$id = $_POST['id'];
$db->deleteMemo($id);
echo json_encode(['status'=>'deleted']);
