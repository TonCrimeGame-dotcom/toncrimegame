(() => {
  const STORAGE_KEY = "tc_player_v1";

  const DEFAULT_PLAYER = {
    username: "Player01",
    energy: 60,
    maxEnergy: 100,          // SABİT
    lastEnergyTick: Date.now(),
    energyTickMinutes: 5,    // 5 dk'da +1
    xp: 0,
    xpMax: 1000,
    level: 1,
    levelCap: 50,            // 50 kilit
    yton: 1000,
    weapon: { name: "Tabanca", bonus: 0.10 } // +10%
  };

  function loadPlayer() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const p = raw ? JSON.parse(raw) : {};
      return {
        ...DEFAULT_PLAYER,
        ...p,
        weapon: { ...DEFAULT_PLAYER.weapon, ...(p.weapon || {}) }
      };
    } catch {
      return { ...DEFAULT_PLAYER };
    }
  }

  function savePlayer(p) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }

  // enerji timer: sayfa açıkken / kapalıyken fark etmez
  function applyEnergyTick(p) {
    const now = Date.now();
    const stepMs = p.energyTickMinutes * 60 * 1000;
    const elapsed = Math.floor((now - (p.lastEnergyTick || now)) / stepMs);
    if (elapsed > 0) {
      p.energy = Math.min(p.maxEnergy, p.energy + elapsed);
      p.lastEnergyTick = (p.lastEnergyTick || now) + elapsed * stepMs;
      savePlayer(p);
    }
    return p;
  }

  function levelFromXp(p) {
    // Basit: xpMax sabit 1000, her 1000 xp = +1 level (cap 50)
    const gained = Math.floor(p.xp / p.xpMax);
    const newLevel = Math.min(p.levelCap, 1 + gained);
    p.level = newLevel;
    return p;
  }

  function formatTimeTR(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}.${pad(d.getMonth()+1)}`;
  }

  // UI build
  function buildUI() {
    const app = document.querySelector(".app");
    if (!app) return;

    // logo (sadece yoksa ekle)
    if (!document.querySelector(".tc-logo")) {
      const logo = document.createElement("img");
      logo.className = "tc-logo";
      logo.src = "assets/logo.png";
      logo.alt = "TonCrime";
      app.appendChild(logo);
    }

    // top right time/online
    if (!document.querySelector(".tc-topright")) {
      const tr = document.createElement("div");
      tr.className = "tc-topright";
      tr.innerHTML = `
        <div class="tc-pill" id="tcTime">--:--</div>
        <div class="tc-pill">🟢 <span id="tcOnline">0</span></div>
      `;
      app.appendChild(tr);
    }

    // hud panel
    if (!document.querySelector(".tc-hud")) {
      const hud = document.createElement("div");
      hud.className = "tc-hud";
      hud.innerHTML = `
        <div class="tc-hud-row">
          <div>👤 <span id="tcUser">Player01</span></div>
          <div class="tc-sub" id="tcWeapon">Tabanca (+10%)</div>
        </div>

        <div class="tc-hud-mini" style="margin-top:10px;">
          <div id="tcEnergyText">⚡ 0/100</div>
          <div class="tc-sub" id="tcEnergyNext">+1 enerji: 00:00</div>
        </div>
        <div class="tc-bar"><div class="tc-fill energy" id="tcEnergyBar"></div></div>

        <div class="tc-hud-mini">
          <div id="tcXpText">XP 0/1000 (Lv 1)</div>
          <div class="tc-sub">Lv cap: 50</div>
        </div>
        <div class="tc-bar"><div class="tc-fill xp" id="tcXpBar"></div></div>

        <div class="tc-hud-mini">
          <div class="tc-yton">
            <img src="assets/yton.png" alt="YTON">
            <span id="tcYton">1000</span>
          </div>
          <div class="tc-sub">Bonus: <span id="tcBonus">+10%</span></div>
        </div>
      `;
      app.appendChild(hud);
    }
  }

  function updateUI(p) {
    const now = Date.now();

    const userEl = document.getElementById("tcUser");
    if (userEl) userEl.textContent = p.username;

    // weapon
    const bonusPct = Math.round((p.weapon.bonus || 0) * 100);
    const wEl = document.getElementById("tcWeapon");
    const bEl = document.getElementById("tcBonus");
    if (wEl) wEl.textContent = `${p.weapon.name} (+${bonusPct}%)`;
    if (bEl) bEl.textContent = `+${bonusPct}%`;

    // energy text + bar + next tick countdown
    const eText = document.getElementById("tcEnergyText");
    const eBar = document.getElementById("tcEnergyBar");
    if (eText) eText.textContent = `⚡ ${p.energy}/${p.maxEnergy}`;
    if (eBar) eBar.style.width = `${Math.max(0, Math.min(100, (p.energy / p.maxEnergy) * 100))}%`;

    const nextEl = document.getElementById("tcEnergyNext");
    const stepMs = p.energyTickMinutes * 60 * 1000;
    const next = (p.lastEnergyTick || now) + stepMs;
    let remain = Math.max(0, next - now);
    const mm = String(Math.floor(remain / 60000)).padStart(2, "0");
    const ss = String(Math.floor((remain % 60000) / 1000)).padStart(2, "0");
    if (nextEl) {
      nextEl.textContent = (p.energy >= p.maxEnergy) ? "Enerji dolu" : `+1 enerji: ${mm}:${ss}`;
    }

    // xp
    const xpText = document.getElementById("tcXpText");
    const xpBar = document.getElementById("tcXpBar");
    const xpInLevel = p.xp % p.xpMax;
    if (xpText) xpText.textContent = `XP ${xpInLevel}/${p.xpMax} (Lv ${p.level})`;
    if (xpBar) xpBar.style.width = `${Math.max(0, Math.min(100, (xpInLevel / p.xpMax) * 100))}%`;

    // yton
    const yEl = document.getElementById("tcYton");
    if (yEl) yEl.textContent = p.yton;

    // time
    const tEl = document.getElementById("tcTime");
    if (tEl) tEl.textContent = formatTimeTR(new Date());

    // online (local sahte)
    const oEl = document.getElementById("tcOnline");
    if (oEl) {
      // stabilize: aynı oturumda çok zıplamasın
      let online = Number(sessionStorage.getItem("tc_online") || 0);
      if (!online) {
        online = 120 + Math.floor(Math.random() * 80);
        sessionStorage.setItem("tc_online", String(online));
      } else {
        // ufak oynat
        online += (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.7 ? 1 : 0);
        online = Math.max(80, Math.min(400, online));
        sessionStorage.setItem("tc_online", String(online));
      }
      oEl.textContent = online;
    }
  }

  // PUBLIC API (diğer sayfalar PvP dahil buradan kullanacak)
  const player = applyEnergyTick(levelFromXp(loadPlayer()));
  window.player = player;

  window.savePlayer = function savePlayerPublic() {
    savePlayer(window.player);
  };

  // örnek helper (PvP/mission kullanabilir)
  window.addXP = function addXP(amount) {
    const p = window.player;
    p.xp = Math.max(0, Number(p.xp) + Number(amount || 0));
    levelFromXp(p);
    savePlayer(p);
    updateUI(p);
  };

  window.spendYton = function spendYton(amount) {
    const p = window.player;
    const a = Number(amount || 0);
    if (p.yton < a) return false;
    p.yton -= a;
    savePlayer(p);
    updateUI(p);
    return true;
  };

  window.addEnergy = function addEnergy(amount) {
    const p = window.player;
    p.energy = Math.min(p.maxEnergy, p.energy + Number(amount || 0));
    savePlayer(p);
    updateUI(p);
  };

  document.addEventListener("DOMContentLoaded", () => {
    buildUI();
    // ilk render
    updateUI(window.player);

    // her 1 sn: timer + enerji tick
    setInterval(() => {
      window.player = applyEnergyTick(window.player);
      updateUI(window.player);
    }, 1000);
  });
})();
