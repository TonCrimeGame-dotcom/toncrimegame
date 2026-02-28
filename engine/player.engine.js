/* =========================
   TonCrime - PLAYER ENGINE
   MINI HUD (sağ üst) + enerji timer + silah bonus
   Eski HUD'u gizler
   ========================= */

(() => {
  // ---------- CONFIG ----------
  const ENERGY_MAX = 100;           // sabit
  const ENERGY_REGEN_SEC = 300;     // 5 dk
  const XP_MAX_DEFAULT = 1000;
  const LEVEL_CAP = 50;

  // ---------- SAFE GLOBAL PLAYER ----------
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem("player") || "null"); }
    catch { return null; }
  })();

  const player = (window.player = saved && typeof saved === "object" ? saved : {});
  player.name = String(player.name ?? "Player01");
  player.energy = Number.isFinite(+player.energy) ? +player.energy : 60;
  player.maxEnergy = ENERGY_MAX; // sabit
  player.xp = Number.isFinite(+player.xp) ? +player.xp : 0;
  player.xpMax = Number.isFinite(+player.xpMax) ? +player.xpMax : XP_MAX_DEFAULT;
  player.level = Number.isFinite(+player.level) ? +player.level : 1;
  player.yton = Number.isFinite(+player.yton) ? +player.yton : 1000;

  player.weapon = player.weapon && typeof player.weapon === "object" ? player.weapon : {
    name: "Tabanca",
    bonus: 0.10
  };

  player._regen = player._regen && typeof player._regen === "object" ? player._regen : {};
  player._regen.nextEnergyAt = Number.isFinite(+player._regen.nextEnergyAt)
    ? +player._regen.nextEnergyAt
    : (Date.now() + ENERGY_REGEN_SEC * 1000);

  function save() {
    try { localStorage.setItem("player", JSON.stringify(player)); } catch {}
  }

  // ---------- DOM HELPERS ----------
  const $ = (id) => document.getElementById(id);

  function hideOldHud() {
    // Eski HUD altta kalıyorsa tamamen gizle
    const styleId = "tcHideOldHud";
    if (document.getElementById(styleId)) return;
    const s = document.createElement("style");
    s.id = styleId;
    s.textContent = `
      /* Eski HUD'ları gizle (mini HUD varken) */
      .hud, .hud-card, #hud, #hudCard, #hud-card, #hudBox,
      .tc-hud, .tcHud, .player-hud, .playerHud,
      #energyText, #xpText, #ytonText, #weaponText,
      .energyText, .xpText, .ytonText, .weaponText {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(s);
  }

  // ---------- HUD DOM ----------
  function ensureHUD() {
    if (document.getElementById("tcHudMini")) return;

    const style = document.createElement("style");
    style.textContent = `
      /* MINI HUD - sağ üst (KÜÇÜLTÜLMÜŞ) */
      #tcHudMini{
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;

        width: 168px;              /* küçüldü */
        padding: 7px 8px 7px;      /* küçüldü */
        border-radius: 12px;

        background: rgba(0,0,0,0.20);
        -webkit-backdrop-filter: blur(8px);
        backdrop-filter: blur(8px);
        border: none;
        box-shadow: none;

        font-family: Arial, sans-serif;
        color: rgba(255,255,255,0.95);
        user-select: none;
      }

      #tcHudMini .tcRowTop{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        margin-bottom: 6px;
        font-weight: 800;
        font-size: 10px;           /* küçüldü */
        line-height: 1.1;
      }

      #tcHudMini .tcName{
        display:flex;
        align-items:center;
        gap:5px;
        min-width: 0;
        opacity: 0.95;
      }
      #tcHudMini .tcName span{
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        max-width: 92px;
      }

      #tcHudMini .tcLv{
        color: #ffd54a;
        font-weight: 900;
        font-size: 10px;           /* küçüldü */
        white-space: nowrap;
      }

      .tcBarWrap{ margin: 5px 0; }

      .tcBarLabel{
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin-bottom: 3px;
        font-size: 9px;            /* küçüldü */
        font-weight: 900;
        color: rgba(255,255,255,0.92);
      }

      .tcBar{
        position: relative;
        height: 7px;               /* küçüldü */
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
        overflow: hidden;
      }

      .tcFill{
        height: 100%;
        width: 0%;
        border-radius: 999px;
      }
      .tcFillEnergy{ background: #35ff9c; }
      .tcFillXp{ background: #ffd54a; }

      /* BAR İÇİ YAZI */
      .tcBarText{
        position:absolute;
        left:50%;
        top:50%;
        transform: translate(-50%,-50%);
        font-size: 9px;            /* küçüldü */
        font-weight: 900;
        color: rgba(0,0,0,0.80);
        pointer-events: none;
        line-height: 1;
        white-space: nowrap;
      }

      #tcHudMini .tcMeta{
        margin-top: 7px;
        display:flex;
        flex-direction: column;
        gap: 5px;
        font-size: 9px;            /* küçüldü */
        font-weight: 900;
      }

      #tcHudMini .tcTimer{
        color: #ffd54a;
        opacity: 0.95;
      }

      #tcHudMini .tcWeapon,
      #tcHudMini .tcYton{
        display:flex;
        justify-content:space-between;
        gap: 8px;
        opacity: 0.95;
      }

      #tcHudMini .tcWeapon b{ color: #ffd54a; }
      #tcHudMini .tcYton b{ color: #35ff9c; }
    `;
    document.head.appendChild(style);

    const hud = document.createElement("div");
    hud.id = "tcHudMini";
    hud.innerHTML = `
      <div class="tcRowTop">
        <div class="tcName"><span>👤 <span id="tcPlayerName"></span></span></div>
        <div class="tcLv">Lv <span id="tcPlayerLevel"></span>/${LEVEL_CAP}</div>
      </div>

      <div class="tcBarWrap">
        <div class="tcBarLabel">
          <span>Enerji</span>
          <span id="tcEnergySmall"></span>
        </div>
        <div class="tcBar">
          <div class="tcFill tcFillEnergy" id="tcEnergyFill"></div>
          <div class="tcBarText" id="tcEnergyBarText"></div>
        </div>
      </div>

      <div class="tcBarWrap">
        <div class="tcBarLabel">
          <span>XP</span>
          <span id="tcXpSmall"></span>
        </div>
        <div class="tcBar">
          <div class="tcFill tcFillXp" id="tcXpFill"></div>
          <div class="tcBarText" id="tcXpBarText"></div>
        </div>
      </div>

      <div class="tcMeta">
        <div class="tcTimer">+1 enerji: <span id="tcRegenTimer"></span></div>
        <div class="tcWeapon">
          <span>Silah: <b id="tcWeaponName"></b></span>
          <span><b id="tcWeaponBonus"></b></span>
        </div>
        <div class="tcYton">
          <span>YTON</span>
          <span><b id="tcYton"></b></span>
        </div>
      </div>
    `;

    // app içine koy
    const app = document.querySelector(".app") || document.body;
    app.appendChild(hud);

    // mini hud geldiği anda eski hud kapansın
    hideOldHud();
  }

  // ---------- UPDATE LOGIC ----------
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function fmtMMSS(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function tickEnergyRegen() {
    player.maxEnergy = ENERGY_MAX;

    if (player.energy >= player.maxEnergy) {
      player.energy = player.maxEnergy;
      player._regen.nextEnergyAt = Date.now() + ENERGY_REGEN_SEC * 1000;
      return;
    }

    const now = Date.now();
    while (now >= player._regen.nextEnergyAt && player.energy < player.maxEnergy) {
      player.energy += 1;
      player.energy = clamp(player.energy, 0, player.maxEnergy);
      player._regen.nextEnergyAt += ENERGY_REGEN_SEC * 1000;
    }

    if (player.energy >= player.maxEnergy) {
      player.energy = player.maxEnergy;
      player._regen.nextEnergyAt = Date.now() + ENERGY_REGEN_SEC * 1000;
    }
  }

  function updateHUD() {
    ensureHUD();
    tickEnergyRegen();

    if (player.level > LEVEL_CAP) player.level = LEVEL_CAP;

    const energy = clamp(player.energy, 0, player.maxEnergy);
    const xp = clamp(player.xp, 0, player.xpMax);

    if ($("tcPlayerName")) $("tcPlayerName").textContent = player.name;
    if ($("tcPlayerLevel")) $("tcPlayerLevel").textContent = String(player.level);

    // energy
    const ePct = player.maxEnergy ? (energy / player.maxEnergy) * 100 : 0;
    if ($("tcEnergyFill")) $("tcEnergyFill").style.width = `${ePct}%`;
    if ($("tcEnergyBarText")) $("tcEnergyBarText").textContent = `${energy}/${player.maxEnergy}`;
    if ($("tcEnergySmall")) $("tcEnergySmall").textContent = `${energy}/${player.maxEnergy}`;

    // xp
    const xPct = player.xpMax ? (xp / player.xpMax) * 100 : 0;
    if ($("tcXpFill")) $("tcXpFill").style.width = `${xPct}%`;
    if ($("tcXpBarText")) $("tcXpBarText").textContent = `${xp}/${player.xpMax}`;
    if ($("tcXpSmall")) $("tcXpSmall").textContent = `${xp}/${player.xpMax}`;

    // regen timer
    const leftSec = Math.ceil((player._regen.nextEnergyAt - Date.now()) / 1000);
    if ($("tcRegenTimer")) $("tcRegenTimer").textContent = fmtMMSS(leftSec);

    // weapon
    const wName = String(player.weapon?.name ?? "Tabanca");
    const wBonus = Number(player.weapon?.bonus ?? 0);
    if ($("tcWeaponName")) $("tcWeaponName").textContent = wName;
    if ($("tcWeaponBonus")) $("tcWeaponBonus").textContent = `Bonus: +${Math.round(wBonus * 100)}%`;

    // yton
    if ($("tcYton")) $("tcYton").textContent = String(Math.floor(player.yton));

    save();
  }

  // ---------- PUBLIC HELPERS ----------
  window.tcPlayer = {
    addXp(amount = 0) {
      amount = Number(amount) || 0;
      if (amount <= 0) return;
      if (player.level >= LEVEL_CAP) return;

      player.xp += amount;
      while (player.xp >= player.xpMax && player.level < LEVEL_CAP) {
        player.xp -= player.xpMax;
        player.level += 1;
      }
      if (player.level >= LEVEL_CAP) {
        player.level = LEVEL_CAP;
        player.xp = clamp(player.xp, 0, player.xpMax);
      }
      updateHUD();
    },
    spendEnergy(cost = 1) {
      cost = Math.max(0, Number(cost) || 0);
      if (player.energy < cost) return false;
      player.energy -= cost;
      player.energy = clamp(player.energy, 0, player.maxEnergy);
      updateHUD();
      return true;
    },
    setWeapon(name, bonus) {
      player.weapon = { name: String(name || "Tabanca"), bonus: Number(bonus) || 0 };
      updateHUD();
    }
  };

  // ---------- INIT ----------
  document.addEventListener("DOMContentLoaded", () => {
    ensureHUD();
    updateHUD();
    setInterval(updateHUD, 250);
  });
})();
