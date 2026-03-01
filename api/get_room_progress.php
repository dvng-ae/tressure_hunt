<?php
// Buffer ALL output so any PHP warnings/notices don't corrupt the JSON
ob_start();

require "db.php";

// Clear any output that db.php may have produced (warnings etc.)
ob_clean();

header("Content-Type: application/json");
header("Cache-Control: no-cache");

$room_id = intval($_GET["room_id"] ?? 0);
if (!$room_id) {
    echo json_encode(["error" => "Missing room_id"]);
    exit;
}

// ── ROOM ─────────────────────────────────────────────────────
$roomStmt = $conn->prepare("SELECT id, room_name FROM rooms WHERE id = ?");
$roomStmt->bind_param("i", $room_id);
$roomStmt->execute();
$roomRes = $roomStmt->get_result();
if ($roomRes->num_rows === 0) {
    echo json_encode(["error" => "Room not found"]);
    exit;
}
$room = $roomRes->fetch_assoc();

// ── TOTAL QUESTIONS ───────────────────────────────────────────
$totalStmt = $conn->prepare("SELECT COUNT(*) as total FROM questions WHERE room_id = ?");
$totalStmt->bind_param("i", $room_id);
$totalStmt->execute();
$totalClues = (int)$totalStmt->get_result()->fetch_assoc()["total"];

// ── ALL QUESTIONS ─────────────────────────────────────────────
$qStmt = $conn->prepare("SELECT id, question_text, question_order FROM questions WHERE room_id = ? ORDER BY question_order ASC");
$qStmt->bind_param("i", $room_id);
$qStmt->execute();
$qRes = $qStmt->get_result();
$questions = [];
while ($q = $qRes->fetch_assoc()) {
    $questions[] = [
        "id"             => (int)$q["id"],
        "question_text"  => $q["question_text"],
        "question_order" => (int)$q["question_order"]
    ];
}

// ── TEAMS ─────────────────────────────────────────────────────
$teamsStmt = $conn->prepare("SELECT id, team_name, leader_id FROM teams WHERE room_id = ?");
$teamsStmt->bind_param("i", $room_id);
$teamsStmt->execute();
$teamsRes = $teamsStmt->get_result();

$teams = [];
while ($team = $teamsRes->fetch_assoc()) {

    // Members
    $mStmt = $conn->prepare("SELECT u.username FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = ?");
    $mStmt->bind_param("i", $team["id"]);
    $mStmt->execute();
    $mRes = $mStmt->get_result();
    $members = [];
    while ($m = $mRes->fetch_assoc()) {
        $members[] = $m["username"];
    }

    // Completed clues from team_progress
    $pStmt = $conn->prepare("
        SELECT q.id, q.question_text, q.question_order, tp.scanned_at
        FROM team_progress tp
        JOIN questions q ON tp.question_id = q.id
        WHERE tp.team_id = ? AND q.room_id = ?
        ORDER BY q.question_order ASC
    ");
    $pStmt->bind_param("ii", $team["id"], $room_id);
    $pStmt->execute();
    $pRes = $pStmt->get_result();

    $completedClues = [];
    while ($p = $pRes->fetch_assoc()) {
        $completedClues[] = [
            "question_id"    => (int)$p["id"],
            "question_text"  => $p["question_text"],
            "question_order" => (int)$p["question_order"],
            "scanned_at"     => $p["scanned_at"] ?? null
        ];
    }

    $solved = count($completedClues);
    if ($solved === 0)                                $status = "waiting";
    elseif ($totalClues > 0 && $solved >= $totalClues) $status = "finished";
    else                                               $status = "active";

    $teams[] = [
        "team_id"         => (int)$team["id"],
        "team_name"       => $team["team_name"],
        "members"         => $members,
        "clues_solved"    => $solved,
        "total_clues"     => $totalClues,
        "status"          => $status,
        "completed_clues" => $completedClues
    ];
}

// Sort: finished → active → waiting, then by clues_solved desc
usort($teams, function($a, $b) {
    $order = ["finished" => 0, "active" => 1, "waiting" => 2];
    $diff = ($order[$a["status"]] ?? 3) - ($order[$b["status"]] ?? 3);
    return $diff !== 0 ? $diff : $b["clues_solved"] - $a["clues_solved"];
});

echo json_encode([
    "room"        => $room,
    "total_clues" => $totalClues,
    "questions"   => $questions,
    "teams"       => $teams
]);
?>