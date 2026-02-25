<?php
include "db.php";

$team_id = $_POST["team_id"];
$qr = $_POST["qr"];

$response = [];

/* Find question */
$stmt = $conn->prepare("
SELECT id, question_text, question_order
FROM questions
WHERE qr_code = ?
");

$stmt->bind_param("s", $qr);
$stmt->execute();
$result = $stmt->get_result();

if($result->num_rows == 0)
{
    echo json_encode([
        "success"=>false,
        "message"=>"Invalid QR"
    ]);
    exit;
}

$q = $result->fetch_assoc();

$question_id = $q["id"];
$clue = $q["question_text"];
$order = $q["question_order"];


/* Check already completed */
$stmt2 = $conn->prepare("
SELECT id FROM team_progress
WHERE team_id=? AND question_id=?
");

$stmt2->bind_param("ii", $team_id, $question_id);
$stmt2->execute();
$r2 = $stmt2->get_result();

if($r2->num_rows == 0)
{
    /* Insert progress */
    $stmt3 = $conn->prepare("
    INSERT INTO team_progress(team_id, question_id)
    VALUES (?,?)
    ");
    $stmt3->bind_param("ii", $team_id, $question_id);
    $stmt3->execute();
}


/* Get total */
$total = $conn->query("SELECT COUNT(*) as t FROM questions")
->fetch_assoc()["t"];


/* Get completed */
$completed = $conn->query("
SELECT COUNT(*) as t
FROM team_progress
WHERE team_id=$team_id
")->fetch_assoc()["t"];


echo json_encode([
    "success"=>true,
    "clue"=>$clue,
    "completed"=>$completed,
    "total"=>$total
]);
?>