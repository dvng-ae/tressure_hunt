<?php
require "db.php";

$room = $_POST["room_name"] ?? "";

if (!$room) {
    exit;
}

$stmt = $conn->prepare("INSERT INTO rooms (room_name) VALUES (?)");
$stmt->bind_param("s", $room);
$stmt->execute();

$stmt->close();
$conn->close();
?>
