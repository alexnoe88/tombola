let allMembers = [];
let members = [];
let winners = [];

const maleInput = document.getElementById("maleInput");
const femaleInput = document.getElementById("femaleInput");
const drawButton = document.getElementById("drawButton");
const resetButton = document.getElementById("resetButton");
const winnerDisplay = document.getElementById("winner");
const remainingList = document.getElementById("remainingList");
const modeSelect = document.getElementById("modeSelect");

// ⚙️ Settings panel toggle
const toggleSettings = document.getElementById("toggleSettings");
const settingsPanel = document.getElementById("settingsPanel");

toggleSettings.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
  toggleSettings.textContent = settingsPanel.classList.contains("hidden")
    ? "⚙️ Verwaltung"
    : "⬇️ Einstellungen verstecken";
});

// 🎯 Load state
window.addEventListener("load", () => {
  const saved = localStorage.getItem("tombolaAllMembers");
  const savedMode = localStorage.getItem("tombolaMode");
  if (saved) allMembers = JSON.parse(saved);
  if (savedMode) modeSelect.value = savedMode;
  applyModeFilter();
});

// 📂 File uploads
maleInput.addEventListener("change", (e) => handleFileUpload(e, "male"));
femaleInput.addEventListener("change", (e) => handleFileUpload(e, "female"));

function handleFileUpload(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const newMembers = parseCSV(text, type);
    allMembers = mergeMembers(allMembers, newMembers);
    saveState();
    applyModeFilter();
  };
  reader.readAsText(file);
}

// 🧮 Parse CSV
function parseCSV(text, type) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  return lines.map(line => {
    const parts = line.split(/[;,]/).map(p => p.trim());
    const name = parts[0];
    const weight = parts[1] ? parseInt(parts[1], 10) || 1 : 1;
    return { name, weight, type };
  });
}

// 🧩 Merge lists without duplicates
function mergeMembers(existing, incoming) {
  const names = new Set(existing.map(m => m.name));
  const merged = [...existing];
  incoming.forEach(m => {
    if (!names.has(m.name)) merged.push(m);
  });
  return merged;
}

// 🪄 Filter by mode and reset winners
function applyModeFilter() {
  const mode = modeSelect.value;
  localStorage.setItem("tombolaMode", mode);

  winners = [];
  winnerDisplay.textContent = "";

  if (mode === "normal") {
    members = allMembers.filter(m => m.weight >= 5);
  } else if (mode === "premium") {
    members = allMembers.filter(m => {
      if (m.type === "male") return m.weight >= 35;
      if (m.type === "female") return m.weight >= 30;
      return false;
    });
  }

  updateList();
  drawButton.disabled = members.length === 0;
}

// 🎁 Draw winner
drawButton.addEventListener("click", drawWinner);

function drawWinner() {
  if (members.length === 0) {
    alert("Alle Teilnehmer wurden gezogen! 🎉");
    return;
  }

  const winnerIndex = weightedRandomIndex(members.map(m => m.weight));
  const winner = members.splice(winnerIndex, 1)[0];
  winners.push(winner.name);

  winnerDisplay.textContent = `🎉 Gewinner: ${winner.name}! (${winner.weight} Teilnahmen)`;
  confettiBurst();
  updateList();
  saveState();
  drawButton.disabled = members.length === 0;
}

// ⚖️ Weighted random index
function weightedRandomIndex(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return weights.length - 1;
}

// 🧹 Reset
resetButton.addEventListener("click", () => {
  if (confirm("Reset all data?")) {
    localStorage.clear();
    allMembers = [];
    members = [];
    winners = [];
    winnerDisplay.textContent = "";
    remainingList.innerHTML = "";
    drawButton.disabled = true;
    maleInput.value = "";
    femaleInput.value = "";
  }
});

// 💾 Save state
function saveState() {
  localStorage.setItem("tombolaAllMembers", JSON.stringify(allMembers));
}

// 🧾 Update list sorted by chance
function updateList() {
  const remainingCount = document.getElementById("remainingCount");

  if (members.length === 0) {
    remainingList.innerHTML = "<li>No participants eligible in this mode 🎄</li>";
    remainingCount.textContent = 0;
    return;
  }

  const totalWeight = members.reduce((sum, m) => sum + m.weight, 0);

  // Sort descending by ticket count
  const sortedMembers = [...members].sort((a, b) => b.weight - a.weight);

  remainingList.innerHTML = sortedMembers
    .map((m) => {
      const chancePercent = ((m.weight / totalWeight) * 100).toFixed(1);
      const color = m.type === "male" ? "blue" : "deeppink";
      return `<li>${m.name} 
        <span style="color:${color}; font-weight:bold;">(${m.type})</span>
        <span style="color:gray;"> – ${m.weight} tickets, ${chancePercent}% chance</span></li>`;
    })
    .join("");

  // Update the count
  remainingCount.textContent = members.length;
}


// 🎊 Confetti
function confettiBurst() {
  const duration = 2 * 1000;
  const end = Date.now() + duration;
  const confettiCanvas = document.getElementById("confetti");
  const ctx = confettiCanvas.getContext("2d");
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const particles = Array.from({ length: 150 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * confettiCanvas.height - confettiCanvas.height,
    r: Math.random() * 6 + 4,
    d: Math.random() * 100,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
  }));

  function draw() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.r, p.r);
    });
  }

  function update() {
    particles.forEach((p) => {
      p.y += Math.cos(p.d) + 2;
      p.x += Math.sin(p.d);
      if (p.y > confettiCanvas.height) {
        p.y = -10;
        p.x = Math.random() * confettiCanvas.width;
      }
    });
  }

  (function loop() {
    draw();
    update();
    if (Date.now() < end) {
      requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  })();
}

// 🧩 Mode change
modeSelect.addEventListener("change", applyModeFilter);
