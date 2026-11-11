"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const TAU = Math.PI * 2;
const WORLD = { w: 2800, h: 2100 };
const TILE = 64;

const ui = {
  hpFill: document.getElementById("hp-fill"),
  hpText: document.getElementById("hp-text"),
  money: document.getElementById("money-text"),
  wave: document.getElementById("wave-text"),
  kills: document.getElementById("kills-text"),
  waveStatus: document.getElementById("wave-status"),
  waveBanner: document.getElementById("wave-banner"),
  toastStack: document.getElementById("toast-stack"),
  hotbar: document.getElementById("hotbar"),
  activeName: document.getElementById("active-name"),
  activeStats: document.getElementById("active-stats"),
  interactPrompt: document.getElementById("interact-prompt"),
  startScreen: document.getElementById("start-screen"),
  shopScreen: document.getElementById("shop-screen"),
  pauseScreen: document.getElementById("pause-screen"),
  helpScreen: document.getElementById("help-screen"),
  gameoverScreen: document.getElementById("gameover-screen"),
  shopMoney: document.getElementById("shop-money"),
  upgradeGrid: document.getElementById("upgrade-grid"),
  repairBtn: document.getElementById("repair-btn"),
  repairCost: document.getElementById("repair-cost"),
  gameoverStats: document.getElementById("gameover-stats"),
  damageFlash: document.getElementById("damage-flash"),
  soundBtn: document.getElementById("sound-btn"),
};

const RARITIES = {
  common: { name: "Obyčejná", color: "#9aa092", mult: 1, weight: 52, suffix: "" },
  uncommon: { name: "Neobvyklá", color: "#84c16c", mult: 1.2, weight: 26, suffix: " Mk. II" },
  rare: { name: "Vzácná", color: "#68a8d8", mult: 1.48, weight: 13, suffix: " Mk. III" },
  epic: { name: "Epická", color: "#b184d0", mult: 1.85, weight: 6, suffix: " // Prototyp" },
  legendary: { name: "Legendární", color: "#e6b657", mult: 2.35, weight: 3, suffix: " // Relikvie" },
};

const WEAPONS = {
  pickaxe: { name: "Krumpáč", type: "melee", dmg: 18, cd: 0.42, range: 64, arc: 1.45, knock: 145, color: "#d8a35e", minWave: 0, weight: 0, icon: "pickaxe" },
  pipe: { name: "Trubkový klíč", type: "melee", dmg: 27, cd: 0.58, range: 72, arc: 1.3, knock: 190, color: "#9da89b", minWave: 1, weight: 9, icon: "pipe" },
  knife: { name: "Řezný nůž", type: "melee", dmg: 20, cd: 0.24, range: 58, arc: 1.02, knock: 70, color: "#c8d2cc", minWave: 1, weight: 9, icon: "knife" },
  sledge: { name: "Bourací kladivo", type: "melee", dmg: 58, cd: 0.88, range: 84, arc: 1.9, knock: 285, color: "#c3a06b", minWave: 3, weight: 5, icon: "sledge" },
  chainsaw: { name: "Řetězová pila", type: "melee", dmg: 13, cd: 0.13, range: 66, arc: 1.02, knock: 42, color: "#c79c5e", minWave: 3, weight: 5, icon: "chainsaw" },
  plasma: { name: "Plazmový řezák", type: "melee", dmg: 70, cd: 0.44, range: 90, arc: 1.65, knock: 225, color: "#69c7b7", minWave: 5, weight: 3, icon: "plasma" },
  pistol: { name: "Šrotová pistole", type: "ranged", dmg: 17, cd: 0.31, speed: 980, range: 720, spread: 0.025, pellets: 1, color: "#c3a775", minWave: 1, weight: 10, icon: "pistol" },
  nailgun: { name: "Hřebíkovačka", type: "ranged", dmg: 9, cd: 0.1, speed: 1050, range: 650, spread: 0.075, pellets: 1, color: "#9fb5b0", minWave: 2, weight: 7, icon: "nailgun" },
  smg: { name: "Kompresní SMG", type: "ranged", dmg: 12, cd: 0.085, speed: 1100, range: 700, spread: 0.11, pellets: 1, color: "#b8b0a0", minWave: 3, weight: 6, icon: "smg" },
  shotgun: { name: "Šrotovnice", type: "ranged", dmg: 11, cd: 0.78, speed: 850, range: 430, spread: 0.3, pellets: 5, color: "#c88e5e", minWave: 2, weight: 7, icon: "shotgun" },
  rifle: { name: "Průbojná puška", type: "ranged", dmg: 58, cd: 0.92, speed: 1600, range: 1000, spread: 0.008, pellets: 1, pierce: 2, color: "#8fb4c9", minWave: 4, weight: 4, icon: "rifle" },
  arc: { name: "Obloukový vybíječ", type: "ranged", dmg: 31, cd: 0.24, speed: 760, range: 620, spread: 0.04, pellets: 1, pierce: 1, color: "#b184d0", minWave: 5, weight: 3, icon: "arc" },
};

const ENEMY_TYPES = {
  scav: { name: "Šrotovník", hp: 42, speed: 74, dmg: 9, radius: 15, coins: [3, 7], color: "#9a6844", eye: "#ff5c38" },
  drone: { name: "Dron", hp: 30, speed: 104, dmg: 7, radius: 12, coins: [4, 8], color: "#788782", eye: "#ff4c32", ranged: true, preferred: 285, fireCd: 2.15, projSpeed: 340, projDmg: 8 },
  stalker: { name: "Stínošlap", hp: 32, speed: 150, dmg: 11, radius: 13, coins: [5, 9], color: "#6d5c68", eye: "#ff6b55" },
  gunner: { name: "Vrtačka", hp: 76, speed: 56, dmg: 12, radius: 19, coins: [8, 14], color: "#807960", eye: "#ff5a36", ranged: true, preferred: 335, fireCd: 2.45, projSpeed: 400, projDmg: 11 },
  brute: { name: "Těžkooděnec", hp: 190, speed: 44, dmg: 22, radius: 25, coins: [12, 22], color: "#7d6650", eye: "#ff4a2d" },
};

const UPGRADES = [
  { id: "damage", name: "Servo úderu", icon: "DMG", color: "#ef7133", desc: "+15 % poškození všech zbraní.", baseCost: 40, growth: 1.55, max: 15 },
  { id: "armor", name: "Pancéřové pláty", icon: "ARM", color: "#70a8c9", desc: "-6,5 % přijímaného poškození.", baseCost: 45, growth: 1.6, max: 10 },
  { id: "hp", name: "Chladicí jádro", icon: "HP", color: "#a6c36b", desc: "+20 maximální integrity a léčení.", baseCost: 35, growth: 1.5, max: 12 },
  { id: "speed", name: "Exo-servo", icon: "SPD", color: "#e8a13c", desc: "+6 % rychlosti pohybu.", baseCost: 50, growth: 1.58, max: 10 },
  { id: "luck", name: "Spektrální skener", icon: "LCK", color: "#b184d0", desc: "Vyšší šance na vzácnější zbraně.", baseCost: 60, growth: 1.62, max: 10 },
  { id: "magnet", name: "Polní magnet", icon: "MAG", color: "#69c7b7", desc: "+28 % dosah přitahování šrotu.", baseCost: 30, growth: 1.5, max: 8 },
];

var dpr = 1;
var vw = window.innerWidth;
var vh = window.innerHeight;
var state = "menu";
var modalReturn = "playing";
var soundOn = true;
var ambientTime = 0;
var gameTime = 0;
var lastFrame = performance.now();
var hudTimer = 0;
var weaponSeq = 0;
var enemySeq = 0;
var damageFlashTimer = 0;
var nearWeapon = null;
var audioCtx = null;
var noiseBuffer = null;
var player = null;
var inventory = [];
var selectedSlot = 0;
var enemies = [];
var projectiles = [];
var particles = [];
var floatTexts = [];
var pickups = [];
var effects = [];
var waveState = { number: 0, active: false, toSpawn: 0, total: 0, spawnTimer: 0, spawnInterval: 0.6, breakTimer: 0 };
var decor = null;
var kills = 0;
var totalEarned = 0;

const keys = {};
const mouse = { x: vw / 2, y: vh / 2, down: false, inside: true };
const camera = { x: 0, y: 0, shake: 0 };

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const rand = (min, max) => min + Math.random() * (max - min);
const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function angleDiff(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

function segmentCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(cx - x1, cy - y1) <= radius;
  let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = clamp(t, 0, 1);
  return Math.hypot(cx - (x1 + dx * t), cy - (y1 + dy * t)) <= radius;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function clearKeys() {
  for (const key of Object.keys(keys)) delete keys[key];
  mouse.down = false;
}

function showOverlay(el) {
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
}

function hideOverlay(el) {
  el.classList.add("hidden");
  el.setAttribute("aria-hidden", "true");
}

function hideAllOverlays() {
  [ui.startScreen, ui.shopScreen, ui.pauseScreen, ui.helpScreen, ui.gameoverScreen].forEach(hideOverlay);
}

function initAudio() {
  if (!soundOn) return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (error) {
    audioCtx = null;
  }
}

function tone(freq, endFreq, duration, type, volume, delay = 0) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, freq), now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function noise(duration, volume, cutoff, delay = 0) {
  if (!audioCtx) return;
  if (!noiseBuffer) {
    noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const now = audioCtx.currentTime + delay;
  const src = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  src.buffer = noiseBuffer;
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  gain.gain.setValueAtTime(Math.max(0.0002, volume), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  src.connect(filter).connect(gain).connect(audioCtx.destination);
  src.start(now, Math.random() * 0.5, duration);
}

function sfx(name) {
  if (!soundOn || !audioCtx) return;
  switch (name) {
    case "swing":
      noise(0.09, 0.045, 950);
      tone(175, 78, 0.09, "sawtooth", 0.018);
      break;
    case "shoot":
      tone(330, 95, 0.06, "square", 0.022);
      noise(0.045, 0.018, 1900);
      break;
    case "shotgun":
      noise(0.19, 0.075, 760);
      tone(95, 42, 0.18, "sawtooth", 0.032);
      break;
    case "hit":
      noise(0.065, 0.03, 1500);
      tone(105, 58, 0.07, "triangle", 0.025);
      break;
    case "kill":
      noise(0.25, 0.06, 520);
      tone(82, 30, 0.25, "sawtooth", 0.026);
      break;
    case "coin":
      tone(900, 1420, 0.055, "sine", 0.03);
      tone(1220, 1800, 0.075, "sine", 0.022, 0.04);
      break;
    case "pickup":
      tone(470, 760, 0.08, "triangle", 0.03);
      tone(760, 1120, 0.1, "triangle", 0.026, 0.07);
      break;
    case "hurt":
      tone(112, 44, 0.22, "sawtooth", 0.045);
      noise(0.16, 0.035, 360);
      break;
    case "upgrade":
      [440, 554, 659, 880].forEach((f, i) => tone(f, f * 1.01, 0.14, "triangle", 0.025, i * 0.06));
      break;
    case "wave":
      tone(76, 54, 0.72, "sawtooth", 0.028);
      noise(0.58, 0.018, 170);
      break;
    case "gameover":
      tone(145, 38, 1.4, "sawtooth", 0.045);
      noise(1.2, 0.035, 240);
      break;
    case "click":
      tone(310, 255, 0.04, "square", 0.016);
      break;
    default:
      break;
  }
}

function toggleSound() {
  soundOn = !soundOn;
  if (soundOn) {
    initAudio();
    sfx("click");
  }
  ui.soundBtn.textContent = soundOn ? "♪" : "×";
  ui.soundBtn.classList.toggle("off", !soundOn);
  ui.soundBtn.title = soundOn ? "Zvuk zapnut (M)" : "Zvuk vypnut (M)";
}

function flashDamage() {
  ui.damageFlash.classList.add("active");
  clearTimeout(damageFlashTimer);
  damageFlashTimer = setTimeout(() => ui.damageFlash.classList.remove("active"), 105);
}

function toast(message, kind = "") {
  const el = document.createElement("div");
  el.className = `toast ${kind}`.trim();
  el.textContent = message;
  ui.toastStack.appendChild(el);
  while (ui.toastStack.children.length > 5) ui.toastStack.firstElementChild.remove();
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 330);
  }, 2900);
}

function showBanner(title, sub = "") {
  ui.waveBanner.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ""}`;
  ui.waveBanner.classList.remove("show");
  void ui.waveBanner.offsetWidth;
  ui.waveBanner.classList.add("show");
}

function createDecor() {
  const rnd = mulberry32(0xa17e5);
  const stains = [];
  const plates = [];
  const cracks = [];
  const conveyors = [];
  const pipes = [];
  const crates = [];
  const barrels = [];
  const lamps = [];
  const vents = [];
  const embers = [];

  for (let i = 0; i < 44; i++) {
    stains.push({
      x: rnd() * WORLD.w,
      y: rnd() * WORLD.h,
      rx: 22 + rnd() * 75,
      ry: 12 + rnd() * 35,
      rot: rnd() * TAU,
      alpha: 0.12 + rnd() * 0.18,
    });
  }

  for (let i = 0; i < 18; i++) {
    plates.push({
      x: 120 + rnd() * (WORLD.w - 240),
      y: 120 + rnd() * (WORLD.h - 240),
      w: 100 + rnd() * 220,
      h: 70 + rnd() * 160,
      rot: (rnd() - 0.5) * 0.18,
      hazard: rnd() > 0.55,
    });
  }

  for (let i = 0; i < 52; i++) {
    const x = rnd() * WORLD.w;
    const y = rnd() * WORLD.h;
    const points = [];
    let px = 0;
    let py = 0;
    const count = 3 + Math.floor(rnd() * 4);
    for (let j = 0; j < count; j++) {
      px += (rnd() - 0.5) * 32;
      py += (rnd() - 0.5) * 32;
      points.push({ x: px, y: py });
    }
    cracks.push({ x, y, points, alpha: 0.18 + rnd() * 0.2 });
  }

  for (let i = 0; i < 8; i++) {
    const horizontal = rnd() > 0.45;
    conveyors.push({
      x: 180 + rnd() * (WORLD.w - 360),
      y: 180 + rnd() * (WORLD.h - 360),
      w: 220 + rnd() * 260,
      h: 34,
      vertical: !horizontal,
      dir: rnd() > 0.5 ? 1 : -1,
      speed: 45 + rnd() * 45,
    });
  }

  for (let i = 0; i < 12; i++) {
    const horizontal = rnd() > 0.5;
    const x = 100 + rnd() * (WORLD.w - 200);
    const y = 100 + rnd() * (WORLD.h - 200);
    const length = 160 + rnd() * 320;
    pipes.push({
      x1: x,
      y1: y,
      x2: horizontal ? x + length : x,
      y2: horizontal ? y : y + length,
      phase: rnd() * TAU,
    });
  }

  for (let i = 0; i < 34; i++) {
    crates.push({
      x: 90 + rnd() * (WORLD.w - 180),
      y: 90 + rnd() * (WORLD.h - 180),
      size: 24 + rnd() * 22,
      rot: rnd() * TAU,
      hazard: rnd() > 0.72,
    });
  }

  for (let i = 0; i < 26; i++) {
    barrels.push({
      x: 90 + rnd() * (WORLD.w - 180),
      y: 90 + rnd() * (WORLD.h - 180),
      r: 9 + rnd() * 5,
      color: choose(["#6b4a2a", "#5f6335", "#66503c", "#4f5c52"]),
      rot: rnd() * TAU,
    });
  }

  for (let i = 0; i < 19; i++) {
    lamps.push({
      x: 100 + rnd() * (WORLD.w - 200),
      y: 100 + rnd() * (WORLD.h - 200),
      phase: rnd() * TAU,
      radius: 120 + rnd() * 70,
    });
  }

  for (let i = 0; i < 16; i++) {
    vents.push({
      x: 100 + rnd() * (WORLD.w - 200),
      y: 100 + rnd() * (WORLD.h - 200),
      w: 28 + rnd() * 26,
      h: 18 + rnd() * 16,
      rot: rnd() > 0.5 ? 0 : Math.PI / 2,
    });
  }

  for (let i = 0; i < 42; i++) {
    embers.push({
      x: rnd() * WORLD.w,
      y: rnd() * WORLD.h,
      phase: rnd() * TAU,
      speed: 0.4 + rnd() * 1.1,
      drift: 5 + rnd() * 16,
    });
  }

  return { stains, plates, cracks, conveyors, pipes, crates, barrels, lamps, vents, embers };
}

function makeStartingWeapon() {
  const base = WEAPONS.pickaxe;
  return {
    uid: ++weaponSeq,
    template: "pickaxe",
    name: base.name,
    type: base.type,
    rarity: "common",
    rarityName: RARITIES.common.name,
    rarityColor: RARITIES.common.color,
    dmg: base.dmg,
    cd: base.cd,
    range: base.range,
    arc: base.arc,
    knock: base.knock,
    speed: 0,
    spread: 0,
    pellets: 1,
    pierce: 0,
    color: base.color,
    icon: base.icon,
  };
}

function rollRarity(luckBonus = 0) {
  const luck = player.upgrades.luck + luckBonus;
  const weights = [
    RARITIES.common.weight,
    RARITIES.uncommon.weight + luck * 2.4,
    RARITIES.rare.weight + luck * 1.7,
    RARITIES.epic.weight + luck * 1.1,
    RARITIES.legendary.weight + luck * 0.65,
  ];
  const total = weights.reduce((sum, value) => sum + value, 0);
  let roll = Math.random() * total;
  const keysList = ["common", "uncommon", "rare", "epic", "legendary"];
  for (let i = 0; i < keysList.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return keysList[i];
  }
  return "common";
}

function chooseWeaponTemplate(wave) {
  const pool = Object.entries(WEAPONS).filter(([id, base]) => id !== "pickaxe" && base.minWave <= Math.max(1, wave));
  const total = pool.reduce((sum, [, base]) => sum + base.weight, 0);
  let roll = Math.random() * total;
  for (const [id, base] of pool) {
    roll -= base.weight;
    if (roll <= 0) return id;
  }
  return pool[0][0];
}

function generateWeapon(wave, luckBonus = 0) {
  const templateId = chooseWeaponTemplate(wave);
  const base = WEAPONS[templateId];
  const rarityId = rollRarity(luckBonus);
  const rarity = RARITIES[rarityId];
  const levelScale = 1 + Math.max(0, wave - 1) * 0.1;
  return {
    uid: ++weaponSeq,
    template: templateId,
    name: `${base.name}${rarity.suffix}`,
    type: base.type,
    rarity: rarityId,
    rarityName: rarity.name,
    rarityColor: rarity.color,
    dmg: base.dmg * rarity.mult * levelScale,
    cd: base.cd * (1 - (rarity.mult - 1) * 0.045),
    range: base.range,
    arc: base.arc || 0,
    knock: base.knock || 0,
    speed: base.speed || 0,
    spread: base.spread || 0,
    pellets: base.pellets || 1,
    pierce: base.pierce || 0,
    color: base.color,
    icon: base.icon,
  };
}

function playerDamageMult() {
  return 1 + player.upgrades.damage * 0.15;
}

function playerArmor() {
  return Math.min(0.68, player.upgrades.armor * 0.065);
}

function playerSpeed() {
  return 220 * (1 + player.upgrades.speed * 0.06);
}

function playerMagnet() {
  return 105 * (1 + player.upgrades.magnet * 0.28);
}

function getMoney() {
  return player ? player.money || 0 : 0;
}

function earnMoney(amount) {
  player.money += amount;
  totalEarned += amount;
}

function spendMoney(amount) {
  if (getMoney() < amount) return false;
  player.money -= amount;
  return true;
}

function addParticle(x, y, options) {
  const life = options.life || 0.4;
  particles.push({
    x,
    y,
    vx: options.vx || 0,
    vy: options.vy || 0,
    life,
    maxLife: life,
    size: options.size || 2,
    color: options.color || "#ffffff",
    kind: options.kind || "spark",
    drag: options.drag || 4,
  });
}

function addFloatText(x, y, text, color, size = 11) {
  floatTexts.push({ x, y, text, color, life: 0.75, maxLife: 0.75, size });
}

function resetGame() {
  player = {
    x: WORLD.w / 2,
    y: WORLD.h / 2,
    radius: 16,
    hp: 100,
    maxHp: 100,
    money: 0,
    aim: 0,
    moving: false,
    walkPhase: 0,
    attackTimer: 0,
    invuln: 0,
    recoil: 0,
    dustTimer: 0,
    upgrades: { damage: 0, armor: 0, hp: 0, speed: 0, luck: 0, magnet: 0 },
  };
  inventory = [makeStartingWeapon(), null, null, null, null];
  selectedSlot = 0;
  enemies = [];
  projectiles = [];
  particles = [];
  floatTexts = [];
  pickups = [];
  effects = [];
  kills = 0;
  totalEarned = 0;
  gameTime = 0;
  hudTimer = 0;
  camera.shake = 0;
  camera.x = clamp(player.x - vw / 2, 0, Math.max(0, WORLD.w - vw));
  camera.y = clamp(player.y - vh / 2, 0, Math.max(0, WORLD.h - vh));
  waveState = { number: 0, active: false, toSpawn: 0, total: 0, spawnTimer: 0, spawnInterval: 0.6, breakTimer: 0 };
  nearWeapon = null;
  clearKeys();
  ui.interactPrompt.classList.remove("show");
  if (!decor) decor = createDecor();
  renderHotbar();
  updateHud();
}

function startGame() {
  initAudio();
  resetGame();
  hideAllOverlays();
  state = "playing";
  showBanner("VLNA 01", "OČISTĚTE SEKTOR 7");
  startWave(1);
  sfx("wave");
}

function startWave(number) {
  waveState.number = number;
  waveState.active = true;
  waveState.total = 5 + number * 2;
  waveState.toSpawn = waveState.total;
  waveState.spawnInterval = Math.max(0.18, 0.64 - number * 0.024);
  waveState.spawnTimer = 0.35;
  waveState.breakTimer = 0;
  if (number > 1) {
    showBanner(`VLNA ${String(number).padStart(2, "0")}`, "NOVÁ SIGNATURA V SEKTORU");
    sfx("wave");
  }
}

function completeWave() {
  waveState.active = false;
  waveState.breakTimer = 5;
  const bonus = 8 + waveState.number * 6;
  player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.12);
  earnMoney(bonus);
  showBanner(`VLNA ${String(waveState.number).padStart(2, "0")} OČIŠTĚNA`, `+${bonus} ŠROTU // ZÁSOBOVACÍ BEDNA`);
  toast(`Sektor pročištěn. Bonus +${bonus} šrotu.`, "good");
  const reward = generateWeapon(waveState.number, 1.5);
  spawnWeaponPickup(player.x + rand(-42, 42), player.y + rand(-42, 42), reward, 0.6, true);
  sfx("upgrade");
}

function updateHud() {
  if (!player) return;
  const pct = clamp((player.hp / player.maxHp) * 100, 0, 100);
  ui.hpFill.style.width = `${pct}%`;
  ui.hpFill.classList.toggle("low", pct < 30);
  ui.hpText.textContent = `${Math.ceil(Math.max(0, player.hp))} / ${player.maxHp}`;
  ui.money.textContent = Math.floor(getMoney());
  ui.wave.textContent = waveState.number ? String(waveState.number).padStart(2, "0") : "--";
  ui.kills.textContent = kills;
  const showStatus = state === "playing";
  ui.waveStatus.classList.toggle("show", showStatus);
  if (showStatus) {
    if (waveState.active) {
      ui.waveStatus.textContent = `NEPŘÁTELÉ ${enemies.length + waveState.toSpawn} // VLNA ${waveState.number}`;
    } else if (waveState.breakTimer > 0) {
      ui.waveStatus.textContent = `PŘESTÁVKA ${Math.ceil(waveState.breakTimer)}s // DÍLNA [B]`;
    } else {
      ui.waveStatus.textContent = "";
    }
  }
  if (state === "shop") {
    ui.shopMoney.textContent = Math.floor(getMoney());
  }
}

function updateActiveWeapon() {
  const weapon = inventory[selectedSlot];
  if (!weapon) {
    ui.activeName.textContent = "PRÁZDNÝ SLOT";
    ui.activeName.style.color = "#717a6e";
    ui.activeStats.textContent = "STISKNI E U ZBRANĚ";
    return;
  }
  ui.activeName.textContent = weapon.name;
  ui.activeName.style.color = weapon.rarityColor;
  const damage = Math.round(weapon.dmg * playerDamageMult());
  const kind = weapon.type === "melee" ? "NA BLÍZKO" : "STŘELNÁ";
  ui.activeStats.textContent = `${damage} DMG // ${weapon.cd.toFixed(2)}s // ${kind}`;
}

function weaponTitle(weapon) {
  const damage = Math.round(weapon.dmg * playerDamageMult());
  const speed = weapon.type === "melee" ? `Oblast ${weapon.arc.toFixed(1)} rad` : `Rychlost ${weapon.speed} m/s`;
  return `${weapon.name}\n${weapon.rarityName} // ${weapon.type === "melee" ? "na blízko" : "střelná"}\nPoškození: ${damage}\nProdleva: ${weapon.cd.toFixed(2)} s\n${speed}`;
}

function renderHotbar() {
  ui.hotbar.innerHTML = inventory
    .map((weapon, index) => {
      if (!weapon) {
        return `<button class="slot empty ${index === selectedSlot ? "selected" : ""}" data-slot="${index}" type="button" title="Prázdný slot ${index + 1}">
          <span class="slot-key">${index + 1}</span>
          <span class="slot-empty-mark">—</span>
          <span class="slot-name">PRÁZDNÝ</span>
        </button>`;
      }
      return `<button class="slot ${index === selectedSlot ? "selected" : ""}" data-slot="${index}" type="button" style="--rarity:${weapon.rarityColor}" title="${weaponTitle(weapon).replace(/\n/g, "&#10;")}">
        <span class="slot-key">${index + 1}</span>
        <canvas width="64" height="64"></canvas>
        <span class="slot-rarity"></span>
        <span class="slot-name">${weapon.name}</span>
      </button>`;
    })
    .join("");

  ui.hotbar.querySelectorAll("canvas").forEach((iconCanvas, index) => {
    const weapon = inventory[index];
    if (!weapon) return;
    const iconCtx = iconCanvas.getContext("2d");
    iconCtx.translate(32, 32);
    drawWeaponGlyph(iconCtx, weapon.template, weapon.color, weapon.rarityColor);
  });
  updateActiveWeapon();
}

function selectSlot(index) {
  if (index < 0 || index >= inventory.length || state !== "playing") return;
  selectedSlot = index;
  sfx("click");
  renderHotbar();
}

function dropSlot(index) {
  if (state !== "playing") return;
  const weapon = inventory[index];
  if (!weapon) {
    toast("Slot je prázdný.", "bad");
    return;
  }
  inventory[index] = null;
  spawnWeaponPickup(player.x + rand(-26, 26), player.y + rand(-26, 26), weapon, 1.1);
  for (let i = 0; i < 8; i++) {
    addParticle(player.x, player.y, {
      vx: rand(-80, 80),
      vy: rand(-80, 80),
      life: rand(0.2, 0.45),
      size: rand(1, 3),
      color: weapon.rarityColor,
      kind: "spark",
      drag: 5,
    });
  }
  toast(`${weapon.name} odhozen.`, "bad");
  sfx("click");
  renderHotbar();
}

function dropSelected() {
  dropSlot(selectedSlot);
}

function upgradeCost(def) {
  return Math.round(def.baseCost * Math.pow(def.growth, player.upgrades[def.id]));
}

function repairCost() {
  const missing = Math.max(0, player.maxHp - player.hp);
  return Math.max(8, Math.ceil(missing * 0.65));
}

function renderShop() {
  ui.shopMoney.textContent = Math.floor(getMoney());
  ui.upgradeGrid.innerHTML = UPGRADES.map((def) => {
    const level = player.upgrades[def.id];
    const maxed = level >= def.max;
    const cost = upgradeCost(def);
    const canBuy = !maxed && getMoney() >= cost;
    const pips = Array.from({ length: def.max }, (_, i) => `<span class="upgrade-pip ${i < level ? "on" : ""}"></span>`).join("");
    return `<article class="upgrade-card" style="--upgrade-color:${def.color}">
      <div class="upgrade-top">
        <div class="upgrade-icon">${def.icon}</div>
        <div class="upgrade-level">ÚROVEŇ <strong>${level}</strong> / ${def.max}</div>
      </div>
      <h3 class="upgrade-name">${def.name}</h3>
      <p class="upgrade-desc">${def.desc}</p>
      <div class="upgrade-pips">${pips}</div>
      <button class="upgrade-buy ${maxed ? "maxed" : ""}" data-upgrade="${def.id}" type="button" ${maxed || !canBuy ? "disabled" : ""}>
        ${maxed ? "MAXIMUM" : `VYLEPŠIT // ${cost} ŠROTU`}
      </button>
    </article>`;
  }).join("");

  const cost = repairCost();
  const full = player.hp >= player.maxHp - 0.1;
  ui.repairBtn.disabled = full || getMoney() < cost;
  ui.repairCost.textContent = full ? "INTEGRITA PLNÁ" : `${cost} ŠROTU`;
}

function buyUpgrade(id) {
  if (state !== "shop") return;
  const def = UPGRADES.find((item) => item.id === id);
  if (!def) return;
  const level = player.upgrades[id];
  if (level >= def.max) return;
  const cost = upgradeCost(def);
  if (!spendMoney(cost)) {
    toast("Nedostatek šrotu.", "bad");
    sfx("click");
    return;
  }
  player.upgrades[id] += 1;
  if (id === "hp") {
    player.maxHp += 20;
    player.hp = Math.min(player.maxHp, player.hp + 20);
  }
  toast(`${def.name} vylepšen na úroveň ${player.upgrades[id]}.`, "good");
  sfx("upgrade");
  renderShop();
  renderHotbar();
  updateHud();
}

function repairPlayer() {
  if (state !== "shop") return;
  const missing = player.maxHp - player.hp;
  if (missing <= 0.1) return;
  const cost = repairCost();
  if (!spendMoney(cost)) {
    toast("Nedostatek šrotu na opravu.", "bad");
    return;
  }
  player.hp = player.maxHp;
  toast("Integrita obnovena.", "good");
  sfx("upgrade");
  renderShop();
  updateHud();
}

function openShop() {
  if (state !== "playing" && state !== "paused") return;
  modalReturn = state;
  if (state === "paused") hideOverlay(ui.pauseScreen);
  state = "shop";
  clearKeys();
  showOverlay(ui.shopScreen);
  renderShop();
  sfx("click");
}

function closeShop() {
  if (state !== "shop") return;
  hideOverlay(ui.shopScreen);
  state = modalReturn;
  if (state === "paused") showOverlay(ui.pauseScreen);
  sfx("click");
}

function openHelp() {
  if (state === "shop" || state === "help" || state === "gameover") return;
  modalReturn = state;
  if (state === "paused") hideOverlay(ui.pauseScreen);
  state = "help";
  clearKeys();
  showOverlay(ui.helpScreen);
  sfx("click");
}

function closeHelp() {
  if (state !== "help") return;
  hideOverlay(ui.helpScreen);
  state = modalReturn;
  if (state === "paused") showOverlay(ui.pauseScreen);
  sfx("click");
}

function pauseGame() {
  if (state !== "playing") return;
  state = "paused";
  clearKeys();
  showOverlay(ui.pauseScreen);
  sfx("click");
}

function resumeGame() {
  if (state !== "paused") return;
  hideOverlay(ui.pauseScreen);
  state = "playing";
  sfx("click");
}

function endGame() {
  if (state === "gameover") return;
  state = "gameover";
  clearKeys();
  sfx("gameover");
  ui.gameoverStats.innerHTML = `
    <div class="gameover-stat"><span>Dosažená vlna</span><strong>${waveState.number}</strong></div>
    <div class="gameover-stat"><span>Eliminace</span><strong>${kills}</strong></div>
    <div class="gameover-stat"><span>Vyděláno</span><strong>${Math.floor(totalEarned)}</strong></div>
    <div class="gameover-stat"><span>Čas směny</span><strong>${formatTime(gameTime)}</strong></div>`;
  showOverlay(ui.gameoverScreen);
  updateHud();
}

function updateMouse(event) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
  mouse.inside = mouse.x >= 0 && mouse.y >= 0 && mouse.x <= rect.width && mouse.y <= rect.height;
}

ui.hotbar.addEventListener("click", (event) => {
  const slot = event.target.closest(".slot");
  if (slot) selectSlot(Number(slot.dataset.slot));
});

ui.hotbar.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  const slot = event.target.closest(".slot");
  if (slot) dropSlot(Number(slot.dataset.slot));
});

document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("shop-btn").addEventListener("click", openShop);
document.getElementById("sound-btn").addEventListener("click", toggleSound);
document.getElementById("help-btn").addEventListener("click", openHelp);
document.getElementById("pause-btn").addEventListener("click", pauseGame);
document.getElementById("shop-close").addEventListener("click", closeShop);
document.getElementById("help-close").addEventListener("click", closeHelp);
document.getElementById("resume-btn").addEventListener("click", resumeGame);
document.getElementById("pause-shop-btn").addEventListener("click", openShop);
document.getElementById("pause-help-btn").addEventListener("click", openHelp);
document.getElementById("restart-btn").addEventListener("click", startGame);
document.getElementById("again-btn").addEventListener("click", startGame);
document.getElementById("repair-btn").addEventListener("click", repairPlayer);

ui.upgradeGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-upgrade]");
  if (button) buyUpgrade(button.dataset.upgrade);
});

canvas.addEventListener("contextmenu", (event) => event.preventDefault());
canvas.addEventListener("pointerdown", (event) => {
  updateMouse(event);
  if (event.button === 0 && state === "playing") {
    mouse.down = true;
    if (mouse.inside && player) {
      player.aim = Math.atan2(mouse.y + camera.y - player.y, mouse.x + camera.x - player.x);
    }
    if (player && player.attackTimer <= 0) tryAttack();
    event.preventDefault();
  }
});
window.addEventListener("pointermove", updateMouse);
window.addEventListener("pointerup", (event) => {
  if (event.button === 0) mouse.down = false;
});
window.addEventListener("blur", () => {
  clearKeys();
  if (state === "playing") pauseGame();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state === "playing") pauseGame();
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
  keys[key] = true;
  if (event.repeat) return;

  if (state === "playing") {
    if (key === "b") { openShop(); return; }
    if (key === "h") { openHelp(); return; }
    if (key === "escape") { pauseGame(); return; }
    if (key === "m") { toggleSound(); return; }
    if (key === "q") { dropSelected(); return; }
    if (key === "e") { interact(); return; }
    if (key >= "1" && key <= "5") { selectSlot(Number(key) - 1); return; }
  } else if (state === "paused") {
    if (key === "escape") resumeGame();
    if (key === "b") openShop();
    if (key === "h") openHelp();
    if (key === "m") toggleSound();
  } else if (state === "shop") {
    if (key === "b" || key === "escape") closeShop();
    if (key === "m") toggleSound();
  } else if (state === "help") {
    if (key === "h" || key === "escape") closeHelp();
    if (key === "m") toggleSound();
  } else if (state === "gameover") {
    if (key === "r" || key === "enter" || key === " ") startGame();
  } else if (state === "menu") {
    if (key === "enter" || key === " ") startGame();
    if (key === "h") openHelp();
    if (key === "m") toggleSound();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});
