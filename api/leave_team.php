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

// Cannot leave if you are the leader — must delete instead
$leaderCheck = $conn->prepare("SELECT id FROM teams WHERE id = ? AND leader_id = ?");
$leaderCheck->bind_param("ii", $team_id, $user_id);
$leaderCheck->execute();
$leaderCheck->store_result();
if ($leaderCheck->num_rows > 0) {
    http_response_code(400);
    echo json_encode(["error" => "Leaders cannot leave — delete the team instead"]);
    exit;
}

$stmt = $conn->prepare("DELETE FROM team_members WHERE team_id = ? AND user_id = ?");
$stmt->bind_param("ii", $team_id, $user_id);
$stmt->execute();

if (isset($_SESSION["team_id"]) && $_SESSION["team_id"] == $team_id) {
    unset($_SESSION["team_id"]);
}

echo json_encode(["success" => true]);
?>