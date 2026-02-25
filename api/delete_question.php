<?php
include "db.php";

$id=$_POST['id'];

mysqli_query($conn,"
DELETE FROM questions WHERE id='$id'
");

echo json_encode(["success"=>true]);
?>
