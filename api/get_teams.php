<?php
header("Content-Type: application/json");
session_start();
require "db.php";

$room_id = $_GET["room_id"] ?? null;
if (!$room_id) {
    echo json_encode([]);
    exit;
}

$teams = [];

$teamResult = $conn->prepare("SELECT id, team_name FROM teams WHERE room_id=?");
$teamResult->bind_param("i", $room_id);
$teamResult->execute();
$teamRes = $teamResult->get_result();

while ($team = $teamRes->fetch_assoc()) {

    $memberStmt = $conn->prepare("
        SELECT users.id, users.username
        FROM team_members
        JOIN users ON team_members.user_id = users.id
        WHERE team_members.team_id = ?
    ");
    $memberStmt->bind_param("i", $team["id"]);
    $memberStmt->execute();
    $membersRes = $memberStmt->get_result();

    $members = [];
    while ($m = $membersRes->fetch_assoc()) {
        $members[] = $m;
    }

    $team["members"] = $members;
    $teams[] = $team;
}

echo json_encode($teams);
?>
