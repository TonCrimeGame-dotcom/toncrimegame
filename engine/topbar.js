/* ============================
   TONCRIME GLOBAL TOPBAR
   Sol: player + silah + bonus
   Orta: logo
   Sağ: energy/xp bar + YTON
   ============================ */

(function () {
  const LOGO_SRC = "assets/logo.png";      // logo dosyan
  const YTON_ICON_SRC = "assets/yton.png"; // yton icon dosyan (yoksa kaldırabilirsin)
  const HUD_TICK_MS = 250;

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function pad2(n) { return String(n).padStart(2, "0"); }

  function ensurePlayer() {
    // Senin sistemin: player.engine.js window.player oluşturuyor.
    // Burada ASLA player yaratmıyoruz. Yoksa boş fallback.
    const p = window.player || {};
    p.name = p.name ?? p.username ?? "Player01";
    p.level = Number.isFinite(+p.level) ? +p.level : 1;
    p.levelCap = Number.isFinite(+p.levelCap) ? +p.levelCap : 50;

    p.energy = Number.isFinite(+p.energy) ? +p.energy : 0;
    p.maxEnergy = Number.isFinite(+p.maxEnergy) ? +p.maxEnergy : 100;

    p.xp = Number.isFinite(+p.xp) ? +p.xp : 0;
    p.xpMax = Number.isFinite(+p.xpMax) ? +p.xpMax : 1000;

    p.yton = Number.isFinite(+p.yton) ? +p.yton : 0;

    p.weapon = p.weapon || {};
    p.weapon.name = p.weapon.name ?? p.weaponName ?? "Tabanca";
    p.weapon.bonus = Number.isFinite(+p.weapon.bonus) ? +p.weapon.bonus : (Number.isFinite(+p.weaponBonus) ? +p.weaponBonus : 0.10);

    // enerji timer (varsa engine’den gelsin)
    // örn: p.energyNextInSec
    p.energyNextInSec = Number.isFinite(+p.energyNextInSec) ? +p.energyNextInSec : null;

    return p;
  }

  function formatBonus(bonusFloat) {
    const pct = Math.round(bonusFloat * 100);
    return `+${pct}%`;
  }

  function formatEnergyTimer(p) {
    // Eğer engine sayacı vermiyorsa (energyNextInSec yoksa) boş bırakır.
    if (p.energyNextInSec == null) return "";
    const s = Math.max(0, Math.floor(p.energyNextInSec));
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `+1 enerji: ${pad2(mm)}:${pad2(ss)}`;
  }

  function createTopbar() {
    const app = document.querySelector(".app") || document.body;

    // varsa tekrar üretme
    if (document.querySelector(".tc-topbar")) return;

    const topbar = document.createElement("div");
    topbar.className = "tc-topbar";
    topbar.innerHTML = `
      <div class="tc-topbar__inner">
        <div class="tc-left">
          <div class="tc-left__line tc-player">
            <span class="tc-player__name" id="tcPlayerName">Player01</span>
          </div>
          <div class="tc-left__line tc-weapon">
            <span class="tc-weapon__name" id="tcWeaponName">Tabanca</span>
          </div>
          <div class="tc-left__line tc-bonus">
            Bonus: <span class="tc-bonus__val" id="tcWeaponBonus">+10%</span>
          </div>
        </div>

        <div class="tc-center">
          <img class="tc-logo" src="${LOGO_SRC}" alt="TonCrime">
        </div>

        <div class="tc-right">
          <div class="tc-bars">
            <div class="tc-bar-row">
              <div class="tc-bar-label">Enerji</div>
              <div class="tc-bar" aria-label="energy bar">
                <div class="tc-bar-fill tc-bar-fill--energy" id="tcEnergyFill"></div>
                <div class="tc-bar-text" id="tcEnergyText">0/100</div>
              </div>
            </div>

            <div class="tc-bar-row">
              <div class="tc-bar-label">XP</div>
              <div class="tc-bar" aria-label="xp bar">
                <div class="tc-bar-fill tc-bar-fill--xp" id="tcXpFill"></div>
                <div class="tc-bar-text" id="tcXpText">0/1000</div>
              </div>
            </div>
          </div>

          <div class="tc-right__bottom">
            <div class="tc-energy-timer" id="tcEnergyTimer"></div>

            <div class="tc-yton">
              <img class="tc-yton__icon" src="${YTON_ICON_SRC}" alt="YTON">
              <span class="tc-yton__val" id="tcYtonVal">0</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // app'in en başına koy
    if (app.firstChild) app.insertBefore(topbar, app.firstChild);
    else app.appendChild(topbar);
  }

  function updateTopbar() {
    const p = ensurePlayer();

    const nameEl = document.getElementById("tcPlayerName");
    const weaponEl = document.getElementById("tcWeaponName");
    const bonusEl = document.getElementById("tcWeaponBonus");

    const eFill = document.getElementById("tcEnergyFill");
    const eText = document.getElementById("tcEnergyText");
    const xFill = document.getElementById("tcXpFill");
    const xText = document.getElementById("tcXpText");

    const ytonEl = document.getElementById("tcYtonVal");
    const timerEl = document.getElementById("tcEnergyTimer");

    if (nameEl) nameEl.textContent = p.name;
    if (weaponEl) weaponEl.textContent = p.weapon.name;
    if (bonusEl) bonusEl.textContent = formatBonus(p.weapon.bonus);

    const ePct = p.maxEnergy > 0 ? clamp((p.energy / p.maxEnergy) * 100, 0, 100) : 0;
    const xPct = p.xpMax > 0 ? clamp((p.xp / p.xpMax) * 100, 0, 100) : 0;

    if (eFill) eFill.style.width = `${ePct}%`;
    if (xFill) xFill.style.width = `${xPct}%`;

    // ✅ Bar içi yazılar
    if (eText) eText.textContent = `${p.energy}/${p.maxEnergy}`;
    if (xText) xText.textContent = `${p.xp}/${p.xpMax}`;

    if (ytonEl) ytonEl.textContent = String(p.yton);

    const t = formatEnergyTimer(p);
    if (timerEl) timerEl.textContent = t;
  }

  document.addEventListener("DOMContentLoaded", () => {
    createTopbar();
    updateTopbar();
    setInterval(updateTopbar, HUD_TICK_MS);
  });
})();
