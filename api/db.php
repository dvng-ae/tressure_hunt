<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "treasure_hunt";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    header("Content-Type: application/json");
    http_response_code(500);
    die(json_encode(["error" => "Database connection failed"]));
}
// ✅ No session_start() here — each file handles its own session
// ✅ No dev auto-login — removed completely
?>