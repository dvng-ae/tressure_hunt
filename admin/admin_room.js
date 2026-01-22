window.onload = renderRooms;

function getRooms() {
  return JSON.parse(localStorage.getItem("rooms")) || [];
}

function saveRooms(rooms) {
  localStorage.setItem("rooms", JSON.stringify(rooms));
}

function createRoom() {
  const input = document.getElementById("roomInput");
  const roomName = input.value.trim();
  if (roomName === "") return;

  const rooms = getRooms();
  rooms.push(roomName);
  saveRooms(rooms);

  input.value = "";
  renderRooms();
}

function deleteRoom(index) {
  const rooms = getRooms();
  rooms.splice(index, 1);
  saveRooms(rooms);
  renderRooms();
}

function renderRooms() {
  const container = document.getElementById("roomsContainer");
  container.innerHTML = "";

  const rooms = getRooms();
  rooms.forEach((room, index) => {
    const div = document.createElement("div");
    div.className = "room";

    const name = document.createElement("span");
    name.textContent = room;

    const del = document.createElement("span");
    del.textContent = "✖";
    del.className = "delete-btn";
    del.onclick = () => deleteRoom(index);

    div.appendChild(name);
    div.appendChild(del);
    container.appendChild(div);
  });
}
