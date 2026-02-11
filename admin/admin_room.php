<?php
session_start();
if (!isset($_SESSION["admin"])) {
    header("Location: ../index.php");
    exit;
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Admin Room</title>
    <link rel="stylesheet" href="admin_room.css">
</head>
<body>

<h1 class="title">ADMIN ROOM</h1>

<div class="form">
    <input
        type="text"
        id="roomInput"
        class="input-box"
        placeholder="Enter room name"
    />

    <button class="btn" onclick="createRoom()">
        Create Room
    </button>
</div>

<h3 class="section-title">Active Rooms</h3>
<div id="roomsContainer"></div>

<script>
function createRoom() {
    const input = document.getElementById("roomInput");
    const roomName = input.value.trim();

    if (!roomName) {
        alert("Enter room name");
        return;
    }

    fetch("../api/create_room.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `room_name=${encodeURIComponent(roomName)}`
    })
    .then(() => {
        input.value = "";
        loadRooms();
    });
}

function loadRooms() {
    fetch("../api/get_active_rooms.php")
        .then(res => res.json())
        .then(rooms => {
            const container = document.getElementById("roomsContainer");
            container.innerHTML = "";

            if (!rooms || rooms.length === 0) {
                container.innerHTML = "<p>No active rooms</p>";
                return;
            }

            rooms.forEach(room => {
                const div = document.createElement("div");
                div.className = "room";
                div.textContent = room.room_name;
                container.appendChild(div);
            });
        })
        .catch(err => {
            console.error("Error loading rooms:", err);
        });
}

window.onload = loadRooms;
</script>

</body>
</html>
