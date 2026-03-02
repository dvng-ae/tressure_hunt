<?php
ob_start(); require "db.php"; ob_clean();
header("Content-Type: application/json");
header("Cache-Control: no-cache");

$room_id = intval($_GET["room_id"] ?? 0);
if (!$room_id) { echo json_encode(["error"=>"Missing room_id"]); exit; }

$teamCount = (int)$conn->query("SELECT COUNT(*) as c FROM teams WHERE room_id=$room_id")->fetch_assoc()["c"];
$clueCount = (int)$conn->query("SELECT COUNT(*) as c FROM questions WHERE room_id=$room_id")->fetch_assoc()["c"];

$FREE_CLUES = max(1, min(3, (int)floor($clueCount * 0.4)));
if ($FREE_CLUES >= $clueCount) $FREE_CLUES = $clueCount - 1;

$qRes = $conn->query("SELECT id,question_order FROM questions WHERE room_id=$room_id AND question_order>$FREE_CLUES ORDER BY question_order ASC");

$elimEvents = [];
while ($qRow = $qRes->fetch_assoc()) {
    $qid  = (int)$qRow["id"];
    $qord = (int)$qRow["question_order"];
    $scans = $conn->query("SELECT team_id,scanned_at FROM team_progress WHERE question_id=$qid ORDER BY scanned_at DESC, team_id ASC")->fetch_all(MYSQLI_ASSOC);
    if (count($scans) < 2) continue;
    $lastTime  = $scans[0]["scanned_at"];
    $lastTeams = array_values(array_filter($scans, fn($s)=>$s["scanned_at"]===$lastTime));
    if (count($lastTeams)===1) $elimEvents[(string)$qord] = (int)$lastTeams[0]["team_id"];
}

$eliminatedTeams = [];
foreach ($elimEvents as $clueOrd => $tid) {
    $key = (string)$tid;
    if (!isset($eliminatedTeams[$key])) $eliminatedTeams[$key] = (int)$clueOrd;
}

echo json_encode([
    "free_clues"=>$FREE_CLUES,"team_count"=>$teamCount,"clue_count"=>$clueCount,
    "elim_events"=>$elimEvents,"eliminated_teams"=>$eliminatedTeams
]);
?>