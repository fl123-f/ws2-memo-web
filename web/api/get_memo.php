<?php
require_once '../lib/sqlite3_helper.php';
$db = new SQLite3Helper('data/memo.db');

$id = $_GET['id'];
$memo = $db->getMemoById($id);
echo json_encode($memo);
