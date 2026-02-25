<?php
session_start();
require "db.php";

header("Content-Type: application/json");

if (!isset($_SESSION["admin"])) {
    echo json_encode(["success"=>false,"error"=>"Unauthorized"]);
    exit;
}

$room_id = intval($_POST["room_id"] ?? 0);
$question = trim($_POST["question"] ?? "");

if (!$room_id || !$question) {
    echo json_encode(["success"=>false,"error"=>"Missing data"]);
    exit;
}

/* GET NEXT ORDER */
$res = $conn->query("SELECT MAX(question_order) as max_order FROM questions WHERE room_id=$room_id");
$row = $res->fetch_assoc();
$order = ($row["max_order"] ?? 0) + 1;

/* GENERATE UNIQUE QR STRING */
$qr_code = "CLUE_" . uniqid() . "_" . time();

/* INSERT */
$stmt = $conn->prepare("
INSERT INTO questions(room_id,question_text,qr_code,question_order)
VALUES(?,?,?,?)
");

$stmt->bind_param("issi",$room_id,$question,$qr_code,$order);
$stmt->execute();

echo json_encode([
    "success"=>true,
    "qr_code"=>$qr_code
]);