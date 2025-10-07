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
    ? "⚙️ Einstellungen"
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
    alert("Alle Teilnehmer wurden gezogen!");
    return;
  }

  let winnerIndex;

  if (modeSelect.value === "normal") {
    // Normal tombola: equal chance
    winnerIndex = Math.floor(Math.random() * members.length);
  } else {
    // Premium tombola: weighted chance
    const weights = members.map(m => m.weight);
    winnerIndex = weightedRandomIndex(weights);
  }

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

function updateList() {
  const remainingCount = document.getElementById("remainingCount");
  const tbody = document.querySelector("#participantsTable tbody");
  const chanceHeader = document.getElementById("chanceHeader");

  const isPremium = modeSelect.value === "premium";

  // Show/hide Chance column
  chanceHeader.style.display = isPremium ? "" : "none";

  if (members.length === 0) {
    tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Alle Teilnehmer wurden gezogen!</td></tr>";
    remainingCount.textContent = 0;
    return;
  }

  const totalWeight = isPremium
    ? members.reduce((sum, m) => sum + m.weight, 0)
    : members.length; // equal chance for normal

  // Sort descending by tickets (or name if you prefer)
  const sortedMembers = [...members].sort((a, b) => b.weight - a.weight);

  tbody.innerHTML = sortedMembers
    .map((m) => {
      const chancePercent = isPremium
        ? ((m.weight / totalWeight) * 100).toFixed(1)
        : ""; // empty for normal
      return `<tr>
        <td>${m.name}</td>
        <td>${m.weight}</td>
        <td style="display:${isPremium ? "" : "none"};">${chancePercent}</td>
      </tr>`;
    })
    .join("");

  // Update participant count
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

const generateTestDataBtn = document.getElementById("generateTestDataBtn");

generateTestDataBtn.addEventListener("click", () => {
  if (!confirm("Testdaten generieren? Dies wird existierende Teilnehmer überschreiben.")) return;

  // Clear previous data
  allMembers = [];
  members = [];
  winners = [];
  winnerDisplay.textContent = "";
  
  // Generate 10-15 random males
  const maleCount = 10; // you can change
  allMembers.push({ name: `Alexander Luger`, weight: 36, type: "male" });
  allMembers.push({ name: `Moritz Pozsgay`, weight: 35, type: "male" });
  allMembers.push({ name: `Johann Fasel`, weight: 39, type: "male" });
  allMembers.push({ name: `Philipp Barbi`, weight: 31, type: "male" });
  allMembers.push({ name: `Herbert Schmid`, weight: 29, type: "male" });

  allMembers.push({ name: `Jennifer Eder`, weight: 31, type: "female" });
  allMembers.push({ name: `Sabine Plank`, weight: 33, type: "female" });
  allMembers.push({ name: `Stefanie Blaschek`, weight: 17, type: "female" });
  allMembers.push({ name: `Michaela Zöchbauer`, weight: 22, type: "female" });
  allMembers.push({ name: `Monika Der`, weight: 30, type: "female" });

  saveState();
  applyModeFilter();
  // ✅ Automatically collapse settings panel
  if (!settingsPanel.classList.contains("hidden")) {
    settingsPanel.classList.add("hidden");
    toggleSettings.textContent = "⚙️ Einstellungen";
  }
});
