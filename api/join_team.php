<?php
session_start();
require "db.php";

$user_id = $_SESSION["user_id"];

// Get username from users table
$stmtUser = $conn->prepare("SELECT username FROM users WHERE id=?");
$stmtUser->bind_param("i", $user_id);
$stmtUser->execute();
$resultUser = $stmtUser->get_result();
$user = $resultUser->fetch_assoc();
$username = $user["username"];

$team_id = $_POST["team_id"];

// Insert with username
$stmt = $conn->prepare("INSERT INTO team_members (team_id, user_id, username) VALUES (?, ?, ?)");
$stmt->bind_param("iis", $team_id, $user_id, $username);
$stmt->execute();
?>
