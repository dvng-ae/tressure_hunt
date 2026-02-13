<?php
session_start();
require "db.php";

$user_id = $_SESSION["user_id"];
$team_id = $_POST["team_id"];

$stmt = $conn->prepare("DELETE FROM team_members WHERE team_id=? AND user_id=?");
$stmt->bind_param("ii", $team_id, $user_id);
$stmt->execute();
?>
