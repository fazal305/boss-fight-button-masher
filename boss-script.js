const bossList = [
  {
    name: "DEADLINE OVERLORD",
    symbol: "DL",
    maxHp: 220,
    attackMin: 8,
    attackMax: 12,
    attackSpeed: 2500,
    winMessage: "You shipped before the timer ran out.",
    loseMessage: "The deadline landed one final critical hit.",
    color: "#39ff14"
  },
  {
    name: "EXAM SEASON",
    symbol: "EX",
    maxHp: 360,
    attackMin: 10,
    attackMax: 15,
    attackSpeed: 2100,
    winMessage: "You passed the fight with a suspiciously good combo.",
    loseMessage: "The revision notes arrived too late.",
    color: "#fff700"
  },
  {
    name: "ANCIENT WIFI ROUTER",
    symbol: "WF",
    maxHp: 520,
    attackMin: 12,
    attackMax: 17,
    attackSpeed: 1800,
    winMessage: "The signal is finally stable.",
    loseMessage: "Packet loss ended the run.",
    color: "#00d9ff"
  },
  {
    name: "THE ALGORITHM",
    symbol: "AI",
    maxHp: 760,
    attackMin: 14,
    attackMax: 19,
    attackSpeed: 1450,
    winMessage: "Your engagement metrics survived the fight.",
    loseMessage: "The algorithm buried your combo.",
    color: "#b026ff"
  },
  {
    name: "FINAL BOSS: SLEEP DEPRIVATION",
    symbol: "ZZ",
    maxHp: 1000,
    attackMin: 16,
    attackMax: 20,
    attackSpeed: 1050,
    winMessage: "You won. The best reward is rest.",
    loseMessage: "The 3am debuff was too strong.",
    color: "#ff1744"
  }
];

const attackNames = [
  "Combo Hit",
  "Power Tap",
  "Bug Fix Bash",
  "Sprint Strike",
  "Cache Clear",
  "Pixel Punch",
  "Merge Clean",
  "Deploy Hit",
  "Refactor Slam",
  "Critical Tap"
];

const bossDialogues = [
  "That was almost damage.",
  "Your combo needs more voltage.",
  "I have seen stronger loading screens.",
  "Keep tapping. I might notice.",
  "That keyboard is doing its best.",
  "Your DPS report is pending.",
  "You are one combo away from greatness.",
  "Try not to blink."
];

const powerUps = [
  {
    name: "DOUBLE DAMAGE",
    message: "Power-up: DOUBLE DAMAGE for 5 seconds",
    type: "doubleDamage",
    duration: 5000
  },
  {
    name: "HEAL BOOST",
    message: "Power-up: +25 Player HP",
    type: "heal",
    duration: 0
  },
  {
    name: "CRIT MODE",
    message: "Power-up: CRIT MODE for 5 seconds",
    type: "critMode",
    duration: 5000
  }
];

const storageKey = "bossFightButtonMasherStats";
let audioContext = null;

const gameState = {
  currentBossIndex: 0,
  playerHp: 100,
  bossHp: 0,
  isGameOver: false,
  bossAttackTimer: null,
  powerUpTimer: null,
  activePowerUp: null,
  fightStartTime: Date.now(),
  totalHits: 0,
  totalDamage: 0,
  bossesDefeated: 0,
  bestRun: 0
};

const gameContainer = document.getElementById("gameContainer");
const gameUi = document.getElementById("gameUi");
const bossName = document.getElementById("bossName");
const bossSymbol = document.getElementById("bossSymbol");
const bossStage = document.getElementById("bossStage");
const bossDialogue = document.getElementById("bossDialogue");
const bossProgressText = document.getElementById("bossProgressText");
const powerUpText = document.getElementById("powerUpText");
const bossHpText = document.getElementById("bossHpText");
const playerHpText = document.getElementById("playerHpText");
const bossHpFill = document.getElementById("bossHpFill");
const playerHpFill = document.getElementById("playerHpFill");
const attackButton = document.getElementById("attackButton");
const resultCard = document.getElementById("resultCard");
const resultEyebrow = document.getElementById("resultEyebrow");
const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const resultStats = document.getElementById("resultStats");
const resultButton = document.getElementById("resultButton");

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loadSavedStats() {
  const savedData = localStorage.getItem(storageKey);

  if (!savedData) {
    return;
  }

  try {
    const parsedStats = JSON.parse(savedData);
    gameState.bestRun = Number.isInteger(parsedStats.bestRun) ? parsedStats.bestRun : 0;
  } catch (error) {
    localStorage.removeItem(storageKey);
  }
}

function saveStats() {
  localStorage.setItem(storageKey, JSON.stringify({ bestRun: gameState.bestRun }));
}

function loadBoss(index) {
  const boss = bossList[index];

  gameState.currentBossIndex = index;
  gameState.bossHp = boss.maxHp;
  gameState.isGameOver = false;
  gameState.activePowerUp = null;
  gameState.fightStartTime = Date.now();

  clearTimeout(gameState.powerUpTimer);
  clearInterval(gameState.bossAttackTimer);

  document.documentElement.style.setProperty("--boss-color", boss.color);

  bossName.textContent = boss.name;
  bossSymbol.textContent = boss.symbol;
  bossDialogue.textContent = "Press attack. I dare you.";
  bossProgressText.textContent = `${index + 1} / ${bossList.length}`;
  powerUpText.textContent = "Power-up: None";
  attackButton.textContent = "Attack";
  attackButton.disabled = false;

  bossSymbol.classList.remove("boss-dead");
  gameUi.classList.remove("hidden");
  resultCard.classList.add("hidden");

  updateBossHealthBar();
  updatePlayerHealthBar();
  startBossAttackTimer();
}

function attackBoss() {
  if (gameState.isGameOver) {
    return;
  }

  let damage = getRandomNumber(5, 15);

  if (gameState.activePowerUp === "doubleDamage") {
    damage *= 2;
  }

  if (gameState.activePowerUp === "critMode" && Math.random() < 0.35) {
    damage *= 3;
  }

  attackButton.textContent = attackNames[getRandomNumber(0, attackNames.length - 1)];
  gameState.totalHits += 1;
  gameState.totalDamage += damage;

  dealDamageToBoss(damage);
  maybeTriggerPowerUp();
  updateBossDialogue();
  playSound("hit");
}

function dealDamageToBoss(damage) {
  const boss = bossList[gameState.currentBossIndex];
  gameState.bossHp = Math.max(0, gameState.bossHp - damage);

  updateBossHealthBar();
  spawnDamageNumber(damage);
  triggerHitEffects();

  if (gameState.bossHp === 0) {
    gameState.isGameOver = true;
    attackButton.disabled = true;
    clearInterval(gameState.bossAttackTimer);
    clearTimeout(gameState.powerUpTimer);

    bossSymbol.classList.add("boss-dead");
    playSound("victory");

    window.setTimeout(function () {
      showVictoryScreen(boss);
    }, 750);
  }
}

function bossAttack() {
  if (gameState.isGameOver) {
    return;
  }

  const boss = bossList[gameState.currentBossIndex];
  const damage = getRandomNumber(boss.attackMin, boss.attackMax);
  gameState.playerHp = Math.max(0, gameState.playerHp - damage);

  updatePlayerHealthBar();
  triggerHitEffects();
  updateBossDialogue();
  playSound("bossAttack");

  if (gameState.playerHp === 0) {
    gameState.isGameOver = true;
    attackButton.disabled = true;
    clearInterval(gameState.bossAttackTimer);
    clearTimeout(gameState.powerUpTimer);
    showGameOverScreen(boss);
  }
}

function updateBossHealthBar() {
  const boss = bossList[gameState.currentBossIndex];
  const hpPercent = (gameState.bossHp / boss.maxHp) * 100;
  bossHpFill.style.width = `${hpPercent}%`;
  bossHpText.textContent = `${gameState.bossHp} / ${boss.maxHp}`;
}

function updatePlayerHealthBar() {
  playerHpFill.style.width = `${gameState.playerHp}%`;
  playerHpText.textContent = `${gameState.playerHp} / 100`;
  playerHpFill.classList.toggle("low-health", gameState.playerHp <= 25);
}

function spawnDamageNumber(damage) {
  const damageNumber = document.createElement("div");
  damageNumber.className = "damage-number";
  damageNumber.textContent = `-${damage}`;
  bossStage.appendChild(damageNumber);

  window.setTimeout(function () {
    damageNumber.remove();
  }, 800);
}

function triggerHitEffects() {
  gameContainer.classList.add("shake");
  bossSymbol.classList.add("hit");

  window.setTimeout(function () {
    gameContainer.classList.remove("shake");
    bossSymbol.classList.remove("hit");
  }, 260);
}

function maybeTriggerPowerUp() {
  const shouldTriggerPowerUp = Math.random() < 0.08;

  if (!shouldTriggerPowerUp || gameState.activePowerUp) {
    return;
  }

  activatePowerUp(powerUps[getRandomNumber(0, powerUps.length - 1)]);
}

function activatePowerUp(powerUp) {
  playSound("powerUp");
  powerUpText.textContent = powerUp.message;
  powerUpText.classList.add("power-up-flash");

  window.setTimeout(function () {
    powerUpText.classList.remove("power-up-flash");
  }, 500);

  if (powerUp.type === "heal") {
    gameState.playerHp = Math.min(100, gameState.playerHp + 25);
    updatePlayerHealthBar();
    return;
  }

  gameState.activePowerUp = powerUp.type;
  clearTimeout(gameState.powerUpTimer);

  gameState.powerUpTimer = window.setTimeout(function () {
    gameState.activePowerUp = null;
    powerUpText.textContent = "Power-up: None";
  }, powerUp.duration);
}

function updateBossDialogue() {
  bossDialogue.textContent = bossDialogues[getRandomNumber(0, bossDialogues.length - 1)];
}

function showVictoryScreen(boss) {
  const timeTaken = Math.floor((Date.now() - gameState.fightStartTime) / 1000);
  const xpGained = boss.maxHp * 10;
  gameState.bossesDefeated += 1;
  gameState.bestRun = Math.max(gameState.bestRun, gameState.bossesDefeated);
  saveStats();

  gameUi.classList.add("hidden");
  resultCard.classList.remove("hidden");

  resultEyebrow.textContent = "Boss Defeated";
  resultTitle.textContent = `${boss.name} defeated`;
  resultMessage.textContent = boss.winMessage;
  resultStats.innerHTML = `
    <div class="stat-badge">XP Gained: ${xpGained}</div>
    <div class="stat-badge">Fight Time: ${timeTaken}s</div>
    <div class="stat-badge">Best Run: ${gameState.bestRun} / ${bossList.length}</div>
  `;

  resultButton.textContent = "Next Boss";
  resultButton.onclick = nextBoss;
}

function showGameOverScreen(boss) {
  gameUi.classList.add("hidden");
  resultCard.classList.remove("hidden");

  resultEyebrow.textContent = "Game Over";
  resultTitle.textContent = `${boss.name} won the round`;
  resultMessage.textContent = boss.loseMessage;
  resultStats.innerHTML = `
    <div class="stat-badge">Boss HP Left: ${gameState.bossHp}</div>
    <div class="stat-badge">Total Hits: ${gameState.totalHits}</div>
    <div class="stat-badge">Total Damage: ${gameState.totalDamage}</div>
  `;

  resultButton.textContent = "Try Again";
  resultButton.onclick = restartBoss;
}

function nextBoss() {
  const nextBossIndex = gameState.currentBossIndex + 1;
  gameState.playerHp = 100;

  if (nextBossIndex >= bossList.length) {
    showFinalWinScreen();
    return;
  }

  loadBoss(nextBossIndex);
}

function showFinalWinScreen() {
  clearInterval(gameState.bossAttackTimer);
  gameUi.classList.add("hidden");
  resultCard.classList.remove("hidden");

  resultEyebrow.textContent = "Final Victory";
  resultTitle.textContent = "You beat every boss";
  resultMessage.textContent = "The full arcade run is complete.";
  resultStats.innerHTML = `
    <div class="stat-badge">Bosses Defeated: ${bossList.length}</div>
    <div class="stat-badge">Total Hits: ${gameState.totalHits}</div>
    <div class="stat-badge">Total Damage: ${gameState.totalDamage}</div>
  `;

  resultButton.textContent = "Play Again";
  resultButton.onclick = restartFullRun;
}

function restartBoss() {
  gameState.playerHp = 100;
  loadBoss(gameState.currentBossIndex);
}

function restartFullRun() {
  gameState.currentBossIndex = 0;
  gameState.playerHp = 100;
  gameState.totalHits = 0;
  gameState.totalDamage = 0;
  gameState.bossesDefeated = 0;
  loadBoss(0);
}

function startBossAttackTimer() {
  const boss = bossList[gameState.currentBossIndex];

  clearInterval(gameState.bossAttackTimer);
  gameState.bossAttackTimer = window.setInterval(bossAttack, boss.attackSpeed);
}

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
}

function playSound(type) {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const frequencies = {
    hit: 180,
    bossAttack: 90,
    powerUp: 520,
    victory: 740,
    default: 120
  };

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.frequency.value = frequencies[type] || frequencies.default;
  oscillator.type = "square";
  gainNode.gain.setValueAtTime(0.08, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.1);
}

attackButton.addEventListener("click", attackBoss);

document.addEventListener("keydown", function (event) {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  attackBoss();
});

loadSavedStats();
restartFullRun();
