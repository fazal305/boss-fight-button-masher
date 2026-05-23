const BOSS_LIST = [
  {
    id: 1,
    name: "THE CORPORATE ZOMBIE",
    emoji: "🧟",
    maxHp: 200,
    attackMin: 8,
    attackMax: 12,
    attackSpeed: 2500,
    deathMessage: "He died as he lived. In a meeting.",
    killMessage: "He scheduled your death for 3pm. You had no say.",
    color: "#39ff14"
  },
  {
    id: 2,
    name: "EXAM SEASON",
    emoji: "📚",
    maxHp: 350,
    attackMin: 10,
    attackMax: 15,
    attackSpeed: 2000,
    deathMessage: "You passed. Barely.",
    killMessage: "You forgot to study. Tragic.",
    color: "#fff700"
  },
  {
    id: 3,
    name: "WIFI ROUTER FROM 2009",
    emoji: "📡",
    maxHp: 500,
    attackMin: 12,
    attackMax: 17,
    attackSpeed: 1800,
    deathMessage: "Finally. Sweet silence.",
    killMessage: "Packet loss. You never stood a chance.",
    color: "#00d9ff"
  },
  {
    id: 4,
    name: "THE ALGORITHM",
    emoji: "🤖",
    maxHp: 750,
    attackMin: 14,
    attackMax: 19,
    attackSpeed: 1400,
    deathMessage: "Your engagement metrics are through the roof.",
    killMessage: "The algorithm decided you were not relevant content.",
    color: "#b026ff"
  },
  {
    id: 5,
    name: "FINAL BOSS: SLEEP DEPRIVATION",
    emoji: "😴",
    maxHp: 1000,
    attackMin: 16,
    attackMax: 20,
    attackSpeed: 1000,
    deathMessage: "You win. Now go to sleep.",
    killMessage: "3am. You should have known.",
    color: "#ff1744"
  }
];

const ATTACK_NAMES = [
  "YEET!",
  "HAYMAKER!",
  "CTRL+ALT+DELETE!",
  "GIT PUSH --FORCE!",
  "NPM INSTALL!",
  "STACK OVERFLOW!",
  "COPY PASTE!",
  "RUBBER DUCK DEBUG!",
  "404 NOT FOUND!",
  "UNDEFINED IS NOT A FUNCTION!",
  "MERGE CONFLICT!",
  "sudo rm -rf!"
];

const BOSS_DIALOGUES = [
  "You call that damage?",
  "My grandma clicks faster.",
  "Skill issue detected.",
  "Bro brought HTML to a boss fight.",
  "Stop touching the keyboard like that.",
  "This is not even my final meeting.",
  "Your WiFi has abandoned you.",
  "I have seen better DPS from a toaster."
];

const POWER_UPS = [
  {
    name: "DOUBLE DAMAGE",
    message: "Power-up: DOUBLE DAMAGE for 5 seconds",
    type: "doubleDamage",
    duration: 5000
  },
  {
    name: "HEAL JUICE",
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

const gameState = {
  currentBossIndex: 0,
  playerHp: 100,
  bossHp: 0,
  isGameOver: false,
  bossAttackTimer: null,
  powerUpTimer: null,
  activePowerUp: null,
  fightStartTime: Date.now()
};

const gameContainer = document.getElementById("gameContainer");
const gameUi = document.getElementById("gameUi");
const bossName = document.getElementById("bossName");
const bossEmoji = document.getElementById("bossEmoji");
const bossStage = document.getElementById("bossStage");
const bossDialogue = document.getElementById("bossDialogue");
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

// This gives us a random whole number between two values.
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// This creates a tiny arcade sound using browser audio.
function playSound(type) {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  if (type === "hit") {
    oscillator.frequency.value = 180;
  } else if (type === "bossAttack") {
    oscillator.frequency.value = 90;
  } else if (type === "powerUp") {
    oscillator.frequency.value = 520;
  } else if (type === "victory") {
    oscillator.frequency.value = 740;
  } else {
    oscillator.frequency.value = 120;
  }

  gainNode.gain.value = 0.08;
  oscillator.type = "square";

  oscillator.start();

  setTimeout(function () {
    oscillator.stop();
    audioContext.close();
  }, 100);
}

// This loads a boss, resets its HP, and updates the screen.
function loadBoss(index) {
  const boss = BOSS_LIST[index];

  gameState.currentBossIndex = index;
  gameState.bossHp = boss.maxHp;
  gameState.isGameOver = false;
  gameState.activePowerUp = null;
  gameState.fightStartTime = Date.now();

  clearTimeout(gameState.powerUpTimer);

  document.documentElement.style.setProperty("--boss-color", boss.color);

  bossName.textContent = boss.name;
  bossEmoji.textContent = boss.emoji;
  bossDialogue.textContent = "Press attack. I dare you.";
  powerUpText.textContent = "Power-up: None";
  attackButton.textContent = "ATTACK";

  bossEmoji.classList.remove("boss-dead");
  gameUi.classList.remove("hidden");
  resultCard.classList.add("hidden");

  updateBossHealthBar();
  updatePlayerHealthBar();
  startBossAttackTimer();
}

// This runs when the player attacks using a key or the attack button.
function attackBoss() {
  if (gameState.isGameOver) {
    return;
  }

  let damage = getRandomNumber(5, 15);

  if (gameState.activePowerUp === "doubleDamage") {
    damage = damage * 2;
  }

  if (gameState.activePowerUp === "critMode" && Math.random() < 0.35) {
    damage = damage * 3;
  }

  const randomAttackName = ATTACK_NAMES[getRandomNumber(0, ATTACK_NAMES.length - 1)];

  attackButton.textContent = randomAttackName;
  dealDamageToBoss(damage);
  maybeTriggerPowerUp();
  updateBossDialogue();
  playSound("hit");
}

// This removes HP from the boss and checks if the player won.
function dealDamageToBoss(damage) {
  const boss = BOSS_LIST[gameState.currentBossIndex];

  gameState.bossHp = Math.max(0, gameState.bossHp - damage);

  updateBossHealthBar();
  spawnDamageNumber(damage);
  triggerHitEffects();

  if (gameState.bossHp === 0) {
    gameState.isGameOver = true;
    clearInterval(gameState.bossAttackTimer);
    clearTimeout(gameState.powerUpTimer);

    bossEmoji.classList.add("boss-dead");
    playSound("victory");

    setTimeout(function () {
      showVictoryScreen(boss);
    }, 800);
  }
}

// This lets the boss attack the player.
function bossAttack() {
  if (gameState.isGameOver) {
    return;
  }

  const boss = BOSS_LIST[gameState.currentBossIndex];
  const damage = getRandomNumber(boss.attackMin, boss.attackMax);

  gameState.playerHp = Math.max(0, gameState.playerHp - damage);

  updatePlayerHealthBar();
  triggerHitEffects();
  updateBossDialogue();
  playSound("bossAttack");

  if (gameState.playerHp === 0) {
    gameState.isGameOver = true;
    clearInterval(gameState.bossAttackTimer);
    clearTimeout(gameState.powerUpTimer);
    showGameOverScreen(boss);
  }
}

// This updates the boss health bar width and text.
function updateBossHealthBar() {
  const boss = BOSS_LIST[gameState.currentBossIndex];
  const hpPercent = (gameState.bossHp / boss.maxHp) * 100;

  bossHpFill.style.width = `${hpPercent}%`;
  bossHpText.textContent = `${gameState.bossHp} / ${boss.maxHp}`;
}

// This updates the player health bar width, text, and danger color.
function updatePlayerHealthBar() {
  playerHpFill.style.width = `${gameState.playerHp}%`;
  playerHpText.textContent = `${gameState.playerHp} / 100`;

  if (gameState.playerHp <= 25) {
    playerHpFill.classList.add("low-health");
  } else {
    playerHpFill.classList.remove("low-health");
  }
}

// This creates a floating damage number and removes it after the animation.
function spawnDamageNumber(damage) {
  const damageNumber = document.createElement("div");

  damageNumber.classList.add("damage-number");
  damageNumber.textContent = `-${damage}!`;

  bossStage.appendChild(damageNumber);

  setTimeout(function () {
    damageNumber.remove();
  }, 800);
}

// This adds quick shake and flash effects when damage happens.
function triggerHitEffects() {
  gameContainer.classList.add("shake");
  bossEmoji.classList.add("hit");

  setTimeout(function () {
    gameContainer.classList.remove("shake");
    bossEmoji.classList.remove("hit");
  }, 300);
}

// This randomly gives the player a power-up after attacking.
function maybeTriggerPowerUp() {
  const shouldTriggerPowerUp = Math.random() < 0.08;

  if (!shouldTriggerPowerUp || gameState.activePowerUp) {
    return;
  }

  const powerUp = POWER_UPS[getRandomNumber(0, POWER_UPS.length - 1)];

  activatePowerUp(powerUp);
}

// This activates the selected power-up.
function activatePowerUp(powerUp) {
  playSound("powerUp");

  powerUpText.textContent = powerUp.message;
  powerUpText.classList.add("power-up-flash");

  setTimeout(function () {
    powerUpText.classList.remove("power-up-flash");
  }, 500);

  if (powerUp.type === "heal") {
    gameState.playerHp = Math.min(100, gameState.playerHp + 25);
    updatePlayerHealthBar();
    return;
  }

  gameState.activePowerUp = powerUp.type;

  clearTimeout(gameState.powerUpTimer);

  gameState.powerUpTimer = setTimeout(function () {
    gameState.activePowerUp = null;
    powerUpText.textContent = "Power-up: None";
  }, powerUp.duration);
}

// This changes the boss dialogue to a random trash-talk line.
function updateBossDialogue() {
  const randomDialogue = BOSS_DIALOGUES[getRandomNumber(0, BOSS_DIALOGUES.length - 1)];

  bossDialogue.textContent = randomDialogue;
}

// This shows the victory screen after a boss is defeated.
function showVictoryScreen(boss) {
  const timeTaken = Math.floor((Date.now() - gameState.fightStartTime) / 1000);
  const xpGained = boss.maxHp * 10;

  gameUi.classList.add("hidden");
  resultCard.classList.remove("hidden");

  resultEyebrow.textContent = "Boss Defeated";
  resultTitle.textContent = `${boss.name} defeated`;
  resultMessage.textContent = boss.deathMessage;

  resultStats.innerHTML = `
    <div class="stat-badge">XP Gained: ${xpGained}</div>
    <div class="stat-badge">Time Taken: ${timeTaken}s</div>
  `;

  resultButton.textContent = "NEXT BOSS";
  resultButton.onclick = nextBoss;
}

// This shows the game over screen when the player loses.
function showGameOverScreen(boss) {
  gameUi.classList.add("hidden");
  resultCard.classList.remove("hidden");

  resultEyebrow.textContent = "Game Over";
  resultTitle.textContent = `${boss.name} destroyed you`;
  resultMessage.textContent = boss.killMessage;

  resultStats.innerHTML = `
    <div class="stat-badge">Boss HP Left: ${gameState.bossHp}</div>
  `;

  resultButton.textContent = "TRY AGAIN";
  resultButton.onclick = restartBoss;
}

// This moves to the next boss or shows the final win screen.
function nextBoss() {
  const nextBossIndex = gameState.currentBossIndex + 1;

  gameState.playerHp = 100;

  if (nextBossIndex >= BOSS_LIST.length) {
    gameUi.classList.add("hidden");
    resultCard.classList.remove("hidden");

    resultEyebrow.textContent = "Final Victory";
    resultTitle.textContent = "You beat every boss";
    resultMessage.textContent = "Arcade goblin status achieved. Legendary button masher.";

    resultStats.innerHTML = `
      <div class="stat-badge">Total Bosses Defeated: ${BOSS_LIST.length}</div>
    `;

    resultButton.textContent = "PLAY AGAIN";
    resultButton.onclick = function () {
      gameState.playerHp = 100;
      loadBoss(0);
    };

    return;
  }

  loadBoss(nextBossIndex);
}

// This restarts the current boss fight with full player HP.
function restartBoss() {
  gameState.playerHp = 100;
  loadBoss(gameState.currentBossIndex);
}

// This clears the old boss timer and starts a new one for the current boss.
function startBossAttackTimer() {
  const boss = BOSS_LIST[gameState.currentBossIndex];

  clearInterval(gameState.bossAttackTimer);

  gameState.bossAttackTimer = setInterval(function () {
    bossAttack();
  }, boss.attackSpeed);
}

attackButton.addEventListener("click", attackBoss);

document.addEventListener("keydown", function () {
  attackBoss();
});

loadBoss(0);