<?php
session_start();
require "db.php";

$user_id = $_SESSION["user_id"] ?? null;
$team_id = $_POST["team_id"];

if (!$user_id || !$team_id) {
    http_response_code(400);
    echo json_encode(["error" => "missing"]);
    exit;
}

// verify leader
$stmt = $conn->prepare("SELECT leader_id FROM teams WHERE id=?");
$stmt->bind_param("i", $team_id);
$stmt->execute();
$res = $stmt->get_result();
if ($row = $res->fetch_assoc()) {
    if ($row["leader_id"] != $user_id) {
        http_response_code(403);
        echo json_encode(["error" => "not allowed"]);
        exit;
    }
} else {
    http_response_code(404);
    echo json_encode(["error" => "team not found"]);
    exit;
}

// delete members then team
$del1 = $conn->prepare("DELETE FROM team_members WHERE team_id=?");
$del1->bind_param("i", $team_id);
$del1->execute();

$del2 = $conn->prepare("DELETE FROM teams WHERE id=?");
$del2->bind_param("i", $team_id);
$del2->execute();

if (isset($_SESSION["team_id"]) && $_SESSION["team_id"] == $team_id) {
    unset($_SESSION["team_id"]);
}

echo json_encode(["success" => true]);
?>