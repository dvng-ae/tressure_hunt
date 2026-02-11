<?php
require "db.php";

$room_id = $_POST["room_id"];
$name = $_POST["team_name"];

$stmt = $conn->prepare("INSERT INTO teams (room_id, team_name) VALUES (?, ?)");
$stmt->bind_param("is", $room_id, $name);
$stmt->execute();
?>
