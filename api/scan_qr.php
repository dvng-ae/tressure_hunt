<?php
session_start();
require "db.php";

header("Content-Type: application/json");

$user_id = $_SESSION["user_id"] ?? null;
if (!$user_id) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$data    = json_decode(file_get_contents("php://input"), true);
$qr_code = trim($data["qr_code"] ?? "");
$team_id = intval($data["team_id"] ?? 0);

if (!$qr_code || !$team_id) {
    echo json_encode(["success" => false, "message" => "Missing data"]);
    exit;
}

// Verify user belongs to this team
$memberCheck = $conn->prepare("SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?");
$memberCheck->bind_param("ii", $team_id, $user_id);
$memberCheck->execute();
$memberCheck->store_result();
if ($memberCheck->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "You are not in this team"]);
    exit;
}

// Find the question by QR code
$stmt = $conn->prepare("SELECT id, question_text, question_order, room_id FROM questions WHERE qr_code = ?");
$stmt->bind_param("s", $qr_code);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Invalid QR code"]);
    exit;
}

$q           = $result->fetch_assoc();
$question_id = $q["id"];
$clue        = $q["question_text"];
$order       = $q["question_order"];
$room_id     = $q["room_id"];

// Check this team hasn't already scanned this QR
$alreadyDone = $conn->prepare("SELECT id FROM team_progress WHERE team_id = ? AND question_id = ?");
$alreadyDone->bind_param("ii", $team_id, $question_id);
$alreadyDone->execute();
$alreadyDone->store_result();
if ($alreadyDone->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Already scanned by your team"]);
    exit;
}

// Enforce order — check this team completed all previous clues in this room
$prevCountRes = $conn->prepare("SELECT COUNT(*) as total FROM questions WHERE room_id = ? AND question_order < ?");
$prevCountRes->bind_param("ii", $room_id, $order);
$prevCountRes->execute();
$prevTotal = $prevCountRes->get_result()->fetch_assoc()["total"];

if ($prevTotal > 0) {
    $doneCountRes = $conn->prepare("
        SELECT COUNT(*) as total FROM team_progress tp
        JOIN questions q ON tp.question_id = q.id
        WHERE tp.team_id = ? AND q.room_id = ? AND q.question_order < ?
    ");
    $doneCountRes->bind_param("iii", $team_id, $room_id, $order);
    $doneCountRes->execute();
    $doneTotal = $doneCountRes->get_result()->fetch_assoc()["total"];

    if ($doneTotal < $prevTotal) {
        echo json_encode(["success" => false, "message" => "Complete the previous clue first!"]);
        exit;
    }
}

// Record progress for this team
$insert = $conn->prepare("INSERT INTO team_progress (team_id, question_id) VALUES (?, ?)");
$insert->bind_param("ii", $team_id, $question_id);
$insert->execute();

// Get this team's overall progress in this room
$totalRes = $conn->query("SELECT COUNT(*) as t FROM questions WHERE room_id = $room_id");
$total    = $totalRes->fetch_assoc()["t"];

$completedRes = $conn->prepare("
    SELECT COUNT(*) as t FROM team_progress tp
    JOIN questions q ON tp.question_id = q.id
    WHERE tp.team_id = ? AND q.room_id = ?
");
$completedRes->bind_param("ii", $team_id, $room_id);
$completedRes->execute();
$completed = $completedRes->get_result()->fetch_assoc()["t"];

echo json_encode([
    "success"   => true,
    "clue"      => $clue,
    "completed" => $completed,
    "total"     => $total
]);
?>