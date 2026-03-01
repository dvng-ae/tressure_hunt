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
<title>Manage Clues – Treasure Hunt</title>
<link rel="stylesheet" href="questions.css">
<script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
</head>
<body>

<div class="page-header">
  <a href="admin_room.php" class="back-btn">← Back</a>
  <h2>📋 Manage Clues</h2>
</div>

<!-- ADD CLUE -->
<div class="add-section">
  <textarea id="questionInput" placeholder="Enter clue text…" rows="3"></textarea>
  <button class="add-btn" onclick="addQuestion()">＋ Add Clue</button>
</div>

<div class="section-label">Clues</div>

<div id="questionList"></div>

<script>
const roomId = localStorage.getItem("admin_room_id");

if (!roomId) {
  alert("Room not selected");
  window.location.href = "admin_room.php";
}

function addQuestion() {
  const question = document.getElementById("questionInput").value.trim();
  if (!question) { alert("Enter a clue"); return; }

  fetch("../api/add_question.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `room_id=${roomId}&question=${encodeURIComponent(question)}`
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      document.getElementById("questionInput").value = "";
      loadQuestions();
    } else {
      alert("Failed to add clue");
    }
  });
}

function loadQuestions() {
  fetch(`../api/get_questions.php?room_id=${roomId}`)
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById("questionList");
    list.innerHTML = "";

    if (!data.length) {
      list.innerHTML = `<p style="color:var(--muted);text-align:center;padding:32px 0">No clues yet. Add your first one above!</p>`;
      return;
    }

    data.forEach(q => {
      const div = document.createElement("div");
      div.className = "qcard";
      div.innerHTML = `
        <div class="question-row">
          <div class="question-left">${escapeHtml(q.question_text)}</div>
          <div class="question-right">
            <canvas id="qr-${q.id}"></canvas>
            <div class="qr-buttons">
              <button class="btn-download" onclick="downloadQR('${escapeHtml(q.qr_code)}')">⬇ QR</button>
              <button class="btn-delete" onclick="deleteQuestion(${q.id})">🗑 Del</button>
            </div>
          </div>
        </div>
      `;
      list.appendChild(div);

      QRCode.toCanvas(document.getElementById("qr-" + q.id), q.qr_code, { width: 120 });
    });
  });
}

function deleteQuestion(id) {
  if (!confirm("Delete this clue?")) return;
  fetch("../api/delete_question.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `id=${id}`
  }).then(loadQuestions);
}

function downloadQR(code) {
  const canvas = document.createElement("canvas");
  QRCode.toCanvas(canvas, code, { width: 300 }, () => {
    const link = document.createElement("a");
    link.download = `clue-${code}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

loadQuestions();
</script>

</body>
</html>