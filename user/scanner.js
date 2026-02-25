// Get team_id from localStorage (set when user clicked Start on team page)
const teamId = localStorage.getItem("teamId");
const roomId = localStorage.getItem("joinedRoomId");

if (!teamId) {
    alert("No team selected. Go back and start from your team.");
    window.location.href = "team.html";
}

let scanner      = null;
let lastScanned  = "";
let scanCooldown = false;

const statusText     = document.getElementById("status");
const progressText   = document.getElementById("progress");
const cluesContainer = document.getElementById("cluesContainer");
const currentClueBox = document.getElementById("currentClue");

// ── LOAD CLUES STATUS (per team) ─────────────────────────────
function loadClues() {
    fetch(`../api/get_clues_progress.php?team_id=${teamId}&_=${Date.now()}`)
    .then(res => res.json())
    .then(data => {
        let html      = "";
        let completed = 0;
        const total   = data.length;

        data.forEach(clue => {
            if (clue.completed == 1) {
                html += `<div style="color:#3ddc84">✔ ${escapeHtml(clue.question_text)}</div>`;
                completed++;
            } else {
                html += `<div style="opacity:0.4">🔒 Locked</div>`;
            }
        });

        cluesContainer.innerHTML = html || "<div style='opacity:0.5'>No clues yet</div>";
        progressText.innerHTML   = `${completed} / ${total} completed`;
    })
    .catch(() => {
        cluesContainer.innerHTML = "<div style='color:red'>Failed to load clues</div>";
    });
}

// ── ON QR SCANNED ─────────────────────────────────────────────
function onScanSuccess(decodedText) {

    // Prevent firing multiple times for same QR
    if (scanCooldown || decodedText === lastScanned) return;
    scanCooldown = true;
    lastScanned  = decodedText;
    setTimeout(() => { scanCooldown = false; }, 3000);

    statusText.innerHTML = "Checking clue...";

    fetch("../api/scan_qr.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            qr_code: decodedText,
            team_id: parseInt(teamId)
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            statusText.innerHTML     = "✔ Clue found!";
            currentClueBox.innerHTML = "📍 " + escapeHtml(data.clue);
            progressText.innerHTML   = `${data.completed} / ${data.total} completed`;

            if (data.completed === data.total) {
                statusText.innerHTML = "🎉 All clues found! Quest complete!";
            }

            loadClues();
        } else {
            statusText.innerHTML = "Scanner running";
            alert(data.message);
        }
    })
    .catch(() => {
        statusText.innerHTML = "Scanner running";
        alert("Server error — try again");
    });
}

// ── START SCANNER ─────────────────────────────────────────────
document.getElementById("startBtn").onclick = function () {
    if (scanner) return;
    scanner = new Html5Qrcode("reader");
    scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        onScanSuccess
    );
    statusText.innerHTML = "Scanner running";
};

// ── STOP SCANNER ──────────────────────────────────────────────
document.getElementById("stopBtn").onclick = function () {
    if (scanner) {
        scanner.stop().then(() => {
            scanner = null;
            statusText.innerHTML = "Scanner stopped";
        });
    }
};

// ── HELPER ────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Load clues on page open
loadClues();