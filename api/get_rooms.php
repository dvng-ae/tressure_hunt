<?php
header("Content-Type: application/json");
require "db.php";

$result = $conn->query("SELECT id, room_name FROM rooms");

$rooms = [];
while ($row = $result->fetch_assoc()) {
    $rooms[] = $row;
}

echo json_encode($rooms);
$conn->close();
?>
