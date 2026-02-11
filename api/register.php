<?php
header("Content-Type: application/json");
require "db.php";

$username = trim($_POST["username"] ?? "");
$password = $_POST["password"] ?? "";
$confirm  = $_POST["confirmPassword"] ?? "";

if (!$username || !$password || !$confirm) {
    echo json_encode(["success"=>false,"error"=>"All fields required"]);
    exit;
}

if ($password !== $confirm) {
    echo json_encode(["success"=>false,"error"=>"Passwords do not match"]);
    exit;
}

$stmt = $conn->prepare("SELECT id FROM users WHERE username=?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(["success"=>false,"error"=>"Username exists"]);
    exit;
}

$hashed = password_hash($password, PASSWORD_DEFAULT);
$stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
$stmt->bind_param("ss", $username, $hashed);

if ($stmt->execute()) {
    echo json_encode(["success"=>true]);
} else {
    echo json_encode(["success"=>false,"error"=>"DB error"]);
}
?>
