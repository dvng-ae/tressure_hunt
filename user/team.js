const roomId = localStorage.getItem("joinedRoomId");

if (!roomId) {
  alert("No room selected");
  window.location.href = "room.html";
}

const teamList = document.getElementById("teamList");
const createTeamBtn = document.getElementById("createTeamBtn");
const teamNameInput = document.getElementById("teamNameInput");
const startBtn = document.getElementById("startGameBtn");

createTeamBtn.onclick = () => {
  const name = teamNameInput.value.trim();
  if (!name) return;

  fetch("../api/create_team.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `room_id=${roomId}&team_name=${encodeURIComponent(name)}`
  })
  .then(() => {
    teamNameInput.value = "";
    loadTeams();
  });
};

function joinTeam(teamId) {
  fetch("../api/join_team.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `team_id=${teamId}`
  }).then(loadTeams);
}

function leaveTeam(teamId) {
  fetch("../api/leave_team.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `team_id=${teamId}`
  }).then(loadTeams);
}

function loadTeams() {
  fetch(`../api/get_teams.php?room_id=${roomId}`)
    .then(res => res.json())
    .then(teams => {
      teamList.innerHTML = "";

      if (!teams.length) {
        teamList.innerHTML = "<p>No teams yet</p>";
        return;
      }

      teams.forEach(team => {
        const div = document.createElement("div");
        div.className = "team";

        div.innerHTML = `
          <div class="team-header">
            <span>${team.team_name}</span>
            <span>${team.members.length} members</span>
          </div>
          <div class="members">
            ${team.members.map(m => `
              <div class="member">${m.username}</div>
            `).join("")}
          </div>
          <div class="team-actions"></div>
        `;

        const actions = div.querySelector(".team-actions");

        const joinBtn = document.createElement("button");
        joinBtn.textContent = "Join";
        joinBtn.className = "join";
        joinBtn.onclick = () => joinTeam(team.id);

        const leaveBtn = document.createElement("button");
        leaveBtn.textContent = "Leave";
        leaveBtn.className = "leave";
        leaveBtn.onclick = () => leaveTeam(team.id);

        actions.appendChild(joinBtn);
        actions.appendChild(leaveBtn);

        teamList.appendChild(div);
      });
    });
}

startBtn.onclick = () => {

  const roomId = localStorage.getItem("joinedRoomId");

  if (!roomId) {
    alert("No room selected!");
    return;
  }

  // Optional: store team id also if needed later
  // localStorage.setItem("teamId", selectedTeamId);

  window.location.href = "scanner.html";
};


loadTeams();
