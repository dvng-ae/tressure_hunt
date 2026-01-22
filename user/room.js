window.onload = loadAdminRooms;

function loadAdminRooms() {
    const roomsContainer = document.getElementById("roomsContainer");
    roomsContainer.innerHTML = "";

    // Get rooms created by admin
    const rooms = JSON.parse(localStorage.getItem("rooms")) || [];

    if (rooms.length === 0) {
        roomsContainer.innerHTML =
            "<p style='color:#aaa;'>No active rooms available</p>";
        return;
    }

    rooms.forEach(roomName => {
        const roomDiv = document.createElement("div");
        roomDiv.className = "room";
        roomDiv.textContent = roomName;

        roomDiv.onclick = () => joinRoom(roomName);

        roomsContainer.appendChild(roomDiv);
    });

    // Optional hunter count (example logic)
    document.getElementById("hunterCount").innerText =
        `${rooms.length * 5} hunters are currently active`;
}

function joinRoom(roomName) {
    // Save joined room
    localStorage.setItem("joinedRoom", roomName);

    alert("Joined room: " + roomName);

    // NEXT PAGE (later)
    // window.location.href = "team_page.html";
}
