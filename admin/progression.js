// room_id set by admin_room.php when clicking Progression button
const roomId = localStorage.getItem("admin_room_id");

if (!roomId) {
    alert("No room selected. Go back to Admin Room.");
    window.location.href = "admin_room.php";
}

let autoTimer  = null;
let countdown  = 10;

// ── FETCH ─────────────────────────────────────────────────────
async function loadProgress() {
    document.getElementById("roomTitle").textContent = "Loading...";

    try {
        // progression.html is in /admin/, API is in /api/
        const res  = await fetch(`../api/get_room_progress.php?room_id=${roomId}&_=${Date.now()}`);
        const text = await res.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch(e) {
            console.error("Invalid JSON from API:", text);
            showError("Server returned invalid response. Check console.");
            return;
        }

        if (data.error) {
            showError(data.error);
            return;
        }

        render(data);

    } catch (err) {
        showError("Could not reach API: " + err.message);
    }
}

function showError(msg) {
    document.getElementById("roomTitle").textContent  = "Error";
    document.getElementById("leaderboard").innerHTML  = `<div class="empty-msg" style="color:#ef4444">${msg}</div>`;
    document.getElementById("matrixWrap").innerHTML   = `<div class="loading-msg" style="color:#ef4444">${msg}</div>`;
}

// ── RENDER ────────────────────────────────────────────────────
function render(data) {
    document.getElementById("roomTitle").textContent = data.room.room_name;
    renderStats(data);
    renderLeaderboard(data);
    renderMatrix(data);
}

// ── STATS ─────────────────────────────────────────────────────
function renderStats(data) {
    const teams    = data.teams;
    const total    = teams.length;
    const active   = teams.filter(t => t.status === "active").length;
    const finished = teams.filter(t => t.status === "finished").length;
    const waiting  = teams.filter(t => t.status === "waiting").length;
    const avg      = total === 0 ? 0 :
        teams.reduce((s, t) => s + (t.total_clues > 0 ? t.clues_solved / t.total_clues : 0), 0) / total;

    document.getElementById("statTotal").textContent    = total;
    document.getElementById("statActive").textContent   = active;
    document.getElementById("statFinished").textContent = finished;
    document.getElementById("statWaiting").textContent  = waiting;
    document.getElementById("statAvg").textContent      = Math.round(avg * 100) + "%";
}

// ── LEADERBOARD ───────────────────────────────────────────────
function renderLeaderboard(data) {
    const container = document.getElementById("leaderboard");
    const teams     = data.teams;

    if (!teams.length) {
        container.innerHTML = `<div class="empty-msg">No teams in this room yet.</div>`;
        return;
    }

    container.innerHTML = "";

    teams.forEach((team, index) => {
        const rank    = index + 1;
        const pct     = team.total_clues > 0 ? (team.clues_solved / team.total_clues) * 100 : 0;
        const rankCls = rank <= 3 ? `rank-${rank}` : "";
        const medals  = ["🥇","🥈","🥉"];
        const rankEmoji = rank <= 3 ? medals[rank-1] : `#${rank}`;

        const pillCls   = `pill-${team.status}`;
        const fillCls   = `fill-${team.status}`;
        const statusLbl = team.status.charAt(0).toUpperCase() + team.status.slice(1);

        const membersStr = team.members.length
            ? team.members.map(m => escapeHtml(m)).join(", ")
            : "No members";

        const historyRows = team.completed_clues.length
            ? team.completed_clues.map(c => `
                <div class="scan-row">
                  <div class="scan-dot"></div>
                  <div class="scan-clue">Clue ${c.question_order}: ${escapeHtml(c.question_text)}</div>
                  <div class="scan-time">${c.scanned_at ? formatTime(c.scanned_at) : "–"}</div>
                </div>`).join("")
            : `<div style="color:var(--muted);font-size:12px;padding:6px 0">No clues scanned yet</div>`;

        const card = document.createElement("div");
        card.className = `team-card ${rankCls}`;
        card.innerHTML = `
            <div class="team-row">
                <div class="rank-badge ${rank > 3 ? 'other' : ''}">${rankEmoji}</div>
                <div class="team-info">
                    <div class="team-name">${escapeHtml(team.team_name)}</div>
                    <div class="team-members">👥 ${membersStr}</div>
                </div>
                <div class="team-score">
                    <div>
                        <span class="score-num">${team.clues_solved}</span>
                        <span class="score-denom"> / ${team.total_clues}</span>
                    </div>
                    <div><span class="status-pill ${pillCls}">${statusLbl}</span></div>
                </div>
            </div>

            <div class="progress-track">
                <div class="progress-fill ${fillCls}" style="width:${pct}%"></div>
            </div>

            <div class="history-toggle" onclick="toggleHistory(this)">
                ▶ Scan history (${team.completed_clues.length} / ${team.total_clues})
            </div>
            <div class="scan-history">${historyRows}</div>
        `;

        container.appendChild(card);
    });
}

// ── MATRIX ────────────────────────────────────────────────────
function renderMatrix(data) {
    const wrap      = document.getElementById("matrixWrap");
    const teams     = data.teams;
    const questions = data.questions;

    if (!teams.length || !questions.length) {
        wrap.innerHTML = `<div class="empty-msg">No data to display yet.</div>`;
        return;
    }

    // Build lookup: completedSet[team_id][question_id] = scanned_at
    const completedSet = {};
    teams.forEach(team => {
        completedSet[team.team_id] = {};
        team.completed_clues.forEach(c => {
            completedSet[team.team_id][c.question_id] = c.scanned_at;
        });
    });

    let html = `<table class="matrix-table"><thead><tr>
        <th>Clue</th>
        ${teams.map(t => `<th title="${escapeHtml(t.team_name)}">${escapeHtml(t.team_name.length > 10 ? t.team_name.slice(0,10)+"…" : t.team_name)}</th>`).join("")}
    </tr></thead><tbody>`;

    questions.forEach(q => {
        html += `<tr>
            <td>
                <div class="clue-col">Q${q.question_order}</div>
                <div style="font-size:12px;color:var(--dim);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                     title="${escapeHtml(q.question_text)}">${escapeHtml(q.question_text)}</div>
            </td>`;

        teams.forEach(team => {
            const ts = completedSet[team.team_id]?.[q.id];
            html += ts
                ? `<td><span class="cell-done" title="Scanned ${formatTime(ts)}">✓</span></td>`
                : `<td><span class="cell-empty">·</span></td>`;
        });

        html += `</tr>`;
    });

    html += `</tbody></table>`;
    wrap.innerHTML = html;
}

// ── TOGGLE HISTORY ────────────────────────────────────────────
function toggleHistory(btn) {
    const hist = btn.nextElementSibling;
    const open = hist.classList.toggle("open");
    btn.textContent = btn.textContent.replace(open ? "▶" : "▼", open ? "▼" : "▶");
}

// ── AUTO REFRESH ──────────────────────────────────────────────
function startCountdown() {
    clearInterval(autoTimer);
    countdown = 10;
    document.getElementById("countdown").textContent = countdown;

    autoTimer = setInterval(() => {
        countdown--;
        document.getElementById("countdown").textContent = countdown;
        if (countdown <= 0) {
            loadProgress();
            countdown = 10;
            document.getElementById("countdown").textContent = countdown;
        }
    }, 1000);
}

document.getElementById("refreshBtn").onclick = () => {
    loadProgress();
    startCountdown();
};

// ── HELPERS ───────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return isNaN(d) ? ts : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── INIT ──────────────────────────────────────────────────────
loadProgress();
startCountdown();