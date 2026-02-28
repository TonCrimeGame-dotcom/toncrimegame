(() => {
  function ensureCSS() {
    if (document.getElementById("tc-topbar-css")) return;

    const css = `
/* TOPBAR - sadece tc-stage içinde çalışır */
#tc-topbar{
  position:absolute;
  left:10px;
  right:10px;
  top:10px;
  height:54px;
  display:grid;
  grid-template-columns: 1fr auto 1fr;
  align-items:center;
  gap:10px;
  z-index:9999;
  pointer-events:none;
}

#tc-topbar .tb-left,
#tc-topbar .tb-mid,
#tc-topbar .tb-right{
  pointer-events:auto;
  display:flex;
  align-items:center;
  gap:10px;
  min-width:0;
}

/* solda alt alta (kullanıcı / silah+bonus) */
#tc-topbar .tb-left{
  flex-direction:column;
  align-items:flex-start;
  gap:4px;
}
#tc-topbar .tb-username{
  font-weight:800;
  font-size:14px;
  color:#eaeaea;
  text-shadow:0 2px 8px rgba(0,0,0,.7);
}
#tc-topbar .tb-weapon{
  font-weight:700;
  font-size:12px;
  color:#ffd54a;
  text-shadow:0 2px 8px rgba(0,0,0,.7);
}
#tc-topbar .tb-weapon span{
  color:#35ff9c;
  margin-left:6px;
}

/* ortada logo */
#tc-topbar .tb-mid{
  justify-content:center;
}
#tc-topbar .tb-logo{
  height:34px;
  width:auto;
  filter: drop-shadow(0 3px 10px rgba(0,0,0,0.6));
}

/* sağda: enerji/xp bar + yton alt alta */
#tc-topbar .tb-right{
  justify-content:flex-end;
  flex-direction:column;
  align-items:flex-end;
  gap:6px;
}

#tc-topbar .tb-bars{
  width:170px;
  display:flex;
  flex-direction:column;
  gap:6px;
}

#tc-topbar .tb-row{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  width:170px;
  color:#eaeaea;
  font-size:11px;
  font-weight:700;
  text-shadow:0 2px 8px rgba(0,0,0,.7);
}

#tc-topbar .tb-bar{
  position:relative;
  width:170px;
  height:7px;
  border-radius:999px;
  overflow:hidden;
  background:rgba(255,255,255,0.14);
  box-shadow:none;
  border:none;
}
#tc-topbar .tb-fill{
  height:100%;
  width:50%;
  border-radius:999px;
}
#tc-topbar .tb-fill.energy{ background:#35ff9c; }
#tc-topbar .tb-fill.xp{ background:#ffd54a; }

#tc-topbar .tb-bar-text{
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  font-size:10px;
  font-weight:900;
  color:rgba(255,255,255,0.95);
  text-shadow:0 1px 3px rgba(0,0,0,0.9);
  pointer-events:none;
}

#tc-topbar .tb-yton{
  width:170px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  font-weight:900;
  font-size:12px;
  color:#ffd54a;
  text-shadow:0 2px 8px rgba(0,0,0,.7);
}
#tc-topbar .tb-yton .val{
  color:#35ff9c;
}
`;
    const style = document.createElement("style");
    style.id = "tc-topbar-css";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function clamp01(n){ return Math.max(0, Math.min(1, n)); }

  function mountTopbar() {
    if (!window.TC_LAYOUT?.stage) return;
    if (document.getElementById("tc-topbar")) return;

    ensureCSS();

    const el = document.createElement("div");
    el.id = "tc-topbar";
    el.innerHTML = `
      <div class="tb-left">
        <div class="tb-username" id="tbUser">Player01</div>
        <div class="tb-weapon" id="tbWeapon">Tabanca <span id="tbBonus">(+10%)</span></div>
      </div>

      <div class="tb-mid">
        <img class="tb-logo" id="tbLogo" alt="TonCrime" />
      </div>

      <div class="tb-right">
        <div class="tb-bars">
          <div class="tb-row"><span>Enerji</span><span id="tbEnergyVal">95/100</span></div>
          <div class="tb-bar">
            <div class="tb-fill energy" id="tbEnergyFill"></div>
            <div class="tb-bar-text" id="tbEnergyText">95/100</div>
          </div>

          <div class="tb-row"><span>XP</span><span id="tbXpVal">118/1000</span></div>
          <div class="tb-bar">
            <div class="tb-fill xp" id="tbXpFill"></div>
            <div class="tb-bar-text" id="tbXpText">118/1000</div>
          </div>
        </div>

        <div class="tb-yton"><span>YTON</span><span class="val" id="tbYton">1031</span></div>
      </div>
    `;

    // stage içine bas
    window.TC_LAYOUT.stage.appendChild(el);

    // ✅ Logo yolu sabit
    const logo = el.querySelector("#tbLogo");
    logo.src = "assets/logo.png";

    // dışarıdan güncellemek için API
    window.TC_TOPBAR = {
      setUser(name){ document.getElementById("tbUser").textContent = name ?? ""; },
      setWeapon(name, bonusText){
        const weaponEl = document.getElementById("tbWeapon");
        const bonusEl = document.getElementById("tbBonus");
        weaponEl.childNodes[0].textContent = (name ?? "") + " ";
        bonusEl.textContent = bonusText ?? "";
      },
      setEnergy(cur, max){
        const ratio = max ? clamp01(cur / max) : 0;
        document.getElementById("tbEnergyFill").style.width = (ratio*100).toFixed(1) + "%";
        const t = `${cur}/${max}`;
        document.getElementById("tbEnergyVal").textContent = t;
        document.getElementById("tbEnergyText").textContent = t;
      },
      setXP(cur, max){
        const ratio = max ? clamp01(cur / max) : 0;
        document.getElementById("tbXpFill").style.width = (ratio*100).toFixed(1) + "%";
        const t = `${cur}/${max}`;
        document.getElementById("tbXpVal").textContent = t;
        document.getElementById("tbXpText").textContent = t;
      },
      setYton(val){ document.getElementById("tbYton").textContent = String(val ?? "0"); },
      setLogo(src){ document.getElementById("tbLogo").src = src; }
    };

    // Demo data (istersen kaldır)
    window.TC_TOPBAR.setUser("Player01");
    window.TC_TOPBAR.setWeapon("Tabanca", "(+10%)");
    window.TC_TOPBAR.setEnergy(95, 100);
    window.TC_TOPBAR.setXP(118, 1000);
    window.TC_TOPBAR.setYton(1031);
  }

  function init() {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (window.TC_LAYOUT?.stage) {
        clearInterval(timer);
        mountTopbar();
      }
      if (tries > 80) clearInterval(timer); // 4sn
    }, 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
