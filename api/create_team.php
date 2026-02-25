<?php
session_start();
require "db.php";

header("Content-Type: application/json");

$user_id = $_SESSION["user_id"] ?? null;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized — please log in"]);
    exit;
}

$room_id   = intval($_POST["room_id"] ?? 0);
$team_name = trim($_POST["team_name"] ?? "");

if (!$room_id || !$team_name) {
    http_response_code(400);
    echo json_encode(["error" => "Missing parameters"]);
    exit;
}

// Block: user already leads a team in this room
$check1 = $conn->prepare("SELECT id FROM teams WHERE leader_id = ? AND room_id = ?");
$check1->bind_param("ii", $user_id, $room_id);
$check1->execute();
$check1->store_result();
if ($check1->num_rows > 0) {
    http_response_code(400);
    echo json_encode(["error" => "You already created a team in this room"]);
    exit;
}

// Block: user is already a member of any team in this room
$check2 = $conn->prepare("
    SELECT tm.team_id FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.user_id = ? AND t.room_id = ?
");
$check2->bind_param("ii", $user_id, $room_id);
$check2->execute();
$check2->store_result();
if ($check2->num_rows > 0) {
    http_response_code(400);
    echo json_encode(["error" => "You are already in a team in this room"]);
    exit;
}

// Insert team
$stmt = $conn->prepare("INSERT INTO teams (room_id, team_name, leader_id) VALUES (?, ?, ?)");
$stmt->bind_param("isi", $room_id, $team_name, $user_id);
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to create team"]);
    exit;
}

$team_id = $conn->insert_id;

// Add creator as member
$memberStmt = $conn->prepare("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)");
$memberStmt->bind_param("ii", $team_id, $user_id);
$memberStmt->execute();

$_SESSION["team_id"] = $team_id;

echo json_encode(["success" => true, "team_id" => $team_id]);
?>