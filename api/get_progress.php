<?php
session_start();
include "db.php";

header("Content-Type: application/json");

$team_id = $_SESSION['team_id'] ?? 0;

$result = mysqli_query($conn,"
SELECT 
q.id,
q.question_text,
CASE WHEN c.id IS NULL THEN 0 ELSE 1 END as completed
FROM questions q
LEFT JOIN completed_questions c
ON q.id=c.question_id AND c.team_id='$team_id'
ORDER BY q.question_order
");

$clues=[];
$total=0;
$completed=0;

while($row=mysqli_fetch_assoc($result))
{
    $total++;

    if($row['completed']==1)
        $completed++;

    $clues[]=$row;
}

echo json_encode([
    "total"=>$total,
    "completed"=>$completed,
    "clues"=>$clues
]);