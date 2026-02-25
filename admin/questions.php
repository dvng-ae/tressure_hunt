<?php
if(isset($_POST['clue_text']))
{
    $clue = $_POST['clue_text'];
    $room_id = $_GET['room_id'];

    $orderQuery = mysqli_query($conn,"SELECT MAX(clue_order) as max_order FROM questions WHERE room_id='$room_id'");
    $orderRow = mysqli_fetch_assoc($orderQuery);

    $order = $orderRow['max_order'] + 1;

    $qr_code = "TH_" . $room_id . "_" . $order;

    mysqli_query($conn,"
    INSERT INTO questions(room_id, clue_text, qr_code, clue_order)
    VALUES('$room_id','$clue','$qr_code','$order')
    ");
}
?>

<!DOCTYPE html>
<html>
<head>

<title>Manage Questions</title>

<link rel="stylesheet" href="questions.css">

<script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>

</head>
<body>

<div class="card">

<h2>Manage Questions</h2>

<textarea id="questionInput" placeholder="Enter clue..."></textarea>

<button onclick="addQuestion()">Add Clue</button>

<div id="questionList"></div>

</div>

<script>

const roomId = localStorage.getItem("admin_room_id");

// IMPORTANT: check room id exists
if(!roomId){

alert("Room not selected");
window.location.href="admin_room.php";

}

function addQuestion(){

const question=document.getElementById("questionInput").value.trim();

if(question==""){

alert("Enter question");
return;

}

fetch("../api/add_question.php",{

method:"POST",

headers:{
"Content-Type":"application/x-www-form-urlencoded"
},

body:`room_id=${roomId}&question=${encodeURIComponent(question)}`

})
.then(res=>res.json())
.then(data=>{

if(data.success){

document.getElementById("questionInput").value="";
loadQuestions();

}else{

alert("Failed to add question");

}

});

}

function loadQuestions(){

fetch("../api/get_questions.php?room_id="+roomId)

.then(res=>res.json())

.then(data=>{

const list=document.getElementById("questionList");

list.innerHTML="";

data.forEach(q=>{

const div=document.createElement("div");

div.className="qcard";

div.innerHTML=`

<div class="question-row">

<div class="question-left">

${q.question_text}

</div>

<div class="question-right">

<canvas id="qr-${q.id}"></canvas>

<div class="qr-buttons">

<button onclick="downloadQR('${q.qr_code}')">
Download
</button>

<button onclick="deleteQuestion(${q.id})" class="delete-btn">
Delete
</button>

</div>

</div>

</div>

`;

list.appendChild(div);

QRCode.toCanvas(

document.getElementById("qr-"+q.id),

q.qr_code,

{ width:100 }

);

});

});

}

function deleteQuestion(id){

fetch("../api/delete_question.php",{

method:"POST",

headers:{
"Content-Type":"application/x-www-form-urlencoded"
},

body:`id=${id}`

})
.then(loadQuestions);

}

function downloadQR(code){

const canvas=document.createElement("canvas");

QRCode.toCanvas(canvas,code,function(){

const link=document.createElement("a");

link.download="qr.png";

link.href=canvas.toDataURL();

link.click();

});

}

loadQuestions();

</script>

</body>
</html>