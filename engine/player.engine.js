/* =========================
   TonCrime - PLAYER ENGINE
   HUD: sağ üst mini barlar + enerji timer + silah bonus
   Tek dosya / stabil
   ========================= */

(() => {
  // ---------- CONFIG ----------
  const ENERGY_MAX = 100;           // sabit
  const ENERGY_REGEN_SEC = 300;     // 5 dk = 300 sn
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

  // regen timer state
  player._regen = player._regen && typeof player._regen === "object" ? player._regen : {};
  player._regen.nextEnergyAt = Number.isFinite(+player._regen.nextEnergyAt)
    ? +player._regen.nextEnergyAt
    : (Date.now() + ENERGY_REGEN_SEC * 1000);

  function save() {
    try { localStorage.setItem("player", JSON.stringify(player)); } catch {}
  }

  // ---------- HUD DOM ----------
  function ensureHUD() {
    if (document.getElementById("tcHudMini")) return;

    // style (tek yerden kontrol)
    const style = document.createElement("style");
    style.textContent = `
      /* HUD MINI - sağ üst */
      #tcHudMini{
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 999;
        width: 240px;
        padding: 10px 10px 9px;
        border-radius: 14px;
        background: rgba(0,0,0,0.22);
        -webkit-backdrop-filter: blur(8px);
        backdrop-filter: blur(8px);
        box-shadow: none;
        border: none;
        font-family: Arial, sans-serif;
        color: rgba(255,255,255,0.95);
        user-select: none;
      }

      #tcHudMini .tcRowTop{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom: 7px;
        font-weight: 700;
        font-size: 12px;
      }

      #tcHudMini .tcName{
        display:flex;
        align-items:center;
        gap:6px;
        opacity: 0.95;
        min-width: 0;
      }
      #tcHudMini .tcName span{
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        max-width: 140px;
      }

      #tcHudMini .tcLv{
        color: #ffd54a;
        font-weight: 800;
        font-size: 11px;
        opacity: 0.95;
      }

      .tcBarWrap{
        margin: 6px 0;
      }

      .tcBarLabel{
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin-bottom: 4px;
        font-size: 11px;
        font-weight: 800;
        color: rgba(255,255,255,0.92);
      }

      .tcBar{
        position: relative;
        height: 8px;
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

      .tcBarText{
        position:absolute;
        left:50%;
        top:50%;
        transform: translate(-50%,-50%);
        font-size: 10px;
        font-weight: 900;
        color: rgba(0,0,0,0.85);
        text-shadow: none;
        pointer-events: none;
        line-height: 1;
        white-space: nowrap;
      }

      /* timer + silah */
      #tcHudMini .tcMeta{
        margin-top: 8px;
        display:flex;
        flex-direction: column;
        gap: 6px;
        font-size: 11px;
        font-weight: 800;
      }
      #tcHudMini .tcTimer{
        color: #ffd54a;
        opacity: 0.95;
      }
      #tcHudMini .tcWeapon{
        display:flex;
        justify-content:space-between;
        gap: 10px;
        color: rgba(255,255,255,0.92);
        opacity: 0.95;
      }
      #tcHudMini .tcWeapon b{
        color: #ffd54a;
      }
      #tcHudMini .tcYton{
        display:flex;
        justify-content:space-between;
        gap: 10px;
        opacity: 0.95;
      }
      #tcHudMini .tcYton b{
        color: #35ff9c;
      }
    `;
    document.head.appendChild(style);

    const hud = document.createElement("div");
    hud.id = "tcHudMini";
    hud.innerHTML = `
      <div class="tcRowTop">
        <div class="tcName">
          <span>👤 <span id="tcPlayerName"></span></span>
        </div>
        <div class="tcLv">Lv <span id="tcPlayerLevel"></span> / ${LEVEL_CAP}</div>
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
          <span>Bonus: <b id="tcWeaponBonus"></b></span>
        </div>

        <div class="tcYton">
          <span>YTON</span>
          <span><b id="tcYton"></b></span>
        </div>
      </div>
    `;

    // app içine koy (senin indexte .app var)
    const app = document.querySelector(".app") || document.body;
    app.appendChild(hud);
  }

  // ---------- UPDATE LOGIC ----------
  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function fmtMMSS(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function tickEnergyRegen() {
    // energy tam ise timer'ı ileri at
    player.maxEnergy = ENERGY_MAX;

    if (player.energy >= player.maxEnergy) {
      player.energy = player.maxEnergy;
      player._regen.nextEnergyAt = Date.now() + ENERGY_REGEN_SEC * 1000;
      return;
    }

    const now = Date.now();

    // geride kaldıysa birden fazla enerji verebilir
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

    // level cap kilidi (50)
    if (player.level > LEVEL_CAP) player.level = LEVEL_CAP;

    const energy = clamp(player.energy, 0, player.maxEnergy);
    const xp = clamp(player.xp, 0, player.xpMax);

    // texts
    const $ = (id) => document.getElementById(id);

    if ($("tcPlayerName")) $("tcPlayerName").textContent = player.name;
    if ($("tcPlayerLevel")) $("tcPlayerLevel").textContent = String(player.level);

    // energy bar
    const ePct = player.maxEnergy ? (energy / player.maxEnergy) * 100 : 0;
    if ($("tcEnergyFill")) $("tcEnergyFill").style.width = `${ePct}%`;
    if ($("tcEnergyBarText")) $("tcEnergyBarText").textContent = `${energy}/${player.maxEnergy}`;
    if ($("tcEnergySmall")) $("tcEnergySmall").textContent = `${energy}/${player.maxEnergy}`;

    // xp bar
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
    if ($("tcWeaponBonus")) $("tcWeaponBonus").textContent = `+${Math.round(wBonus * 100)}%`;

    // yton
    if ($("tcYton")) $("tcYton").textContent = String(Math.floor(player.yton));

    save();
  }

  // ---------- PUBLIC HELPERS (istersen kullanırsın) ----------
  window.tcPlayer = {
    addXp(amount = 0) {
      amount = Number(amount) || 0;
      if (amount <= 0) return;
      if (player.level >= LEVEL_CAP) return; // level cap kilidi
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
    setInterval(updateHUD, 250); // smooth timer + bar update
  });
})();
