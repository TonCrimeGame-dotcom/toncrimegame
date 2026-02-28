/* ================================
   TonCrime - player.engine.js
   ✅ Tek parça (tam dosya)
   ✅ window.player tek kaynak
   ✅ HUD oyun alanına ( .app ) göre sağ-üstte hizalı (absolute)
   ================================ */

(function () {
  "use strict";

  /* ---------- HELPERS ---------- */
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const pad2 = (n) => String(n).padStart(2, "0");
  const fmtMMSS = (sec) => `${pad2(Math.floor(sec / 60))}:${pad2(sec % 60)}`;

  function getAppRoot() {
    // HTML bozmadan: önce .app, yoksa body
    return document.querySelector(".app") || document.body;
  }

  function ensureAppPositioning(app) {
    // HUD absolute çalışsın diye container relative olmalı
    const cs = getComputedStyle(app);
    if (cs.position === "static") app.style.position = "relative";
  }

  /* ---------- PLAYER (SINGLE SOURCE OF TRUTH) ---------- */
  const LS_KEY = "player";

  function loadPlayer() {
    let p = null;
    try {
      p = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    } catch (_) {
      p = null;
    }

    // Varsayılanlar (merkez motor burada)
    const player = {
      name: p?.name ?? "Player01",
      level: Number.isFinite(p?.level) ? Number(p.level) : 1,
      levelCap: 50,
      xp: Number.isFinite(p?.xp) ? Number(p.xp) : 0,
      xpMax: Number.isFinite(p?.xpMax) ? Number(p.xpMax) : 1000,

      // Enerji: max sabit (reklama teşvik)
      energy: Number.isFinite(p?.energy) ? Number(p.energy) : 60,
      maxEnergy: 100, // SABİT

      // Ekonomi
      yton: Number.isFinite(p?.yton) ? Number(p.yton) : 1000,

      // Silah bonusu
      weapon: p?.weapon ?? { name: "Tabanca", bonus: 0.10 },

      // Enerji timer state
      // nextEnergyAt: unix ms (1 enerji eklenecek zaman)
      nextEnergyAt: Number.isFinite(p?.nextEnergyAt) ? Number(p.nextEnergyAt) : 0,
      energyIntervalSec: 300, // 5 dk
    };

    // Normalize
    player.level = clamp(player.level, 1, player.levelCap);
    player.energy = clamp(player.energy, 0, player.maxEnergy);
    player.xp = clamp(player.xp, 0, player.xpMax);
    player.yton = Math.max(0, player.yton);

    // Timer ilk kez kuruluyorsa:
    if (!player.nextEnergyAt) {
      player.nextEnergyAt = Date.now() + player.energyIntervalSec * 1000;
    }

    return player;
  }

  function savePlayer() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(window.player));
    } catch (_) {}
  }

  // Global oyuncu
  window.player = loadPlayer();
  window.savePlayer = savePlayer; // diğer motorlar için

  /* ---------- ENERGY REGEN TICK ---------- */
  function tickEnergy() {
    const p = window.player;
    if (!p) return;

    // enerji full ise sayaç yine çalışabilir ama "reklama teşvik" için sabit max
    // full iken de nextEnergyAt ileri taşınır ki sayaç düzgün aksın
    const now = Date.now();

    // Eğer zamanı geçmişse, birden fazla enerji eklenmesini engellemek için while
    while (now >= p.nextEnergyAt) {
      if (p.energy < p.maxEnergy) p.energy += 1;
      p.energy = clamp(p.energy, 0, p.maxEnergy);
      p.nextEnergyAt += p.energyIntervalSec * 1000;
    }

    savePlayer();
  }

  /* ---------- HUD UI ---------- */
  const HUD_ID = "tcHudMini";

  function injectStyles() {
    if (document.getElementById("tcPlayerHudStyle")) return;

    const style = document.createElement("style");
    style.id = "tcPlayerHudStyle";
    style.textContent = `
      /* ===== TonCrime HUD Mini (APP'e göre hizalı) ===== */
      #${HUD_ID}{
        position:absolute;
        top:12px;
        right:12px;

        width:170px;
        padding:8px 9px;
        border-radius:14px;

        background:rgba(0,0,0,0.22);
        backdrop-filter:blur(10px);
        -webkit-backdrop-filter:blur(10px);

        font-family: Arial, sans-serif;
        color:rgba(255,255,255,0.95);
        z-index:260;

        box-shadow:none;
        border:none;
      }

      #${HUD_ID} .row{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        margin-bottom:6px;
        font-size:12px;
        font-weight:700;
      }

      #${HUD_ID} .muted{
        opacity:.9;
        font-weight:600;
        font-size:11px;
      }

      #${HUD_ID} .label{
        font-size:11px;
        font-weight:800;
        opacity:.95;
        letter-spacing:.2px;
      }

      #${HUD_ID} .bar{
        position:relative;
        height:7px;
        border-radius:999px;
        background:rgba(255,255,255,0.14);
        overflow:hidden;
        margin:4px 0 10px;
      }

      #${HUD_ID} .fill{
        height:100%;
        border-radius:999px;
        width:0%;
      }

      #${HUD_ID} .fill.energy{ background:#35ff9c; }
      #${HUD_ID} .fill.xp{ background:#ffd54a; }

      #${HUD_ID} .barText{
        position:absolute;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%);
        font-size:10px;
        font-weight:900;
        color:#fff;
        text-shadow:0 1px 2px rgba(0,0,0,0.7);
        pointer-events:none;
        white-space:nowrap;
      }

      #${HUD_ID} .divider{
        height:1px;
        background:rgba(255,255,255,0.08);
        margin:8px 0;
      }

      #${HUD_ID} .twoCol{
        display:flex;
        justify-content:space-between;
        gap:10px;
        font-size:11px;
        font-weight:800;
      }

      #${HUD_ID} .gold{ color:gold; }
      #${HUD_ID} .green{ color:#35ff9c; }
      #${HUD_ID} .yton{
        display:flex; align-items:center; justify-content:space-between;
        font-size:11px; font-weight:900;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureHud() {
    const app = getAppRoot();
    ensureAppPositioning(app);
    injectStyles();

    let hud = document.getElementById(HUD_ID);
    if (!hud) {
      hud = document.createElement("div");
      hud.id = HUD_ID;
      hud.innerHTML = `
        <div class="row">
          <div class="label" id="hudName">Player</div>
          <div class="label gold" id="hudLevel">Lv 1/50</div>
        </div>

        <div class="twoCol">
          <span class="label">Enerji</span>
          <span class="label" id="hudEnergyRight">0/100</span>
        </div>
        <div class="bar">
          <div class="fill energy" id="hudEnergyFill"></div>
          <div class="barText" id="hudEnergyText">0/100</div>
        </div>

        <div class="twoCol">
          <span class="label">XP</span>
          <span class="label" id="hudXpRight">0/1000</span>
        </div>
        <div class="bar">
          <div class="fill xp" id="hudXpFill"></div>
          <div class="barText" id="hudXpText">0/1000</div>
        </div>

        <div class="muted green" id="hudEnergyTimer">+1 enerji: 05:00</div>

        <div class="divider"></div>

        <div class="twoCol">
          <span class="label">Silah: <span class="gold" id="hudWeaponName">Tabanca</span></span>
          <span class="label gold" id="hudWeaponBonus">Bonus: +10%</span>
        </div>

        <div class="divider"></div>

        <div class="yton">
          <span class="label">YTON</span>
          <span class="label green" id="hudYton">0</span>
        </div>
      `;
      app.appendChild(hud);
    }
    return hud;
  }

  function updateHud() {
    const p = window.player;
    if (!p) return;

    ensureHud();

    // Name + level
    const hudName = document.getElementById("hudName");
    const hudLevel = document.getElementById("hudLevel");
    if (hudName) hudName.textContent = p.name;
    if (hudLevel) hudLevel.textContent = `Lv ${p.level}/${p.levelCap}`;

    // Energy
    const eFill = document.getElementById("hudEnergyFill");
    const eText = document.getElementById("hudEnergyText");
    const eRight = document.getElementById("hudEnergyRight");
    const ePct = (p.energy / p.maxEnergy) * 100;

    if (eFill) eFill.style.width = `${clamp(ePct, 0, 100)}%`;
    const eLabel = `${p.energy}/${p.maxEnergy}`;
    if (eText) eText.textContent = eLabel;
    if (eRight) eRight.textContent = eLabel;

    // XP
    const xFill = document.getElementById("hudXpFill");
    const xText = document.getElementById("hudXpText");
    const xRight = document.getElementById("hudXpRight");
    const xPct = (p.xp / p.xpMax) * 100;

    if (xFill) xFill.style.width = `${clamp(xPct, 0, 100)}%`;
    const xLabel = `${p.xp}/${p.xpMax}`;
    if (xText) xText.textContent = xLabel;
    if (xRight) xRight.textContent = xLabel;

    // Timer
    const tEl = document.getElementById("hudEnergyTimer");
    const secLeft = Math.max(0, Math.ceil((p.nextEnergyAt - Date.now()) / 1000));
    if (tEl) tEl.textContent = `+1 enerji: ${fmtMMSS(secLeft)}`;

    // Weapon
    const wName = document.getElementById("hudWeaponName");
    const wBonus = document.getElementById("hudWeaponBonus");
    if (wName) wName.textContent = p.weapon?.name ?? "Tabanca";
    const b = Number.isFinite(p.weapon?.bonus) ? p.weapon.bonus : 0.10;
    if (wBonus) wBonus.textContent = `Bonus: +${Math.round(b * 100)}%`;

    // YTON
    const yEl = document.getElementById("hudYton");
    if (yEl) yEl.textContent = String(p.yton);
  }

  /* ---------- PUBLIC API (opsiyonel) ---------- */
  window.tcPlayer = {
    addXp(amount) {
      const p = window.player;
      if (!p) return;
      p.xp = clamp(p.xp + Math.max(0, amount), 0, p.xpMax);
      savePlayer();
      updateHud();
    },
    spendEnergy(amount) {
      const p = window.player;
      if (!p) return false;
      const a = Math.max(0, amount);
      if (p.energy < a) return false;
      p.energy -= a;
      savePlayer();
      updateHud();
      return true;
    },
    addYton(amount) {
      const p = window.player;
      if (!p) return;
      p.yton = Math.max(0, p.yton + (Number(amount) || 0));
      savePlayer();
      updateHud();
    },
    setWeapon(name, bonus) {
      const p = window.player;
      if (!p) return;
      p.weapon = { name: name || "Tabanca", bonus: Number(bonus) || 0.10 };
      savePlayer();
      updateHud();
    },
  };

  /* ---------- INIT ---------- */
  function boot() {
    ensureHud();
    updateHud();

    // Enerji motoru (her saniye)
    setInterval(() => {
      tickEnergy();
      updateHud();
    }, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
