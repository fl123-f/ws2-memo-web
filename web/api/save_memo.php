<?php
require_once '../lib/sqlite3_helper.php';
$db = new SQLite3Helper('data/memo.db');

$data = json_decode(file_get_contents('php://input'), true);
if(isset($data['id'])){
    $db->updateMemo($data['id'], $data['title'], $data['content']);
}else{
    $db->insertMemo($data['title'], $data['content']);
}
echo json_encode(['status'=>'ok']);
