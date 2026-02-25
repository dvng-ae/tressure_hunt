<?php
session_start();
require "db.php";

header("Content-Type: application/json");

$user_id = $_SESSION["user_id"] ?? null;
$team_id = intval($_GET["team_id"] ?? 0);

if (!$user_id || !$team_id) {
    echo json_encode([]);
    exit;
}

// Get room_id from team
$roomStmt = $conn->prepare("SELECT room_id FROM teams WHERE id = ?");
$roomStmt->bind_param("i", $team_id);
$roomStmt->execute();
$roomRes = $roomStmt->get_result();
if ($roomRes->num_rows === 0) {
    echo json_encode([]);
    exit;
}
$room_id = $roomRes->fetch_assoc()["room_id"];

// Get all questions for this room with THIS team's completion status
$stmt = $conn->prepare("
    SELECT
        q.id,
        q.question_text,
        q.question_order,
        CASE WHEN tp.question_id IS NULL THEN 0 ELSE 1 END AS completed
    FROM questions q
    LEFT JOIN team_progress tp
        ON q.id = tp.question_id AND tp.team_id = ?
    WHERE q.room_id = ?
    ORDER BY q.question_order ASC
");
$stmt->bind_param("ii", $team_id, $room_id);
$stmt->execute();
$result = $stmt->get_result();

$clues = [];
while ($row = $result->fetch_assoc()) {
    $clues[] = $row;
}

echo json_encode($clues);
?>