<?php
header("Content-Type: application/json");
require "db.php";

$room_id = $_GET["room_id"];

$stmt = $conn->prepare("SELECT id, team_name FROM teams WHERE room_id=?");
$stmt->bind_param("i", $room_id);
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while ($row = $res->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>
