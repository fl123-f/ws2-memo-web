<?php
header('Content-Type: application/json; charset=utf-8');

// 数据库路径
$dbFile = __DIR__ . '/../../data/memo.db';
if (!file_exists($dbFile)) {
    echo json_encode(['error' => 'Database not found', 'path' => $dbFile]);
    exit;
}

$db = new SQLite3($dbFile);

// 分页参数
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$pageSize = isset($_GET['pageSize']) ? (int)$_GET['pageSize'] : 10;
$offset = ($page - 1) * $pageSize;

// 分类和关键词过滤
$category = isset($_GET['category']) ? trim($_GET['category']) : '';
$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

// 构建 WHERE 子句
$where = [];
$params = [];
if ($category !== '') {
    $where[] = "category = :category";
    $params[':category'] = $category;
}
if ($keyword !== '') {
    $where[] = "(title LIKE :keyword OR content LIKE :keyword)";
    $params[':keyword'] = "%$keyword%";
}
$whereSql = $where ? "WHERE " . implode(" AND ", $where) : "";

// 查询总数
$countQuery = "SELECT COUNT(*) as cnt FROM memos $whereSql";
$countStmt = $db->prepare($countQuery);
foreach ($params as $key => $value) {
    $countStmt->bindValue($key, $value, SQLITE3_TEXT);
}
$countRes = $countStmt->execute();
$total = $countRes->fetchArray(SQLITE3_ASSOC)['cnt'] ?? 0;

// 查询当前页数据
$dataQuery = "SELECT * FROM memos $whereSql ORDER BY date DESC LIMIT :limit OFFSET :offset";
$dataStmt = $db->prepare($dataQuery);
foreach ($params as $key => $value) {
    $dataStmt->bindValue($key, $value, SQLITE3_TEXT);
}
$dataStmt->bindValue(':limit', $pageSize, SQLITE3_INTEGER);
$dataStmt->bindValue(':offset', $offset, SQLITE3_INTEGER);

$result = $dataStmt->execute();

$memos = [];
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $memos[] = $row;
}

// 输出 JSON
echo json_encode([
    'total' => $total,
    'page' => $page,
    'pageSize' => $pageSize,
    'memos' => $memos
], JSON_UNESCAPED_UNICODE);
