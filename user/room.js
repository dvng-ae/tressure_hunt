window.addEventListener("load", loadRooms);

function loadRooms() {
    fetch("../api/get_rooms.php")
        .then(res => res.json())
        .then(rooms => {
            const container = document.getElementById("roomsContainer");
            const count     = document.getElementById("roomCount");

            container.innerHTML = "";

            if (!rooms || rooms.length === 0) {
                container.innerHTML = `<div class="empty-state">🔍 No rooms available yet.<br>Check back soon!</div>`;
                count.textContent = "";
                return;
            }

            rooms.forEach(room => {
                const div = document.createElement("div");
                div.className = "room";
                div.innerHTML = `
                    <span class="room-name">${escapeHtml(room.room_name)}</span>
                    <span class="room-arrow">›</span>
                `;
                div.onclick = () => {
                    localStorage.setItem("joinedRoomId", room.id);
                    window.location.href = "team.html";
                };
                container.appendChild(div);
            });

            count.textContent = `${rooms.length} room${rooms.length !== 1 ? "s" : ""} available`;
        })
        .catch(() => {
            document.getElementById("roomsContainer").innerHTML =
                `<div class="empty-state" style="color:#e74c3c">Failed to load rooms. Please try again.</div>`;
        });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;");
}