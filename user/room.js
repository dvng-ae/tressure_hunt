window.addEventListener("load", loadRooms);

function loadRooms() {
    fetch("../api/get_rooms.php")
        .then(res => res.json())
        .then(rooms => {
            const container = document.getElementById("roomsContainer");
            const count = document.getElementById("roomCount");

            container.innerHTML = "";

            if (!rooms || rooms.length === 0) {
                container.innerHTML = "<p>No rooms available</p>";
                count.textContent = "";
                return;
            }

            rooms.forEach(room => {
                const div = document.createElement("div");
                div.className = "room";
                div.textContent = room.room_name;

                div.onclick = () => {
                    localStorage.setItem("joinedRoomId", room.id);
                    window.location.href = "team.html";
                };

                container.appendChild(div);
            });

            count.textContent = `${rooms.length} rooms available`;
        });
}
