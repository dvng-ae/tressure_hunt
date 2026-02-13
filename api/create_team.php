<?php
session_start();
require "db.php";

$user_id = $_SESSION["user_id"];
$room_id = $_POST["room_id"];
$team_name = trim($_POST["team_name"]);

// Get username
$stmtUser = $conn->prepare("SELECT username FROM users WHERE id=?");
$stmtUser->bind_param("i", $user_id);
$stmtUser->execute();
$resultUser = $stmtUser->get_result();
$user = $resultUser->fetch_assoc();
$username = $user["username"];

// Create team
$stmt = $conn->prepare("INSERT INTO teams (room_id, team_name) VALUES (?, ?)");
$stmt->bind_param("is", $room_id, $team_name);
$stmt->execute();
$team_id = $stmt->insert_id;

// Add creator as member
$memberStmt = $conn->prepare("INSERT INTO team_members (team_id, user_id, username) VALUES (?, ?, ?)");
$memberStmt->bind_param("iis", $team_id, $user_id, $username);
$memberStmt->execute();
?>
