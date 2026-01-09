<?php
// 测试 api/get_memos.php
$url = "http://localhost/ws2-memo-web/api/get_memos.php";
echo "Testing: $url\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "HTTP Status Code: $http_code\n";
echo "Response: $response\n";

curl_close($ch);
?>
