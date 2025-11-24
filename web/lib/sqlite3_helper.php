<?php
class SQLite3Helper extends SQLite3 {
    function __construct($dbFile) {
        $this->open($dbFile);
    }

    function getAllMemos() {
        $res = $this->query('SELECT * FROM memos ORDER BY created_at DESC');
        $rows = [];
        while($row = $res->fetchArray(SQLITE3_ASSOC)){
            $rows[] = $row;
        }
        return $rows;
    }

    function getMemoById($id) {
        $stmt = $this->prepare('SELECT * FROM memos WHERE id=:id');
        $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
        $res = $stmt->execute();
        return $res->fetchArray(SQLITE3_ASSOC);
    }

    function insertMemo($title, $content){
        $stmt = $this->prepare('INSERT INTO memos(title,content,created_at) VALUES(:title,:content,datetime("now"))');
        $stmt->bindValue(':title',$title);
        $stmt->bindValue(':content',$content);
        $stmt->execute();
    }

    function updateMemo($id, $title, $content){
        $stmt = $this->prepare('UPDATE memos SET title=:title, content=:content WHERE id=:id');
        $stmt->bindValue(':id',$id,SQLITE3_INTEGER);
        $stmt->bindValue(':title',$title);
        $stmt->bindValue(':content',$content);
        $stmt->execute();
    }

    function deleteMemo($id){
        $stmt = $this->prepare('DELETE FROM memos WHERE id=:id');
        $stmt->bindValue(':id',$id,SQLITE3_INTEGER);
        $stmt->execute();
    }
}
