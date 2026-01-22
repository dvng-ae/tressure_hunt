/* ================= CONFIG ================= */
const currentUser = "User1";
const isAdmin = true;

/* ================= STATE ================= */
let teams = [];

/* ================= ELEMENTS ================= */
const teamsDiv = document.getElementById("teams");
const modal = document.getElementById("teamModal");
const startBtn = document.getElementById("startGame");
const openModalBtn = document.getElementById("openCreateModal");
const createTeamBtn = document.getElementById("createTeamBtn");

/* ================= OPEN MODAL ================= */
openModalBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

/* ================= CREATE TEAM ================= */
createTeamBtn.addEventListener("click", () => {
  const nameInput = document.getElementById("teamName");
  const maxSelect = document.getElementById("maxPlayers");

  const name = nameInput.value.trim();
  const max = Number(maxSelect.value);

  if (!name) {
    alert("Enter team name");
    return;
  }

  teams.push({
    id: crypto.randomUUID(),   // 🔥 SAFE UNIQUE ID
    name,
    max,
    leader: currentUser,
    players: [currentUser],
    ready: false
  });

  nameInput.value = "";
  modal.classList.add("hidden");

  renderTeams();
});

/* ================= RENDER ================= */
function renderTeams() {
  teamsDiv.innerHTML = "";

  teams.forEach(team => {
    const div = document.createElement("div");
    div.className = "team";

    div.innerHTML = `
      <div class="team-top">
        <strong>${team.name}</strong>
        <span>${team.players.length}/${team.max}</span>
      </div>

      <div class="badge">
        ${team.leader === currentUser ? "Your Team · Leader" : "Team"}
      </div>

      ${team.ready ? `<div class="ready">READY</div>` : ""}
    `;

    /* READY TOGGLE */
    if (team.leader === currentUser && team.players.length >= 2) {
      const label = document.createElement("label");
      const checkbox = document.createElement("input");

      checkbox.type = "checkbox";
      checkbox.checked = team.ready;

      checkbox.addEventListener("change", () => {
        team.ready = checkbox.checked;
        renderTeams();
      });

      label.appendChild(checkbox);
      label.append(" Ready to Start");
      div.appendChild(label);
    }

    /* JOIN TEAM */
    if (!team.players.includes(currentUser) && team.players.length < team.max) {
      const joinBtn = document.createElement("button");
      joinBtn.type = "button";
      joinBtn.className = "join-btn";
      joinBtn.textContent = "Join Team";

      joinBtn.addEventListener("click", () => {
        team.players.push(currentUser);
        renderTeams();
      });

      div.appendChild(joinBtn);
    }

    /* REMOVE TEAM — GUARANTEED WORKING */
    if (team.leader === currentUser) {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-btn";
      removeBtn.textContent = "Remove Team";

      removeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const ok = confirm("Remove this team?");
        if (!ok) return;

        teams = teams.filter(t => t.id !== team.id);
        renderTeams();
      });

      div.appendChild(removeBtn);
    }

    teamsDiv.appendChild(div);
  });

  updateStartGame();
}

/* ================= START GAME ================= */
function updateStartGame() {
  const validTeams = teams.filter(t => t.players.length > 0);
  const canStart =
    validTeams.length >= 2 &&
    validTeams.every(t => t.ready);

  if (canStart && isAdmin) {
    startBtn.disabled = false;
    startBtn.classList.add("active");
  } else {
    startBtn.disabled = true;
    startBtn.classList.remove("active");
  }
}

startBtn.addEventListener("click", () => {
  if (!isAdmin) return;
  alert("Game Started!");
});

/* ================= INIT ================= */
renderTeams();
