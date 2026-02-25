<?php
session_start();
require "db.php";

header("Content-Type: application/json");

$user_id = $_SESSION["user_id"] ?? null;
$team_id = intval($_POST["team_id"] ?? 0);

if (!$user_id || !$team_id) {
    http_response_code(400);
    echo json_encode(["error" => "Missing parameters"]);
    exit;
}

// Get room_id for this team
$roomStmt = $conn->prepare("SELECT room_id FROM teams WHERE id = ?");
$roomStmt->bind_param("i", $team_id);
$roomStmt->execute();
$roomRes = $roomStmt->get_result();
if (!$roomRes || $roomRes->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["error" => "Team not found"]);
    exit;
}
$room_id = $roomRes->fetch_assoc()["room_id"];

// Block: already in a team in this room
$check = $conn->prepare("
    SELECT tm.team_id FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.user_id = ? AND t.room_id = ?
");
$check->bind_param("ii", $user_id, $room_id);
$check->execute();
$check->store_result();
if ($check->num_rows > 0) {
    http_response_code(400);
    echo json_encode(["error" => "You are already in a team in this room"]);
    exit;
}

// Insert member
$stmt = $conn->prepare("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)");
$stmt->bind_param("ii", $team_id, $user_id);
$stmt->execute();

$_SESSION["team_id"] = $team_id;

echo json_encode(["team_id" => $team_id]);
?>