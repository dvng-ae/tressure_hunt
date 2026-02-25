<?php
include "db.php";

$room_name = $_POST["room_name"];

if(!$room_name){

echo json_encode(["success"=>false]);
exit;

}

mysqli_query($conn,"
INSERT INTO rooms(room_name)
VALUES('$room_name')
");

echo json_encode(["success"=>true]);
?>