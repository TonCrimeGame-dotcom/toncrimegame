// TonCrime PvP (GLOBAL)
// index.html -> window.TonCrimePVP.init/start/stop/reset kullanır.

(function () {
  "use strict";

  const CFG = {
    cols: 3,
    rows: 4,
    iconSize: 64,
    padding: 10,
    spawnMinMs: 350,
    spawnMaxMs: 700,
    ttlMinMs: 900,
    ttlMaxMs: 1400,
    missSelfDmg: 4
  };

  const ACTIONS = [
    { id: "yumruk", label: "Yumruk", dmg: 10, emoji: "👊" },
    { id: "tekme",  label: "Tekme",  dmg: 15, emoji: "🦶" },
    { id: "tokat",  label: "Tokat",  dmg: 6,  emoji: "🖐️" },
    { id: "kafa",   label: "Kafa",   dmg: 20, emoji: "🤕" }
  ];

  let arena, statusEl, enemyFill, meFill, enemyHpTxt, meHpTxt;

  let running = false;
  let enemyHp = 100;
  let meHp = 100;

  let occupied = [];
  const timers = new Set();

  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function setStatus(txt) {
    if (statusEl) statusEl.textContent = "PvP • " + txt;
  }

  function updateBars() {
    if (!enemyFill || !meFill || !enemyHpTxt || !meHpTxt) return;
    enemyHpTxt.textContent = String(enemyHp);
    meHpTxt.textContent = String(meHp);
    enemyFill.style.transform = `scaleX(${clamp01(enemyHp / 100)})`;
    meFill.style.transform = `scaleX(${clamp01(meHp / 100)})`;
  }

  function clearAllTimers() {
    for (const id of timers) clearTimeout(id);
    timers.clear();
  }

  function pickFreeZone() {
    const free = [];
    for (let i = 0; i < occupied.length; i++) if (!occupied[i]) free.push(i);
    if (!free.length) return null;
    return free[randInt(0, free.length - 1)];
  }

  function zoneToXY(zoneIndex) {
    const rect = arena.getBoundingClientRect();
    const col = zoneIndex % CFG.cols;
    const row = Math.floor(zoneIndex / CFG.cols);

    const cellW = rect.width / CFG.cols;
    const cellH = rect.height / CFG.rows;

    const maxX = Math.max(0, cellW - CFG.iconSize - CFG.padding);
    const maxY = Math.max(0, cellH - CFG.iconSize - CFG.padding);

    const x = col * cellW + CFG.padding + Math.random() * maxX;
    const y = row * cellH + CFG.padding + Math.random() * maxY;

    return { x, y };
  }

  function removeAction(el, zoneIndex) {
    occupied[zoneIndex] = false;
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function applyDamageToEnemy(dmg) {
    enemyHp = Math.max(0, enemyHp - dmg);
    updateBars();
    if (enemyHp === 0) {
      stop();
      setStatus("Kazandın!");
    }
  }

  function applyDamageToMe(dmg) {
    if (dmg <= 0) return;
    meHp = Math.max(0, meHp - dmg);
    updateBars();
    if (meHp === 0) {
      stop();
      setStatus("Kaybettin!");
    }
  }

  function spawnOne() {
    if (!running || !arena) return;

    const rect = arena.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 50) return;

    const zoneIndex = pickFreeZone();
    if (zoneIndex === null) return;

    const action = ACTIONS[randInt(0, ACTIONS.length - 1)];
    const { x, y } = zoneToXY(zoneIndex);

    const el = document.createElement("div");
    el.className = "action";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.innerHTML = `<div class="emoji" aria-label="${action.label}">${action.emoji}</div>`;

    occupied[zoneIndex] = true;
    arena.appendChild(el);

    let removed = false;

    const ttl = randInt(CFG.ttlMinMs, CFG.ttlMaxMs);
    const missTimer = setTimeout(() => {
      if (removed) return;
      removed = true;
      removeAction(el, zoneIndex);
      setStatus("Kaçırdın!");
      applyDamageToMe(CFG.missSelfDmg);
    }, ttl);
    timers.add(missTimer);

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (removed) return;
      removed = true;
      clearTimeout(missTimer);
      removeAction(el, zoneIndex);
      setStatus(`${action.label} (-${action.dmg})`);
      applyDamageToEnemy(action.dmg);
    }, { passive: false });
  }

  function loopSpawn() {
    if (!running) return;
    spawnOne();
    const next = randInt(CFG.spawnMinMs, CFG.spawnMaxMs);
    const t = setTimeout(loopSpawn, next);
    timers.add(t);
  }

  function init(cfg) {
    arena = document.getElementById(cfg.arenaId);
    statusEl = document.getElementById(cfg.statusId);
    enemyFill = document.getElementById(cfg.enemyFillId);
    meFill = document.getElementById(cfg.meFillId);
    enemyHpTxt = document.getElementById(cfg.enemyHpTextId);
    meHpTxt = document.getElementById(cfg.meHpTextId);

    occupied = new Array(CFG.cols * CFG.rows).fill(false);

    enemyHp = 100;
    meHp = 100;
    updateBars();
    setStatus("Hazır");
  }

  function start() {
    if (running) return;
    running = true;
    setStatus("Başladı");
    loopSpawn();
  }

  function stop() {
    running = false;
    clearAllTimers();
    if (arena) arena.querySelectorAll(".action").forEach(n => n.remove());
    if (occupied && occupied.length) occupied.fill(false);
  }

  function reset() {
    stop();
    enemyHp = 100;
    meHp = 100;
    updateBars();
    setStatus("Hazır");
  }

  // GLOBAL EXPORT (hata buradaydı)
  window.TonCrimePVP = { init, start, stop, reset };
})();
