<?php
session_start();
require "db.php";

$user_id = $_SESSION["user_id"];
$room_id = $_POST["room_id"];

$stmt = $conn->prepare("INSERT INTO room_users (user_id, room_id) VALUES (?, ?)");
$stmt->bind_param("ii", $user_id, $room_id);
$stmt->execute();
?>
