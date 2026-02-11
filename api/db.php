<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "treasure_hunt";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Database connection failed");
}
?>
