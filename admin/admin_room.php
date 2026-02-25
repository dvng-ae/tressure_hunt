<?php
session_start();

if (!isset($_SESSION["admin"])) {
    header("Location: admin_login.php");
    exit;
}

include "../api/db.php";
?>

<!DOCTYPE html>
<html>
<head>
<title>Admin Room</title>
<link rel="stylesheet" href="admin_room.css">
</head>
<body>

<div class="container">

<h1>ADMIN ROOM</h1>

<!-- CREATE ROOM -->
<input type="text" id="roomName" placeholder="Enter room name">

<button onclick="createRoom()">Create Room</button>

<h2>Active Rooms</h2>

<div id="roomList">

<?php
$result = mysqli_query($conn, "SELECT * FROM rooms ORDER BY id DESC");

while ($row = mysqli_fetch_assoc($result)) {
?>

<div class="room-card">

<div class="room-name">
<?php echo $row["room_name"]; ?>
</div>

<button onclick="openQuestions(<?php echo $row['id']; ?>)">
Manage Questions
</button>

</div>

<?php } ?>

</div>

</div>

<script>

// OPEN QUESTIONS PAGE
function openQuestions(roomId){

localStorage.setItem("admin_room_id", roomId);

window.location.href = "questions.php";

}


// CREATE ROOM
function createRoom(){

const roomName = document.getElementById("roomName").value.trim();

if(roomName==""){

alert("Enter room name");
return;

}

fetch("../api/create_room.php",{

method:"POST",

headers:{
"Content-Type":"application/x-www-form-urlencoded"
},

body:`room_name=${encodeURIComponent(roomName)}`

})
.then(res=>res.json())
.then(data=>{

if(data.success){

location.reload();

}else{

alert("Failed to create room");

}

});

}

</script>

</body>
</html>