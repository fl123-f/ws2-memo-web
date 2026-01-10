<?php
// 测试所有API端点
$base_url = "http://localhost/ws2-memo-web/api";

$apis = [
    'get_memos.php' => 'GET',
    'get_memo.php?id=1' => 'GET',
    'search_memos.php?keyword=test' => 'GET',
    'import_export.php?action=export' => 'GET',
];

foreach ($apis as $endpoint => $method) {
    $url = "$base_url/$endpoint";
    echo "\nTesting: $url ($method)\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    
    if ($method == 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
    }
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    echo "HTTP Status Code: $http_code\n";
    
    // 只显示响应的一部分，避免太长
    if (strlen($response) > 200) {
        echo "Response (truncated): " . substr($response, 0, 200) . "...\n";
    } else {
        echo "Response: $response\n";
    }
    
    curl_close($ch);
    
    // 短暂暂停
    usleep(100000);
}

// 测试POST API（save_memo.php）
echo "\n\nTesting POST API: save_memo.php\n";
$post_url = "$base_url/save_memo.php";
$post_data = json_encode([
    'title' => '测试备忘录',
    'content' => '这是一个测试备忘录内容',
    'category' => '测试'
]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $post_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($post_data)
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "HTTP Status Code: $http_code\n";
echo "Response: $response\n";

curl_close($ch);
?>
