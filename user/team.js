const roomId = localStorage.getItem("joinedRoomId");

if (!roomId) {
  alert("No room selected");
  window.location.href = "room.html";
}

const teamList      = document.getElementById("teamList");
const createTeamBtn = document.getElementById("createTeamBtn");
const teamNameInput = document.getElementById("teamNameInput");
const createRow     = document.getElementById("createRow");

// ── CREATE ────────────────────────────────────────────────────
createTeamBtn.onclick = () => {
  const name = teamNameInput.value.trim();
  if (!name) { alert("Please enter a team name"); return; }

  createTeamBtn.textContent = "…";
  createTeamBtn.disabled = true;

  fetch("../api/create_team.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `room_id=${roomId}&team_name=${encodeURIComponent(name)}`
  })
  .then(res => res.json())
  .then(data => {
    createTeamBtn.textContent = "+ Create";
    createTeamBtn.disabled = false;
    if (data.error) { alert(data.error); return; }
    teamNameInput.value = "";
    if (data.team_id) localStorage.setItem("teamId", data.team_id);
    loadTeams();
  })
  .catch(() => {
    createTeamBtn.textContent = "+ Create";
    createTeamBtn.disabled = false;
    alert("Failed to create team");
  });
};

// ── JOIN ──────────────────────────────────────────────────────
function joinTeam(teamId) {
  fetch("../api/join_team.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `team_id=${teamId}`
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) { alert(data.error); return; }
    localStorage.setItem("teamId", data.team_id);
    loadTeams();
  });
}

// ── LEAVE ─────────────────────────────────────────────────────
function leaveTeam(teamId) {
  fetch("../api/leave_team.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `team_id=${teamId}`
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) { alert(data.error); return; }
    if (localStorage.getItem("teamId") == teamId) localStorage.removeItem("teamId");
    loadTeams();
  });
}

// ── DELETE ────────────────────────────────────────────────────
function deleteTeam(teamId) {
  if (!confirm("Delete this team? This cannot be undone.")) return;
  fetch("../api/delete_team.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `team_id=${teamId}`
  })
  .then(res => res.json())
  .then(() => {
    localStorage.removeItem("teamId");
    loadTeams();
  });
}

// ── LOAD ──────────────────────────────────────────────────────
function loadTeams() {
  fetch(`../api/get_teams.php?room_id=${roomId}&_=${Date.now()}`)
  .then(res => res.json())
  .then(data => {

    if (!data.current_user_id) {
      alert("Session expired. Please log in again.");
      window.location.href = "../index.php";
      return;
    }

    const me    = parseInt(data.current_user_id);
    const teams = data.teams || [];

    const myTeam = teams.find(t => t.members.some(m => parseInt(m.id) === me));

    // Show/hide create row
    createRow.style.display = myTeam ? "none" : "flex";

    // Player count
    const totalMembers = teams.reduce((s, t) => s + t.members.length, 0);
    document.getElementById("playerCount").textContent = `${totalMembers} player${totalMembers !== 1 ? "s" : ""}`;

    teamList.innerHTML = "";

    if (!teams.length) {
      teamList.innerHTML = `<p style="color:var(--muted);text-align:center;padding:32px 0;font-size:14px">No teams yet — be the first to create one!</p>`;
      return;
    }

    teams.forEach(team => {
      const leaderId = parseInt(team.leader_id);
      const isLeader = leaderId === me;
      const isMember = team.members.some(m => parseInt(m.id) === me);

      const div = document.createElement("div");
      div.className = "team" + (isMember ? " my-team" : "");

      // Member chips
      const memberHtml = team.members.length
        ? team.members.map(m => {
            const isThisLeader = parseInt(m.id) === leaderId;
            return `<span class="member${isThisLeader ? " leader" : ""}">
              ${isThisLeader ? "👑 " : ""}${escapeHtml(m.username)}
            </span>`;
          }).join("")
        : `<span class="no-members">No members yet</span>`;

      div.innerHTML = `
        <div class="team-header">
          <span class="team-name-text">${escapeHtml(team.team_name)}</span>
          <span class="team-count">${team.members.length} member${team.members.length !== 1 ? "s" : ""}</span>
        </div>
        <div class="members">${memberHtml}</div>
        <div class="team-actions"></div>
      `;

      const actions = div.querySelector(".team-actions");

      if (isLeader) {
        const del = document.createElement("button");
        del.textContent = "🗑 Delete";
        del.className = "btn-delete";
        del.onclick = () => deleteTeam(team.id);
        actions.appendChild(del);

        const start = document.createElement("button");
        start.textContent = "▶ Start Hunt";
        start.className = "btn-start";
        start.onclick = () => {
          localStorage.setItem("teamId", team.id);
          window.location.href = "scanner.html";
        };
        actions.appendChild(start);

      } else if (isMember) {
        const leave = document.createElement("button");
        leave.textContent = "Leave";
        leave.className = "btn-leave";
        leave.onclick = () => leaveTeam(team.id);
        actions.appendChild(leave);

      } else if (!myTeam) {
        const join = document.createElement("button");
        join.textContent = "Join Team";
        join.className = "btn-join";
        join.onclick = () => joinTeam(team.id);
        actions.appendChild(join);
      }

      teamList.appendChild(div);
    });
  })
  .catch(() => {
    teamList.innerHTML = `<p style="color:#e74c3c;text-align:center;padding:20px">Failed to load teams. Pull to refresh.</p>`;
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

loadTeams();