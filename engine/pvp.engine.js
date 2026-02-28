/* ================= PVP ENGINE =================
   KURAL: PvP içinde player oluşturmak YASAK.
   Sadece: const player = window.player;
================================================= */

const player = window.player;

(function () {
  // Güvenlik: window.player yoksa kırmadan uyar
  if (!player) {
    console.error("[PVP] window.player bulunamadı. player.engine.js window.player set etmeli.");
    alert("Hata: Player motoru yüklenmedi (window.player yok).");
    return;
  }

  /* ===== CSS (global.css'e dokunmadan PVP'yi garanti göstermek için) ===== */
  const style = document.createElement("style");
  style.textContent = `
    .pvp-card{
      position:absolute;
      left:50%;
      top:50%;
      transform:translate(-50%,-40%);
      width:320px;
      max-width:calc(100% - 30px);
      background:rgba(0,0,0,0.55);
      border:1px solid rgba(255,215,0,0.55);
      border-radius:18px;
      padding:14px 14px 12px;
      color:#fff;
      z-index:40;
      backdrop-filter: blur(6px);
    }
    .pvp-title{
      text-align:center;
      font-weight:700;
      color:gold;
      letter-spacing:.5px;
      margin-bottom:10px;
    }
    .pvp-row{
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:10px;
      font-size:12px;
      opacity:.95;
    }
    .pvp-label{ color:#d9d9d9; }
    .pvp-value{ color:gold; font-weight:700; }

    .pvp-players{
      display:flex;
      gap:10px;
      align-items:flex-start;
      justify-content:space-between;
      margin-bottom:10px;
    }
    .pvp-side{ width:46%; }
    .pvp-vs{
      width:8%;
      text-align:center;
      color:gold;
      font-weight:800;
      margin-top:16px;
      opacity:.9;
    }
    .pvp-name{ font-weight:800; color:#fff; font-size:13px; margin-bottom:6px; }
    .pvp-hptext{ font-size:12px; color:#d9d9d9; margin-bottom:6px; }

    .pvp-bar{
      width:100%;
      height:10px;
      border-radius:999px;
      background:rgba(255,255,255,0.14);
      overflow:hidden;
    }
    .pvp-fill{
      height:100%;
      width:0%;
      background:linear-gradient(90deg, #2ee59d, #ffd700);
      border-radius:999px;
      transition:width .2s ease;
    }
    .pvp-mini{
      margin-top:6px;
      font-size:11px;
      color:#cfcfcf;
      opacity:.95;
    }
    .pvp-actions{
      display:flex;
      gap:8px;
      margin:10px 0 8px;
    }
    .pvp-btn{
      flex:1;
      padding:10px 10px;
      border:none;
      border-radius:12px;
      background:gold;
      color:#111;
      font-weight:800;
      cursor:pointer;
    }
    .pvp-btn:disabled{
      opacity:.45;
      cursor:not-allowed;
    }
    .pvp-btn.ghost{
      background:rgba(255,255,255,0.12);
      color:#fff;
      border:1px solid rgba(255,215,0,0.35);
    }
    .pvp-log{
      height:110px;
      overflow:auto;
      background:rgba(0,0,0,0.35);
      border:1px solid rgba(255,215,0,0.22);
      border-radius:12px;
      padding:8px;
      font-size:11px;
      line-height:1.35;
    }
    .pvp-log div{ margin-bottom:6px; }
  `;
  document.head.appendChild(style);

  /* ===== Helpers ===== */
  const $ = (id) => document.getElementById(id);

  const statusEl = $("pvpStatus");
  const logEl = $("pvpLog");

  const meName = $("meName");
  const meHpText = $("meHpText");
  const meHpBar = $("meHpBar");
  const meStats = $("meStats");

  const opName = $("opName");
  const opHpText = $("opHpText");
  const opHpBar = $("opHpBar");
  const opStats = $("opStats");

  const findBtn = $("findBtn");
  const startBtn = $("startBtn");
  const resetBtn = $("resetBtn");

  function log(msg) {
    const d = document.createElement("div");
    d.textContent = msg;
    logEl.appendChild(d);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function savePlayer() {
    // player.engine.js’in kullandığı format ile uyumlu: localStorage 'player'
    try {
      localStorage.setItem("player", JSON.stringify(player));
    } catch (e) {
      console.warn("[PVP] player save error", e);
    }
  }

  function weaponBonusPct() {
    const b = Number(player?.weapon?.bonus ?? 0);
    return isFinite(b) ? b : 0;
  }

  function initMe() {
    // Varsayılanlar player.engine.js’te olmalı; burada sadece okunur
    const username = player.username || "Player01";
    const atkBase = Number(player.atkBase ?? 10);
    const bonus = weaponBonusPct();

    state.me = {
      name: username,
      hp: 100,
      hpMax: 100,
      atk: atkBase,
      bonus
    };

    meName.textContent = state.me.name;
    meStats.textContent = `ATK: ${state.me.atk} • Bonus: +${Math.round(state.me.bonus * 100)}%`;
    renderBars();
  }

  function renderBars() {
    const mePct = (state.me.hp / state.me.hpMax) * 100;
    meHpBar.style.width = `${clamp(mePct, 0, 100)}%`;
    meHpText.textContent = `HP: ${state.me.hp}/${state.me.hpMax}`;

    if (state.op) {
      const opPct = (state.op.hp / state.op.hpMax) * 100;
      opHpBar.style.width = `${clamp(opPct, 0, 100)}%`;
      opHpText.textContent = `HP: ${state.op.hp}/${state.op.hpMax}`;
    } else {
      opHpBar.style.width = "0%";
      opHpText.textContent = "HP: -";
      opStats.textContent = "ATK: -";
      opName.textContent = "Rakip";
    }
  }

  /* ===== PvP State ===== */
  const state = {
    me: null,
    op: null,
    finding: false,
    fighting: false,
    tick: null
  };

  const names = ["Shadow", "Viper", "Razor", "NightFox", "Kobra", "Ghost", "Bishop", "Havoc", "Zero", "Titan"];

  function findOpponent() {
    if (state.finding || state.fighting) return;
    state.finding = true;
    startBtn.disabled = true;
    statusEl.textContent = "Rakip aranıyor...";
    log("🔎 Rakip aranıyor...");

    // 2 sn sonra rakip bul
    setTimeout(() => {
      const n = names[Math.floor(Math.random() * names.length)] + "#" + Math.floor(100 + Math.random() * 900);
      const lvl = clamp(Number(player.level ?? 1) + (Math.random() < 0.5 ? 0 : 1), 1, 50);

      // Rakip gücü level’e göre
      const opHpMax = 90 + lvl * 3;          // 93..240
      const opAtk = 8 + Math.floor(lvl / 2); // 8..33

      state.op = { name: n, level: lvl, hpMax: opHpMax, hp: opHpMax, atk: opAtk };

      opName.textContent = `${state.op.name}`;
      opStats.textContent = `ATK: ${state.op.atk} • Lv: ${state.op.level}`;
      renderBars();

      state.finding = false;
      statusEl.textContent = "Rakip bulundu!";
      log(`✅ Rakip bulundu: ${state.op.name} (Lv ${state.op.level})`);

      startBtn.disabled = false;
    }, 2000);
  }

  function startFight() {
    if (!state.op || state.fighting) return;
    state.fighting = true;
    startBtn.disabled = true;
    findBtn.disabled = true;
    statusEl.textContent = "Savaş başladı!";
    log("⚔️ Maç başladı!");

    // enerji maliyeti (istersen)
    if (typeof player.energy === "number") {
      player.energy = Math.max(0, player.energy - 5);
      savePlayer();
    }

    // turn-based: her 900ms bir tur
    state.tick = setInterval(() => {
      if (!state.fighting) return;

      // Sen vur
      const myDmg = calcDamage(state.me.atk, state.me.bonus);
      state.op.hp = clamp(state.op.hp - myDmg, 0, state.op.hpMax);
      log(`🟢 Sen vurdun: -${myDmg} HP`);
      renderBars();

      if (state.op.hp <= 0) {
        finish(true);
        return;
      }

      // Rakip vur
      const opDmg = calcDamage(state.op.atk, 0);
      state.me.hp = clamp(state.me.hp - opDmg, 0, state.me.hpMax);
      log(`🔴 Rakip vurdu: -${opDmg} HP`);
      renderBars();

      if (state.me.hp <= 0) {
        finish(false);
        return;
      }
    }, 900);
  }

  function calcDamage(baseAtk, bonus) {
    // Basit ama düzgün: bonus + rastgele
    const roll = 0.85 + Math.random() * 0.35; // 0.85..1.20
    const dmg = Math.round(baseAtk * roll * (1 + (bonus || 0)));
    return clamp(dmg, 1, 999);
  }

  function finish(win) {
    clearInterval(state.tick);
    state.tick = null;
    state.fighting = false;

    if (win) {
      statusEl.textContent = "Kazandın!";
      log("🏆 Kazandın!");

      const rewardYton = 30 + Math.floor(Math.random() * 40); // 30-69
      const rewardXp = 80 + Math.floor(Math.random() * 60);   // 80-139

      // ÖDÜLLER (player.engine.js bunları gösteriyor olmalı)
      player.yton = Number(player.yton ?? 0) + rewardYton;
      player.xp = Number(player.xp ?? 0) + rewardXp;

      // level cap 50 kilidi (senin kuralın)
      player.level = clamp(Number(player.level ?? 1), 1, 50);

      savePlayer();

      log(`💰 Ödül: +${rewardYton} YTON`);
      log(`⭐ Ödül: +${rewardXp} XP`);
      log("✅ Kaydedildi (localStorage: player).");
    } else {
      statusEl.textContent = "Kaybettin!";
      log("💀 Kaybettin!");

      // Ceza
      player.energy = Math.max(0, Number(player.energy ?? 0) - 10);
      savePlayer();
      log("⚡ Ceza: -10 enerji (kaydedildi).");
    }

    // Butonları aç
    findBtn.disabled = false;
    startBtn.disabled = true;
  }

  function resetPvp() {
    clearInterval(state.tick);
    state.tick = null;
    state.finding = false;
    state.fighting = false;
    state.op = null;

    logEl.innerHTML = "";
    statusEl.textContent = "Hazır";

    findBtn.disabled = false;
    startBtn.disabled = true;

    initMe();
    renderBars();
    log("↺ PvP sıfırlandı.");
  }

  /* ===== Bind ===== */
  findBtn.addEventListener("click", findOpponent);
  startBtn.addEventListener("click", startFight);
  resetBtn.addEventListener("click", resetPvp);

  /* ===== Init ===== */
  initMe();
  resetPvp();
})();
