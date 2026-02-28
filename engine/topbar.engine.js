(() => {
  // Tek kaynak: state
  const defaultState = {
    username: "Player01",
    weapon: "Tabanca",
    bonus: "+10%",
    energy: { cur: 85, max: 100 },
    xp: { cur: 118, max: 1000 },
    yton: 1031
  };

  function getState() {
    return Object.assign({}, defaultState, window.TC_STATE || {});
  }

  function ensureTopbar() {
    const stage = document.getElementById("tc-stage");
    if (!stage) return null;

    let tb = document.getElementById("tc-topbar");
    if (!tb) {
      tb = document.createElement("div");
      tb.id = "tc-topbar";
      stage.appendChild(tb);
    }
    return tb;
  }

  function pct(cur, max) {
    if (!max) return 0;
    const v = (cur / max) * 100;
    return Math.max(0, Math.min(100, v));
  }

  function render() {
    const tb = ensureTopbar();
    if (!tb) return;

    const s = getState();

    tb.innerHTML = `
      <div class="tc-tb-block tc-left">
        <div>${s.username}</div>
        <div class="tc-sub">${s.weapon} <span class="tc-bonus">(${s.bonus})</span></div>
      </div>

      <div class="tc-tb-block tc-logo-wrap">
        <img class="tc-logo" src="assets/logo.png" alt="TonCrime" />
      </div>

      <div class="tc-tb-block tc-right">
        <div class="tc-row">
          <div>Enerji</div>
          <div class="tc-bar"><div class="tc-fill" style="width:${pct(s.energy.cur, s.energy.max)}%"></div></div>
          <div>${s.energy.cur}/${s.energy.max}</div>
        </div>

        <div class="tc-row">
          <div>XP</div>
          <div class="tc-bar"><div class="tc-fill xp" style="width:${pct(s.xp.cur, s.xp.max)}%"></div></div>
          <div>${s.xp.cur}/${s.xp.max}</div>
        </div>

        <div class="tc-yton">YTON ${s.yton}</div>
      </div>
    `;
  }

  // State güncelleyebilmen için:
  // window.TC_STATE = {...}; window.dispatchEvent(new Event("tc:state"));
  window.addEventListener("tc:state", render);

  // İlk render
  render();

  // Debug: dışarıdan hızlı test
  window.TC = window.TC || {};
  window.TC.renderTopbar = render;
})();
