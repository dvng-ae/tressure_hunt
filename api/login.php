<?php
session_start();
header("Content-Type: application/json");
require "db.php";

$username = $_POST["username"] ?? "";
$password = $_POST["password"] ?? "";

$stmt = $conn->prepare("SELECT id, password FROM users WHERE username=?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    if (password_verify($password, $row["password"])) {
        $_SESSION["user_id"] = $row["id"];
        echo json_encode(["success"=>true]);
    } else {
        echo json_encode(["success"=>false,"error"=>"Wrong password"]);
    }
} else {
    echo json_encode(["success"=>false,"error"=>"User not found"]);
}
?>
