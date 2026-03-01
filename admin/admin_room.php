<?php
session_start();

if (!isset($_SESSION["admin"])) {
    header("Location: ../index.php");
    exit;
}

include "../api/db.php";
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>Admin – Treasure Hunt</title>
<link rel="stylesheet" href="admin_room.css">
</head>
<body>

<div class="page-header">
  <h1>⚙️ Admin Panel</h1>
</div>

<!-- CREATE ROOM -->
<div class="create-section">
  <input type="text" id="roomName" placeholder="New room name…" maxlength="50">
  <button onclick="createRoom()">+ Room</button>
</div>

<div class="section-label">Active Rooms</div>

<div id="roomList">
<?php
$result = mysqli_query($conn, "SELECT * FROM rooms ORDER BY id DESC");
if (mysqli_num_rows($result) === 0): ?>
  <div class="empty-state">No rooms yet. Create your first room above!</div>
<?php else: while ($row = mysqli_fetch_assoc($result)): ?>

  <div class="room-card">
    <div class="room-name">
      <?php echo htmlspecialchars($row["room_name"], ENT_QUOTES, 'UTF-8'); ?>
    </div>
    <div class="room-actions">
      <button class="btn-manage" onclick="openQuestions(<?php echo (int)$row['id']; ?>)">
        📋 Questions
      </button>
      <button class="btn-progress" onclick="openProgression(<?php echo (int)$row['id']; ?>)">
        📊 Progress
      </button>
    </div>
  </div>

<?php endwhile; endif; ?>
</div>

<script>
function openQuestions(roomId) {
  localStorage.setItem("admin_room_id", roomId);
  window.location.href = "questions.php";
}

function openProgression(roomId) {
  localStorage.setItem("admin_room_id", roomId);
  window.location.href = "progression.html";
}

function createRoom() {
  const roomName = document.getElementById("roomName").value.trim();
  if (!roomName) { alert("Enter a room name"); return; }

  fetch("../api/create_room.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `room_name=${encodeURIComponent(roomName)}`
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) location.reload();
    else alert("Failed to create room");
  });
}
</script>

</body>
</html>