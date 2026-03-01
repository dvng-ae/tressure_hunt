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
const progressFill   = document.getElementById("progressFill");
const cluesContainer = document.getElementById("cluesContainer");
const currentClueBox = document.getElementById("currentClue");

// ── UPDATE PROGRESS BAR ───────────────────────────────────────
function setProgress(completed, total) {
    progressText.textContent = `${completed} / ${total} completed`;
    progressFill.style.width = total > 0 ? `${(completed / total) * 100}%` : "0%";
}

// ── LOAD CLUES STATUS ─────────────────────────────────────────
function loadClues() {
    fetch(`../api/get_clues_progress.php?team_id=${teamId}&_=${Date.now()}`)
    .then(res => res.json())
    .then(data => {
        let completed = 0;
        const total   = data.length;

        cluesContainer.innerHTML = "";

        if (!data.length) {
            cluesContainer.innerHTML = `<div class="clue-item locked"><span class="clue-icon">🔒</span><span>No clues found for this room</span></div>`;
            return;
        }

        data.forEach(clue => {
            const item = document.createElement("div");
            if (clue.completed == 1) {
                item.className = "clue-item done";
                item.innerHTML = `<span class="clue-icon">✅</span><span>${escapeHtml(clue.question_text)}</span>`;
                completed++;
            } else {
                item.className = "clue-item locked";
                item.innerHTML = `<span class="clue-icon">🔒</span><span>Locked</span>`;
            }
            cluesContainer.appendChild(item);
        });

        setProgress(completed, total);
    })
    .catch(() => {
        cluesContainer.innerHTML = `<div class="clue-item" style="color:#e74c3c">Failed to load clues</div>`;
    });
}

// ── ON QR SCANNED ─────────────────────────────────────────────
function onScanSuccess(decodedText) {
    if (scanCooldown || decodedText === lastScanned) return;
    scanCooldown = true;
    lastScanned  = decodedText;
    setTimeout(() => { scanCooldown = false; }, 3000);

    statusText.textContent = "⏳ Checking clue…";

    fetch("../api/scan_qr.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_code: decodedText, team_id: parseInt(teamId) })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            statusText.textContent     = "✅ Clue found!";
            currentClueBox.textContent = "📍 " + data.clue;
            setProgress(data.completed, data.total);

            if (data.completed === data.total) {
                statusText.textContent = "🎉 All clues found! Quest complete!";
            }

            loadClues();
        } else {
            statusText.textContent = "Scanner running";
            alert(data.message);
        }
    })
    .catch(() => {
        statusText.textContent = "Scanner running";
        alert("Server error — try again");
    });
}

// ── START SCANNER ─────────────────────────────────────────────
document.getElementById("startBtn").onclick = function () {
    if (scanner) return;
    scanner = new Html5Qrcode("reader");
    scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess
    ).then(() => {
        statusText.textContent = "📷 Scanner running";
    }).catch(err => {
        statusText.textContent = "Camera error: " + err;
    });
};

// ── STOP SCANNER ──────────────────────────────────────────────
document.getElementById("stopBtn").onclick = function () {
    if (scanner) {
        scanner.stop().then(() => {
            scanner = null;
            statusText.textContent = "Scanner stopped";
        });
    }
};

// ── HELPER ────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

loadClues();