/* =========================================================
   TONCRIME - player.engine.js (TEK PARÇA)
   - window.player tek kaynak
   - Enerji regen (5dk +1)
   - HUD + Logo + Saat/Tarih + Online
   - ✅ SADECE BAR İÇİ YAZI (üst satır label yok)
   ========================================================= */

(function () {
  "use strict";

  // ---------- SAFE PLAYER INIT ----------
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem("player") || "null"); }
    catch { return null; }
  })();

  const player = (saved && typeof saved === "object") ? saved : {};
  player.name = player.name ?? "Player01";

  // Enerji
  player.energy = Number.isFinite(+player.energy) ? +player.energy : 60;
  player.maxEnergy = 100; // SABİT
  // XP / Level
  player.xp = Number.isFinite(+player.xp) ? +player.xp : 0;
  player.xpMax = Number.isFinite(+player.xpMax) ? +player.xpMax : 1000;
  player.level = Number.isFinite(+player.level) ? +player.level : 1;
  player.levelCap = 50;

  // Para
  player.yton = Number.isFinite(+player.yton) ? +player.yton : 1000;

  // Silah bonus
  player.weapon = player.weapon ?? { name: "Tabanca", bonus: 0.10 };

  // Regen timer
  player.lastEnergyTs = Number.isFinite(+player.lastEnergyTs)
    ? +player.lastEnergyTs
    : Date.now();

  window.player = player;

  function save() {
    localStorage.setItem("player", JSON.stringify(player));
  }

  // ---------- ENERGY REGEN ----------
  const ENERGY_INTERVAL_MS = 5 * 60 * 1000; // 5 dakika
  function regenTick() {
    const now = Date.now();
    const passed = now - player.lastEnergyTs;
    if (passed <= 0) return;

    const gained = Math.floor(passed / ENERGY_INTERVAL_MS);
    if (gained > 0) {
      const before = player.energy;
      player.energy = Math.min(player.maxEnergy, player.energy + gained);
      player.lastEnergyTs += gained * ENERGY_INTERVAL_MS;
      if (player.energy !== before) save();
    }
  }

  function msToMMSS(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function nextEnergyIn() {
    if (player.energy >= player.maxEnergy) return "FULL";
    const now = Date.now();
    const passed = now - player.lastEnergyTs;
    const left = ENERGY_INTERVAL_MS - (passed % ENERGY_INTERVAL_MS);
    return msToMMSS(left);
  }

  // ---------- UI BUILD (HTML'e dokunmadan) ----------
  function ensureAppRoot() {
    return document.querySelector(".app") || null;
  }

  function ensureLogo(app) {
    if (document.querySelector(".tc-logo")) return;
    const img = document.createElement("img");
    img.className = "tc-logo";
    img.src = "assets/logo.png";
    img.alt = "TonCrime";
    app.appendChild(img);
  }

  function ensureTopbar(app) {
    if (document.querySelector(".tc-topbar")) return;

    const wrap = document.createElement("div");
    wrap.className = "tc-topbar";
    wrap.style.position = "absolute";
    wrap.style.top = "8px";
    wrap.style.left = "50%";
    wrap.style.transform = "translateX(-50%)";
    wrap.style.zIndex = "280";
    wrap.style.display = "flex";
    wrap.style.gap = "10px";
    wrap.style.alignItems = "center";
    app.appendChild(wrap);

    const time = document.createElement("div");
    time.className = "time-pill";
    time.style.padding = "6px 10px";
    time.style.borderRadius = "999px";
    time.style.color = "#fff";
    time.style.fontWeight = "700";
    time.style.fontSize = "12px";
    wrap.appendChild(time);

    const online = document.createElement("div");
    online.className = "online-pill";
    online.style.padding = "6px 10px";
    online.style.borderRadius = "999px";
    online.style.color = "#fff";
    online.style.fontWeight = "700";
    online.style.fontSize = "12px";
    online.innerHTML = `🟢 <span id="tcOnlineNum">195</span>`;
    wrap.appendChild(online);
  }

  function ensureHUD(app) {
    let hud = document.querySelector(".hud-card");
    if (!hud) {
      hud = document.createElement("div");
      hud.className = "hud-card";
      app.appendChild(hud);
    }
    if (hud.dataset.built === "1") return;

    hud.dataset.built = "1";
    hud.innerHTML = `
      <div class="hud-row">
        <div>👤 <span id="tcName"></span></div>
        <div><span id="tcWeapon"></span> (<span id="tcWeaponBonus"></span>)</div>
      </div>

      <div class="hud-row" style="color:#ffd54a; opacity:.95;">
        <div></div>
        <div>+1 enerji: <span id="tcEnergyTimer"></span></div>
      </div>

      <!-- ✅ ENERGY BAR (TEXT INSIDE ONLY) -->
      <div class="hud-bar" id="tcEnergyBar">
        <div class="hud-fill-energy" id="tcEnergyFill"></div>
        <span class="hud-bar-text" id="tcEnergyBarText"></span>
      </div>

      <div class="hud-row" style="color:#fff; opacity:.95;">
        <div></div>
        <div style="color:#ffd54a;">Lv cap: <span id="tcLevelCap"></span></div>
      </div>

      <!-- ✅ XP BAR (TEXT INSIDE ONLY) -->
      <div class="hud-bar" id="tcXpBar">
        <div class="hud-fill-xp" id="tcXpFill"></div>
        <span class="hud-bar-text" id="tcXpBarText"></span>
      </div>

      <div class="hud-bottom" style="color:#fff;">
        <div class="yton-line">
          <img src="assets/yton.png" alt="yton"/>
          <span id="tcYton"></span>
        </div>
        <div class="weapon-line" style="color:#ffd54a;">Bonus: <span id="tcBonus"></span></div>
      </div>

      <div class="hud-bottom" style="color:#fff; opacity:.9;">
        <div></div>
        <div id="tcLevelCapInfo" style="color:#fff;"></div>
      </div>
    `;

    // ✅ DÜZGÜN BOYUTLANDIRMA (sayfa fark etmez)
    const style = document.createElement("style");
    style.textContent = `
      .hud-bar{ position:relative; }
      .hud-bar-text{
        position:absolute;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%);
        font-size:12px;
        font-weight:800;
        color:rgba(255,255,255,0.95);
        text-shadow:0 2px 6px rgba(0,0,0,0.85);
        pointer-events:none;
        white-space:nowrap;
        letter-spacing:.2px;
        z-index:5;
      }
      @media (max-width:420px){
        .hud-bar-text{ font-size:11px; }
      }
    `;
    document.head.appendChild(style);
  }

  function pad2(n) { return String(n).padStart(2, "0"); }
  function updateTimeUI() {
    const el = document.querySelector(".tc-topbar .time-pill");
    if (!el) return;
    const d = new Date();
    const t = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    const date = `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`;
    el.textContent = `${t} ${date}`;
  }

  function updateHUD() {
    regenTick();

    const nameEl = document.getElementById("tcName");
    const weaponEl = document.getElementById("tcWeapon");
    const weaponBonusEl = document.getElementById("tcWeaponBonus");
    const energyTimer = document.getElementById("tcEnergyTimer");
    const energyFill = document.getElementById("tcEnergyFill");
    const energyBarText = document.getElementById("tcEnergyBarText");

    const xpFill = document.getElementById("tcXpFill");
    const xpBarText = document.getElementById("tcXpBarText");

    const levelCap = document.getElementById("tcLevelCap");
    const ytonEl = document.getElementById("tcYton");
    const bonusEl = document.getElementById("tcBonus");
    const capInfo = document.getElementById("tcLevelCapInfo");

    if (!nameEl) return;

    const wBonusPct = Math.round((player.weapon.bonus || 0) * 100);

    nameEl.textContent = player.name;
    weaponEl.textContent = player.weapon.name;
    weaponBonusEl.textContent = `+${wBonusPct}%`;

    energyTimer.textContent = nextEnergyIn();

    // ENERGY
    const ePct = (player.maxEnergy > 0) ? (player.energy / player.maxEnergy) * 100 : 0;
    energyFill.style.width = `${Math.max(0, Math.min(100, ePct))}%`;
    energyBarText.textContent = `Enerji: ⚡${player.energy}/${player.maxEnergy}`;

    // XP
    const xPct = (player.xpMax > 0) ? (player.xp / player.xpMax) * 100 : 0;
    xpFill.style.width = `${Math.max(0, Math.min(100, xPct))}%`;
    xpBarText.textContent = `XP: ${player.xp}/${player.xpMax} (Lv ${player.level})`;

    levelCap.textContent = player.levelCap;
    ytonEl.textContent = String(player.yton);
    bonusEl.textContent = `+${wBonusPct}%`;

    capInfo.textContent = (player.level >= player.levelCap) ? "Level cap aktif" : "";
    updateTimeUI();
  }

  // ---------- INIT ----------
  document.addEventListener("DOMContentLoaded", () => {
    const app = ensureAppRoot();
    if (!app) return;

    ensureLogo(app);
    ensureTopbar(app);
    ensureHUD(app);

    updateHUD();
    setInterval(updateHUD, 1000);

    save();
  });

})();
