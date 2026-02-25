<?php
session_start();
require "db.php";

header("Content-Type: application/json");

$room_id         = intval($_GET["room_id"] ?? 0);
$current_user_id = $_SESSION["user_id"] ?? null;

// Not logged in — return null user id, empty teams
if (!$current_user_id) {
    echo json_encode(["current_user_id" => null, "teams" => []]);
    exit;
}

if (!$room_id) {
    echo json_encode(["current_user_id" => $current_user_id, "teams" => []]);
    exit;
}

$teams = [];

$stmt = $conn->prepare("SELECT id, team_name, leader_id FROM teams WHERE room_id = ?");
$stmt->bind_param("i", $room_id);
$stmt->execute();
$teamRes = $stmt->get_result();

while ($team = $teamRes->fetch_assoc()) {
    // Get members with their username
    $memberStmt = $conn->prepare("
        SELECT u.id, u.username
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = ?
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

echo json_encode([
    "current_user_id" => $current_user_id,
    "teams"           => $teams
]);
?>