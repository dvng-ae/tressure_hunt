const teamId   = localStorage.getItem("teamId");
const roomId   = localStorage.getItem("joinedRoomId");
const teamName = localStorage.getItem("teamName") || "Your Team";

if (!teamId) {
    alert("No team selected. Go back and start from your team.");
    window.location.href = "team.html";
}

let scanner = null, lastScanned = "", scanCooldown = false, isEliminated = false;

const statusText     = document.getElementById("status");
const progressText   = document.getElementById("progress");
const progressFill   = document.getElementById("progressFill");
const cluesContainer = document.getElementById("cluesContainer");
const currentClueBox = document.getElementById("currentClue");
const elimOverlay    = document.getElementById("eliminatedOverlay");
const winnerOverlay  = document.getElementById("winnerOverlay");
const elimToast      = document.getElementById("elimToast");

// ── WINNER FIREWORKS ──────────────────────────────────────────
function showWinner(completed, total) {
    document.getElementById("winnerTeamName").textContent = teamName;
    document.getElementById("winnerScore").textContent    = completed + " / " + total + " clues completed";
    winnerOverlay.classList.add("show");
    startFireworks();
}

function startFireworks() {
    const canvas = document.getElementById("fireworksCanvas");
    const ctx    = canvas.getContext("2d");
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    window.addEventListener("resize", () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

    const colors = ["#f7c600","#fde68a","#ffffff","#ff6b6b","#4ade80","#60a5fa","#f472b6","#fb923c"];
    const particles = [];

    function Particle(x, y) {
        this.x = x; this.y = y;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.vx    = (Math.random() - 0.5) * 10;
        this.vy    = (Math.random() - 0.5) * 10 - 3;
        this.alpha = 1; this.radius = Math.random() * 4 + 2;
        this.decay = Math.random() * 0.015 + 0.008;
    }

    function burst(x, y) {
        for (let i = 0; i < 70; i++) particles.push(new Particle(x, y));
    }

    const W = canvas.width, H = canvas.height;
    burst(W*0.3, H*0.3); burst(W*0.7, H*0.3); burst(W*0.5, H*0.5);
    setTimeout(()=>burst(W*0.2, H*0.4), 400);
    setTimeout(()=>burst(W*0.8, H*0.4), 700);
    setTimeout(()=>burst(W*0.5, H*0.25), 1000);

    const iv = setInterval(()=>burst(Math.random()*W, Math.random()*H*0.6), 1200);
    setTimeout(()=>clearInterval(iv), 12000);

    (function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.98; p.alpha -= p.decay;
            if (p.alpha <= 0) { particles.splice(i, 1); continue; }
            ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill(); ctx.restore();
        }
        requestAnimationFrame(loop);
    })();
}

// ── ELIMINATED ────────────────────────────────────────────────
function showEliminatedOverlay(clueOrder, cluesDone) {
    isEliminated = true;
    if (scanner) scanner.stop().catch(()=>{}).finally(()=>{ scanner=null; });
    document.getElementById("elimClueInfo").textContent = "Eliminated at Clue " + clueOrder;
    document.getElementById("elimScore").textContent    = cluesDone ?? "–";
    elimOverlay.classList.add("show");
}

function showJustEliminatedToast(clueOrder, cluesDone) {
    elimToast.style.display = "block";
    setTimeout(() => { elimToast.style.display="none"; showEliminatedOverlay(clueOrder, cluesDone); }, 1800);
}

// ── PROGRESS ──────────────────────────────────────────────────
function setProgress(done, total) {
    progressText.textContent = done + " / " + total + " completed";
    progressFill.style.width = total > 0 ? (done/total*100) + "%" : "0%";
}

// ── LOAD CLUES ────────────────────────────────────────────────
function loadClues() {
    fetch("../api/get_clues_progress.php?team_id=" + teamId + "&_=" + Date.now())
    .then(r=>r.json()).then(data => {
        let done = 0; cluesContainer.innerHTML = "";
        if (!data.length) {
            cluesContainer.innerHTML = '<div class="clue-item locked"><span class="clue-icon">🔒</span><span>No clues found</span></div>';
            return;
        }
        data.forEach(clue => {
            const el = document.createElement("div");
            if (clue.completed == 1) {
                el.className = "clue-item done";
                el.innerHTML = '<span class="clue-icon">✅</span><span>' + escapeHtml(clue.question_text) + '</span>';
                done++;
            } else {
                el.className = "clue-item locked";
                el.innerHTML = '<span class="clue-icon">🔒</span><span>Locked</span>';
            }
            cluesContainer.appendChild(el);
        });
        setProgress(done, data.length);
        checkElimStatus(done);
    }).catch(() => {
        cluesContainer.innerHTML = '<div style="color:#ef4444">Failed to load clues</div>';
    });
}

function checkElimStatus(cluesDone) {
    if (!roomId) return;
    fetch("../api/get_elimination_config.php?room_id=" + roomId + "&_=" + Date.now())
    .then(r=>r.json()).then(data => {
        if (!data || !data.eliminated_teams) return;
        const elimAt = data.eliminated_teams[String(teamId)];
        if (elimAt !== undefined) showEliminatedOverlay(elimAt, cluesDone);
    }).catch(()=>{});
}

// ── SCAN ──────────────────────────────────────────────────────
function onScanSuccess(decodedText) {
    if (isEliminated || scanCooldown || decodedText === lastScanned) return;
    scanCooldown = true; lastScanned = decodedText;
    setTimeout(() => { scanCooldown = false; }, 3000);
    statusText.textContent = "⏳ Checking clue…";

    fetch("../api/scan_qr.php", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ qr_code: decodedText, team_id: parseInt(teamId) })
    }).then(r=>r.json()).then(data => {

        if (!data.success && data.eliminated) {
            const m = data.message.match(/Clue (\d+)/);
            showEliminatedOverlay(m?.[1] ?? "?", 0);
            return;
        }
        if (!data.success) { statusText.textContent = "⚠️ " + data.message; return; }

        statusText.textContent     = "✅ Clue found!";
        currentClueBox.textContent = "📍 " + data.clue;
        setProgress(data.completed, data.total);
        loadClues();

        if (data.is_first_winner) { setTimeout(()=>showWinner(data.completed, data.total), 600); return; }
        if (data.completed === data.total) { statusText.textContent = "🎉 All clues found! Quest complete!"; return; }
        if (data.just_eliminated) showJustEliminatedToast(data.eliminated_at, data.completed);

    }).catch(() => { statusText.textContent = "⚠️ Server error — try again"; });
}

document.getElementById("startBtn").onclick = function() {
    if (isEliminated || scanner) return;
    scanner = new Html5Qrcode("reader");
    scanner.start({ facingMode:"environment" }, { fps:10, qrbox:{width:250,height:250} }, onScanSuccess)
    .then(() => { statusText.textContent = "📷 Scanner running"; })
    .catch(err => { statusText.textContent = "Camera error: " + err; });
};

document.getElementById("stopBtn").onclick = function() {
    if (scanner) scanner.stop().then(() => { scanner=null; statusText.textContent="Scanner stopped"; });
};

function escapeHtml(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

loadClues();