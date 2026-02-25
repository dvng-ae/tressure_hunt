const roomId = localStorage.getItem("joinedRoomId");

if (!roomId) {
  alert("No room selected");
  window.location.href = "room.html";
}

const teamList      = document.getElementById("teamList");
const createTeamBtn = document.getElementById("createTeamBtn");
const teamNameInput = document.getElementById("teamNameInput");
const createRow     = document.querySelector(".create-team");

// ── CREATE ────────────────────────────────────────────────────
createTeamBtn.onclick = () => {
  const name = teamNameInput.value.trim();
  if (!name) { alert("Please enter a team name"); return; }

  fetch("../api/create_team.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `room_id=${roomId}&team_name=${encodeURIComponent(name)}`
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) { alert(data.error); return; }
    teamNameInput.value = "";
    if (data.team_id) localStorage.setItem("teamId", data.team_id);
    loadTeams();
  })
  .catch(() => alert("Failed to create team"));
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
  if (!confirm("Delete this team?")) return;
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

    // Not logged in → go to login
    if (!data.current_user_id) {
      alert("Session expired. Please log in again.");
      window.location.href = "../index.php";
      return;
    }

    const me    = parseInt(data.current_user_id);
    const teams = data.teams || [];

    // Am I already in any team?
    const myTeam = teams.find(t => t.members.some(m => parseInt(m.id) === me));

    // Show/hide create row
    createRow.style.display = myTeam ? "none" : "flex";

    // ── RENDER ────────────────────────────────────────────────
    teamList.innerHTML = "";

    if (!teams.length) {
      teamList.innerHTML = `<p style="color:#aaa;text-align:center;margin-top:20px">No teams yet. Be the first!</p>`;
      return;
    }

    teams.forEach(team => {
      const leaderId = parseInt(team.leader_id);
      const isLeader = leaderId === me;
      const isMember = team.members.some(m => parseInt(m.id) === me);

      const div = document.createElement("div");
      div.className = "team";

      // Member list
      const memberHtml = team.members.map(m => {
        const isThisLeader = parseInt(m.id) === leaderId;
        return `<div class="member${isThisLeader ? " leader" : ""}">
          ${escapeHtml(m.username)}${isThisLeader ? " (leader)" : ""}
        </div>`;
      }).join("");

      div.innerHTML = `
        <div class="team-header">
          <span>${escapeHtml(team.team_name)}</span>
          <span>${team.members.length} member${team.members.length !== 1 ? "s" : ""}</span>
        </div>
        <div class="members">${memberHtml}</div>
        <div class="team-actions"></div>
      `;

      const actions = div.querySelector(".team-actions");

      if (isLeader) {
        // Leader sees: Delete + Start
        const del = document.createElement("button");
        del.textContent = "Delete";
        del.className = "delete";
        del.onclick = () => deleteTeam(team.id);
        actions.appendChild(del);

        const start = document.createElement("button");
        start.textContent = "Start";
        start.className = "start";
        start.onclick = () => {
          localStorage.setItem("teamId", team.id);
          window.location.href = "scanner.html";
        };
        actions.appendChild(start);

      } else if (isMember) {
        // Non-leader member sees: Leave
        const leave = document.createElement("button");
        leave.textContent = "Leave";
        leave.className = "leave";
        leave.onclick = () => leaveTeam(team.id);
        actions.appendChild(leave);

      } else if (!myTeam) {
        // Not in any team → show Join
        const join = document.createElement("button");
        join.textContent = "Join";
        join.className = "join";
        join.onclick = () => joinTeam(team.id);
        actions.appendChild(join);
      }
      // If in a different team → no buttons shown for this team

      teamList.appendChild(div);
    });
  })
  .catch(() => {
    teamList.innerHTML = `<p style="color:red;text-align:center">Failed to load teams</p>`;
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

loadTeams();