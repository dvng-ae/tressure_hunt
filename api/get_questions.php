<?php
include "db.php";

$room_id = $_GET['room_id'];

$result = mysqli_query($conn,"
SELECT * FROM questions
WHERE room_id='$room_id'
ORDER BY question_order ASC
");

$data=[];

while($row=mysqli_fetch_assoc($result)){

$data[]=$row;

}

echo json_encode($data);
?>