const roomId = localStorage.getItem("admin_room_id");

if (!roomId) {
    alert("No room selected. Go back to Admin Room.");
    window.location.href = "admin_room.php";
}

let autoTimer = null;
let countdown = 10;

// ── FETCH ─────────────────────────────────────────────────────
async function loadProgress() {
    document.getElementById("roomTitle").textContent = "Loading...";

    try {
        const [progressRes, elimRes] = await Promise.all([
            fetch(`../api/get_room_progress.php?room_id=${roomId}&_=${Date.now()}`),
            fetch(`../api/get_elimination_config.php?room_id=${roomId}&_=${Date.now()}`)
        ]);

        const progressText = await progressRes.text();
        const elimText     = await elimRes.text();

        let data, elim;
        try { data = JSON.parse(progressText); }
        catch(e) { showError("Invalid JSON from progress API."); return; }
        try { elim = JSON.parse(elimText); }
        catch(e) { elim = { free_clues: 3, eliminated_teams: {}, elim_events: {} }; }

        if (data.error) { showError(data.error); return; }

        render(data, elim);

    } catch(err) {
        showError("Could not reach API: " + err.message);
    }
}

function showError(msg) {
    document.getElementById("roomTitle").textContent = "Error";
    document.getElementById("leaderboard").innerHTML = `<div class="empty-msg" style="color:#ef4444">${msg}</div>`;
    document.getElementById("matrixWrap").innerHTML  = `<div class="loading-msg" style="color:#ef4444">${msg}</div>`;
    document.getElementById("elimTimeline").innerHTML = `<div class="loading-msg" style="color:#ef4444">${msg}</div>`;
}

// ── RENDER ────────────────────────────────────────────────────
function render(data, elim) {
    document.getElementById("roomTitle").textContent = data.room.room_name;
    renderStats(data, elim);
    renderTimeline(data, elim);
    renderLeaderboard(data, elim);
    renderMatrix(data, elim);
}

// ── STATS ─────────────────────────────────────────────────────
function renderStats(data, elim) {
    const teams     = data.teams;
    const total     = teams.length;
    const active    = teams.filter(t => t.status === "active").length;
    const finished  = teams.filter(t => t.status === "finished").length;
    const waiting   = teams.filter(t => t.status === "waiting").length;
    const elimCount = Object.keys(elim.eliminated_teams || {}).length;
    const alive     = total - elimCount;

    document.getElementById("statTotal").textContent   = total;
    document.getElementById("statActive").textContent  = active;
    document.getElementById("statFinished").textContent= finished;
    document.getElementById("statWaiting").textContent = waiting;
    document.getElementById("statElim").textContent    = elimCount;
    document.getElementById("statAlive").textContent   = alive;
}

// ── ELIMINATION TIMELINE ──────────────────────────────────────
function renderTimeline(data, elim) {
    const tl         = document.getElementById("elimTimeline");
    const infoBar    = document.getElementById("elimInfoBar");
    const questions  = data.questions;
    const teams      = data.teams;
    const freeClues  = elim.free_clues ?? 3;
    const elimEvents = elim.elim_events ?? {};     // clue_order(str) => team_id
    const elimTeams  = elim.eliminated_teams ?? {}; // team_id(str) => clue_order

    // Build team lookup: id => name
    const teamNames = {};
    teams.forEach(t => { teamNames[t.team_id] = t.team_name; });

    // Info bar
    const elimCount = Object.keys(elimTeams).length;
    const alive     = teams.length - elimCount;
    infoBar.textContent = `Free zone: Clues 1–${freeClues} · ${elimCount} team${elimCount !== 1 ? "s" : ""} eliminated · ${alive} still racing`;

    if (!questions.length) {
        tl.innerHTML = `<div class="loading-msg">No clues yet.</div>`;
        return;
    }

    tl.innerHTML = "";

    // Track how many teams are still in at each point
    let teamsLeft = teams.length;

    questions.forEach(q => {
        const isFree  = q.question_order <= freeClues;
        const qordStr = String(q.question_order);
        const elimTeamId = elimEvents[qordStr]; // team eliminated at this clue (or undefined)

        if (!isFree && elimTeamId !== undefined) teamsLeft--;

        const row = document.createElement("div");
        row.className = `tl-row ${isFree ? "tl-free" : "tl-elim"}`;

        // Left: clue number + tag
        const tag = isFree
            ? `<span class="tl-tag tag-free">FREE</span>`
            : `<span class="tl-tag tag-elim">ELIM</span>`;

        // Middle: clue text + eliminated team info
        let middleContent = `<div class="tl-clue-text" title="${escapeHtml(q.question_text)}">${escapeHtml(q.question_text)}</div>`;

        if (!isFree) {
            if (elimTeamId !== undefined) {
                // Get scan time of the eliminated team for this clue
                const elimTeam   = teams.find(t => t.team_id === elimTeamId);
                const clueRecord = elimTeam?.completed_clues?.find(c => c.question_order === q.question_order);
                const scanTime   = clueRecord?.scanned_at ? formatTime(clueRecord.scanned_at) : "";

                middleContent += `
                    <div class="tl-eliminated-team">
                        <span class="tl-skull">💀</span>
                        <span class="tl-team-name">${escapeHtml(teamNames[elimTeamId] ?? "Unknown")}</span>
                        <span class="tl-scan-time">${scanTime ? "last at " + scanTime : ""}</span>
                    </div>`;
            } else {
                // Check if any team has scanned this clue yet
                const anyScanned = teams.some(t =>
                    t.completed_clues.some(c => c.question_order === q.question_order)
                );
                // Count how many teams scanned this clue
                const scannedCount = teams.filter(t =>
                    t.completed_clues.some(c => c.question_order === q.question_order)
                ).length;

                if (!anyScanned) {
                    middleContent += `<div class="tl-pending">Not reached yet</div>`;
                } else if (scannedCount < 2) {
                    middleContent += `<div class="tl-pending">Waiting for more teams…</div>`;
                } else {
                    middleContent += `<div class="tl-tie">🤝 Tie — no elimination this clue</div>`;
                }
            }
        }

        // Right: teams left after this clue
        const teamsLeftNow = isFree ? teams.length : teamsLeft;
        const rightClass   = teamsLeftNow <= 3 ? "danger" : teamsLeftNow <= 5 ? "" : "ok";
        const rightLabel   = isFree ? `${teams.length} teams` : `${teamsLeftNow} left`;

        row.innerHTML = `
            <div class="tl-clue-num">
                <span class="clue-num">Q${q.question_order}</span>
                ${tag}
            </div>
            <div class="tl-content">${middleContent}</div>
            <div class="tl-right">
                <span class="tl-teams-left ${rightClass}">${rightLabel}</span>
            </div>
        `;

        tl.appendChild(row);
    });
}

// ── LEADERBOARD ───────────────────────────────────────────────
function renderLeaderboard(data, elim) {
    const container = document.getElementById("leaderboard");
    const teams     = data.teams;
    const elimTeams = elim.eliminated_teams ?? {};

    if (!teams.length) {
        container.innerHTML = `<div class="empty-msg">No teams in this room yet.</div>`;
        return;
    }

    container.innerHTML = "";

    // Sort: alive first (by clues desc), then eliminated
    const sorted = [...teams].sort((a, b) => {
        const aElim = elimTeams[a.team_id] !== undefined;
        const bElim = elimTeams[b.team_id] !== undefined;
        if (aElim !== bElim) return aElim ? 1 : -1;
        return b.clues_solved - a.clues_solved;
    });

    sorted.forEach((team, index) => {
        const rank       = index + 1;
        const eliminated = elimTeams[String(team.team_id)] !== undefined;
        const elimAtClue = elimTeams[String(team.team_id)];

        const pct       = team.total_clues > 0 ? (team.clues_solved / team.total_clues) * 100 : 0;
        const rankCls   = !eliminated && rank <= 3 ? `rank-${rank}` : "";
        const medals    = ["🥇","🥈","🥉"];
        const rankEmoji = eliminated ? "💀" : (rank <= 3 ? medals[rank-1] : `#${rank}`);

        const pillCls   = eliminated ? "pill-eliminated" : `pill-${team.status}`;
        const fillCls   = eliminated ? "fill-eliminated" : `fill-${team.status}`;
        const statusLbl = eliminated ? "Eliminated"
            : (team.status.charAt(0).toUpperCase() + team.status.slice(1));

        const membersStr = team.members.length
            ? team.members.map(m => escapeHtml(m)).join(", ")
            : "No members";

        // Find which clues were the "last scan" for this team
        const lastScanClues = new Set(
            Object.entries(elim.elim_events ?? {})
                .filter(([, tid]) => tid === team.team_id)
                .map(([ord]) => parseInt(ord))
        );

        const historyRows = team.completed_clues.length
            ? team.completed_clues.map(c => {
                const isLast = lastScanClues.has(c.question_order);
                return `
                <div class="scan-row">
                  <div class="scan-dot${isLast ? " dot-last" : ""}"></div>
                  <div class="scan-clue">
                    Clue ${c.question_order}: ${escapeHtml(c.question_text)}
                    ${isLast ? '<span style="color:#f87171;font-size:10px"> ← last scan</span>' : ""}
                  </div>
                  <div class="scan-time">${c.scanned_at ? formatTime(c.scanned_at) : "–"}</div>
                </div>`;
              }).join("")
            : `<div style="color:var(--muted);font-size:12px;padding:6px 0">No clues scanned yet</div>`;

        const elimBadge = eliminated
            ? `<div class="elim-badge">☠️ Eliminated at Clue ${elimAtClue} — last team to scan</div>`
            : "";

        const card = document.createElement("div");
        card.className = `team-card ${rankCls}${eliminated ? " team-eliminated" : ""}`;
        card.innerHTML = `
            <div class="team-row">
                <div class="rank-badge ${!eliminated && rank > 3 ? "other" : ""}">${rankEmoji}</div>
                <div class="team-info">
                    <div class="team-name${eliminated ? " elim-name" : ""}">${escapeHtml(team.team_name)}</div>
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

            ${elimBadge}

            <div class="history-toggle" onclick="toggleHistory(this)">
                ▶ Scan history (${team.completed_clues.length} / ${team.total_clues})
            </div>
            <div class="scan-history">${historyRows}</div>
        `;

        container.appendChild(card);
    });
}

// ── MATRIX ────────────────────────────────────────────────────
function renderMatrix(data, elim) {
    const wrap       = document.getElementById("matrixWrap");
    const teams      = data.teams;
    const questions  = data.questions;
    const freeClues  = elim.free_clues ?? 3;
    const elimEvents = elim.elim_events ?? {};
    const elimTeams  = elim.eliminated_teams ?? {};

    if (!teams.length || !questions.length) {
        wrap.innerHTML = `<div class="empty-msg">No data to display yet.</div>`;
        return;
    }

    const completedSet = {};
    teams.forEach(t => {
        completedSet[t.team_id] = {};
        t.completed_clues.forEach(c => {
            completedSet[t.team_id][c.question_id] = { ts: c.scanned_at, order: c.question_order };
        });
    });

    // Sort: alive first then eliminated
    const sortedTeams = [...teams].sort((a, b) => {
        const aE = elimTeams[a.team_id] !== undefined;
        const bE = elimTeams[b.team_id] !== undefined;
        if (aE !== bE) return aE ? 1 : -1;
        return b.clues_solved - a.clues_solved;
    });

    let html = `<table class="matrix-table"><thead><tr>
        <th>Clue</th>
        ${sortedTeams.map(t => {
            const isElim = elimTeams[String(t.team_id)] !== undefined;
            return `<th class="${isElim ? "col-eliminated" : ""}" title="${escapeHtml(t.team_name)}">
                ${escapeHtml(t.team_name.length > 9 ? t.team_name.slice(0,9)+"…" : t.team_name)}
                ${isElim ? "💀" : ""}
            </th>`;
        }).join("")}
    </tr></thead><tbody>`;

    questions.forEach(q => {
        const isFree   = q.question_order <= freeClues;
        const qordStr  = String(q.question_order);
        const elimTid  = elimEvents[qordStr]; // team_id of eliminated team at this clue

        const rowClass = isFree ? "row-free" : "row-elim";

        const freeTag = isFree  ? `<span class="zone-tag tag-free">FREE</span>` : "";
        const lastTag = !isFree && elimTid !== undefined ? `<span class="zone-tag tag-last">✂ LAST</span>` : "";

        html += `<tr class="${rowClass}">
            <td>
                <div class="clue-col">
                    Q${q.question_order} ${freeTag}${lastTag}
                </div>
                <div style="font-size:11px;color:var(--dim);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                     title="${escapeHtml(q.question_text)}">${escapeHtml(q.question_text)}</div>
            </td>`;

        sortedTeams.forEach(team => {
            const entry   = completedSet[team.team_id]?.[q.id];
            const isElim  = elimTeams[String(team.team_id)] !== undefined;
            const elimAt  = elimTeams[String(team.team_id)];
            // Was this team the last scanner on this clue?
            const wasLast = !isFree && elimTid === team.team_id;
            // Is team already eliminated before this clue?
            const blockedHere = isElim && elimAt < q.question_order;

            if (entry) {
                if (wasLast) {
                    html += `<td><span class="cell-last" title="LAST — Eliminated">✕</span></td>`;
                } else {
                    html += `<td><span class="cell-done" title="Scanned ${formatTime(entry.ts)}">✓</span></td>`;
                }
            } else if (blockedHere) {
                html += `<td><span class="cell-elim" title="Eliminated">–</span></td>`;
            } else {
                html += `<td><span class="cell-empty">·</span></td>`;
            }
        });

        html += `</tr>`;

        // Separator after each elimination clue where someone was eliminated
        if (!isFree && elimTid !== undefined) {
            const elimName = teams.find(t => t.team_id === elimTid)?.team_name ?? "Unknown";
            html += `<tr class="elim-sep">
                <td colspan="${sortedTeams.length + 1}">
                    <div class="elim-sep-label">☠️ ${escapeHtml(elimName)} eliminated — last to scan Clue ${q.question_order}</div>
                </td>
            </tr>`;
        }
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
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function formatTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return isNaN(d) ? ts : d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" });
}

loadProgress();
startCountdown();