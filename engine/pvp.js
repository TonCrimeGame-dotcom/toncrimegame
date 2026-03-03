// TonCrime PvP (GLOBAL)
// index.html -> window.TonCrimePVP.init/start/stop/reset/setOpponent kullanır.

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
    missSelfDmg: 4,

    // Rakip (bot/insan simülasyonu) - anlaşılmasın diye tutarsız
    oppEnabled: true,
    oppTickMinMs: 650,
    oppTickMaxMs: 1200,
    oppHitChance: 0.72,       // her tick'te vurma ihtimali
    oppMissChance: 0.18,      // bazen "kaçırmış" gibi davran
    oppDmgMin: 4,
    oppDmgMax: 12,
    oppBurstChance: 0.12,     // bazen üst üste 2 vuruş
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

  // match meta
  let opponent = { username: "Rakip", isBot: true };
  let matchId = null;
  let dmgDone = 0;
  let dmgTaken = 0;
  let ended = false;

  let occupied = [];
  const timers = new Set();

  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randFloat() { return Math.random(); }
  function uid() { return "m_" + Date.now() + "_" + Math.floor(Math.random() * 999999); }

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

  function emitResult(kind) {
    // kind: "win" | "lose"
    if (ended) return;
    ended = true;

    const detail = { matchId, opponent, dmgDone, dmgTaken };
    const evtName = kind === "win" ? "tc:pvp:win" : "tc:pvp:lose";

    try {
      window.dispatchEvent(new CustomEvent(evtName, { detail }));
    } catch (_) {
      // CustomEvent yoksa en azından işaret bırak
      try { window.dispatchEvent(new Event(evtName)); } catch (_) {}
    }
  }

  function endMatchWin() {
    stop(); // timerları durdur, ikonları temizle
    setStatus("Kazandın!");
    emitResult("win");
  }

  function endMatchLose() {
    stop();
    setStatus("Kaybettin!");
    emitResult("lose");
  }

  function applyDamageToEnemy(dmg) {
    if (ended) return;
    dmgDone += dmg;

    enemyHp = Math.max(0, enemyHp - dmg);
    updateBars();

    if (enemyHp === 0) {
      endMatchWin();
    }
  }

  function applyDamageToMe(dmg, reasonText) {
    if (ended) return;
    if (dmg <= 0) return;

    dmgTaken += dmg;

    meHp = Math.max(0, meHp - dmg);
    updateBars();

    if (reasonText) setStatus(reasonText);

    if (meHp === 0) {
      endMatchLose();
    }
  }

  function spawnOne() {
    if (!running || !arena || ended) return;

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
      if (removed || ended) return;
      removed = true;
      removeAction(el, zoneIndex);
      applyDamageToMe(CFG.missSelfDmg, "Kaçırdın!");
    }, ttl);
    timers.add(missTimer);

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (removed || ended) return;
      removed = true;
      clearTimeout(missTimer);
      removeAction(el, zoneIndex);
      setStatus(`${action.label} (-${action.dmg})`);
      applyDamageToEnemy(action.dmg);
    }, { passive: false });
  }

  function loopSpawn() {
    if (!running || ended) return;
    spawnOne();
    const next = randInt(CFG.spawnMinMs, CFG.spawnMaxMs);
    const t = setTimeout(loopSpawn, next);
    timers.add(t);
  }

  // Rakip "vuruyor" simülasyonu (bot anlaşılmasın)
  function scheduleOpponentTick() {
    if (!running || ended || !CFG.oppEnabled) return;

    const next = randInt(CFG.oppTickMinMs, CFG.oppTickMaxMs);
    const t = setTimeout(() => {
      if (!running || ended) return;

      // bazen miss / bazen hit / bazen hiçbir şey
      const r = randFloat();

      // "miss gibi" davran: status değişsin ama hasar verme
      if (r < CFG.oppMissChance) {
        setStatus(`${opponent.username} kaçırdı`);
      } else if (r < CFG.oppMissChance + CFG.oppHitChance) {
        const dmg = randInt(CFG.oppDmgMin, CFG.oppDmgMax);
        applyDamageToMe(dmg, `${opponent.username} vurdu (-${dmg})`);

        // burst: bazen üst üste bir tane daha
        if (!ended && randFloat() < CFG.oppBurstChance) {
          const t2 = setTimeout(() => {
            if (!running || ended) return;
            const dmg2 = randInt(CFG.oppDmgMin, CFG.oppDmgMax);
            applyDamageToMe(dmg2, `${opponent.username} seri vurdu (-${dmg2})`);
          }, randInt(160, 420));
          timers.add(t2);
        }
      } else {
        // sessiz tick: hiçbir şey yapma
      }

      scheduleOpponentTick();
    }, next);

    timers.add(t);
  }

  function setOpponent(o) {
    opponent = o && typeof o === "object" ? o : { username: "Rakip", isBot: true };
    matchId = uid();
  }

  function init(cfg) {
    arena = document.getElementById(cfg.arenaId);
    statusEl = document.getElementById(cfg.statusId);
    enemyFill = document.getElementById(cfg.enemyFillId);
    meFill = document.getElementById(cfg.meFillId);
    enemyHpTxt = document.getElementById(cfg.enemyHpTextId);
    meHpTxt = document.getElementById(cfg.meHpTextId);

    occupied = new Array(CFG.cols * CFG.rows).fill(false);

    // ilk init default match
    setOpponent({ username: "Rakip", isBot: true });

    enemyHp = 100;
    meHp = 100;
    dmgDone = 0;
    dmgTaken = 0;
    ended = false;

    updateBars();
    setStatus("Hazır");
  }

  function start() {
    if (running) return;
    running = true;

    // yeni maç başlarken sayaçları sıfırla
    ended = false;
    dmgDone = 0;
    dmgTaken = 0;
    if (!matchId) matchId = uid();

    setStatus("Başladı");
    loopSpawn();
    scheduleOpponentTick();
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
    dmgDone = 0;
    dmgTaken = 0;
    ended = false;
    updateBars();
    setStatus("Hazır");
  }

  window.TonCrimePVP = { init, start, stop, reset, setOpponent };
})();
