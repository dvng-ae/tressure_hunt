<?php
session_start();
require "db.php";
header("Content-Type: application/json");

$user_id = $_SESSION["user_id"] ?? null;
if (!$user_id) { echo json_encode(["success"=>false,"message"=>"Not logged in"]); exit; }

$data    = json_decode(file_get_contents("php://input"), true);
$qr_code = trim($data["qr_code"] ?? "");
$team_id = intval($data["team_id"] ?? 0);
if (!$qr_code || !$team_id) { echo json_encode(["success"=>false,"message"=>"Missing data"]); exit; }

$mc = $conn->prepare("SELECT 1 FROM team_members WHERE team_id=? AND user_id=?");
$mc->bind_param("ii",$team_id,$user_id); $mc->execute(); $mc->store_result();
if ($mc->num_rows===0) { echo json_encode(["success"=>false,"message"=>"Not in this team"]); exit; }

$qs = $conn->prepare("SELECT id,question_text,question_order,room_id FROM questions WHERE qr_code=?");
$qs->bind_param("s",$qr_code); $qs->execute();
$qr = $qs->get_result();
if ($qr->num_rows===0) { echo json_encode(["success"=>false,"message"=>"Invalid QR code"]); exit; }

$q           = $qr->fetch_assoc();
$question_id = (int)$q["id"];
$clue_text   = $q["question_text"];
$order       = (int)$q["question_order"];
$room_id     = (int)$q["room_id"];

$teamCount = (int)$conn->query("SELECT COUNT(*) as c FROM teams WHERE room_id=$room_id")->fetch_assoc()["c"];
$clueCount = (int)$conn->query("SELECT COUNT(*) as c FROM questions WHERE room_id=$room_id")->fetch_assoc()["c"];

// FREE_CLUES: always leaves at least 1 elimination clue
$FREE_CLUES = max(1, min(3, (int)floor($clueCount * 0.4)));
if ($FREE_CLUES >= $clueCount) $FREE_CLUES = $clueCount - 1;

// Already scanned?
$ad = $conn->prepare("SELECT id FROM team_progress WHERE team_id=? AND question_id=?");
$ad->bind_param("ii",$team_id,$question_id); $ad->execute(); $ad->store_result();
if ($ad->num_rows>0) { echo json_encode(["success"=>false,"message"=>"Already scanned by your team"]); exit; }

// Is this team already eliminated?
if ($order > $FREE_CLUES) {
    $past = $conn->prepare("
        SELECT q.id as qid, q.question_order
        FROM team_progress tp
        JOIN questions q ON tp.question_id=q.id
        WHERE tp.team_id=? AND q.room_id=? AND q.question_order>?
        ORDER BY q.question_order ASC
    ");
    $past->bind_param("iii",$team_id,$room_id,$FREE_CLUES); $past->execute();
    $pastRows = $past->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach ($pastRows as $row) {
        $cqid = (int)$row["qid"]; $cord = (int)$row["question_order"];
        $scans = $conn->query("
            SELECT team_id, scanned_at FROM team_progress
            WHERE question_id=$cqid ORDER BY scanned_at DESC, team_id ASC
        ")->fetch_all(MYSQLI_ASSOC);
        if (count($scans) < 2) continue;
        $lastTime  = $scans[0]["scanned_at"];
        $lastTeams = array_values(array_filter($scans, fn($s)=>$s["scanned_at"]===$lastTime));
        if (count($lastTeams)===1 && (int)$lastTeams[0]["team_id"]===$team_id) {
            echo json_encode(["success"=>false,"eliminated"=>true,
                "message"=>"☠️ Your team was eliminated at Clue $cord — you were last to scan it."]);
            exit;
        }
    }
}

// Sequential order check
$prevTotal = (int)$conn->query("SELECT COUNT(*) as t FROM questions WHERE room_id=$room_id AND question_order<$order")->fetch_assoc()["t"];
if ($prevTotal > 0) {
    $dc = $conn->prepare("SELECT COUNT(*) as t FROM team_progress tp JOIN questions q ON tp.question_id=q.id WHERE tp.team_id=? AND q.room_id=? AND q.question_order<?");
    $dc->bind_param("iii",$team_id,$room_id,$order); $dc->execute();
    if ((int)$dc->get_result()->fetch_assoc()["t"] < $prevTotal) {
        echo json_encode(["success"=>false,"message"=>"Complete the previous clue first!"]);exit;
    }
}

// Record scan
$ins = $conn->prepare("INSERT INTO team_progress (team_id,question_id) VALUES (?,?)");
$ins->bind_param("ii",$team_id,$question_id); $ins->execute();

// Did this team just become last scanner?
$justEliminated = false; $eliminatedAtClue = null;
if ($order > $FREE_CLUES) {
    $nowScans = $conn->query("SELECT team_id,scanned_at FROM team_progress WHERE question_id=$question_id ORDER BY scanned_at DESC, team_id ASC")->fetch_all(MYSQLI_ASSOC);
    if (count($nowScans) >= 2) {
        $latestTime = $nowScans[0]["scanned_at"];
        $myRows     = array_values(array_filter($nowScans, fn($s)=>(int)$s["team_id"]===$team_id));
        $myTime     = $myRows[0]["scanned_at"] ?? null;
        $lastTeams  = array_values(array_filter($nowScans, fn($s)=>$s["scanned_at"]===$latestTime));
        if ($myTime===$latestTime && count($lastTeams)===1) {
            $justEliminated=true; $eliminatedAtClue=$order;
        }
    }
}

// Progress
$total = (int)$conn->query("SELECT COUNT(*) as t FROM questions WHERE room_id=$room_id")->fetch_assoc()["t"];
$comp  = $conn->prepare("SELECT COUNT(*) as t FROM team_progress tp JOIN questions q ON tp.question_id=q.id WHERE tp.team_id=? AND q.room_id=?");
$comp->bind_param("ii",$team_id,$room_id); $comp->execute();
$done = (int)$comp->get_result()->fetch_assoc()["t"];

// First winner?
$isFirstWinner = false;
if ($done===$total && $total>0) {
    $others = (int)$conn->query("SELECT COUNT(*) as c FROM (SELECT tp.team_id,COUNT(*) as cnt FROM team_progress tp JOIN questions q ON tp.question_id=q.id WHERE q.room_id=$room_id AND tp.team_id!=$team_id GROUP BY tp.team_id HAVING cnt=$total) x")->fetch_assoc()["c"];
    if ($others===0) $isFirstWinner=true;
}

echo json_encode([
    "success"=>true,"clue"=>$clue_text,"completed"=>$done,"total"=>$total,
    "just_eliminated"=>$justEliminated,"eliminated_at"=>$eliminatedAtClue,
    "free_clues"=>$FREE_CLUES,"is_first_winner"=>$isFirstWinner
]);
?>