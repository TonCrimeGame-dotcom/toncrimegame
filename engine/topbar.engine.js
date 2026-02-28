(function () {

  function waitForLayout(callback) {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (window.TC_LAYOUT && window.TC_LAYOUT.stage) {
        clearInterval(timer);
        callback();
      }
      if (tries > 100) clearInterval(timer);
    }, 50);
  }

  function createTopbar() {

    if (document.getElementById("tc-topbar")) return;

    const topbar = document.createElement("div");
    topbar.id = "tc-topbar";

    topbar.innerHTML = `
      <div class="tb-left">
        <div class="tb-username">Player01</div>
        <div class="tb-weapon">Tabanca <span>(+10%)</span></div>
      </div>

      <div class="tb-center">
        <img src="assets/logo.png" class="tb-logo" />
      </div>

      <div class="tb-right">
        <div class="tb-bars">

          <div class="tb-row">
            <span>Enerji</span>
            <span>95/100</span>
          </div>
          <div class="tb-bar">
            <div class="tb-fill energy" style="width:95%"></div>
          </div>

          <div class="tb-row">
            <span>XP</span>
            <span>118/1000</span>
          </div>
          <div class="tb-bar">
            <div class="tb-fill xp" style="width:11.8%"></div>
          </div>

        </div>

        <div class="tb-yton">
          YTON <span>1031</span>
        </div>
      </div>
    `;

   document.body.appendChild(topbar); 
    injectCSS();
  }

  function injectCSS() {
    if (document.getElementById("tc-topbar-style")) return;

    const style = document.createElement("style");
    style.id = "tc-topbar-style";
    style.textContent = `
#tc-topbar{
  position:absolute;
  top:10px;
  left:0;
  right:0;
  display:grid;
  grid-template-columns:1fr auto 1fr;
  align-items:start;
  padding:0 15px;
  z-index:50;
}

.tb-left{
  font-size:12px;
  color:#eee;
  font-weight:700;
}

.tb-weapon span{
  color:#35ff9c;
}

.tb-center{
  display:flex;
  justify-content:center;
}

.tb-logo{
  height:44px; /* 2 bar yüksekliği */
  width:auto;
}

.tb-right{
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  gap:6px;
}

.tb-bars{
  width:160px;
}

.tb-row{
  display:flex;
  justify-content:space-between;
  font-size:11px;
  font-weight:700;
  color:#fff;
}

.tb-bar{
  height:7px;
  background:rgba(255,255,255,0.15);
  border-radius:10px;
  overflow:hidden;
  margin-bottom:6px;
}

.tb-fill.energy{
  height:100%;
  background:#35ff9c;
}

.tb-fill.xp{
  height:100%;
  background:#ffd54a;
}

.tb-yton{
  font-size:12px;
  font-weight:900;
  color:#ffd54a;
}
`;
    document.head.appendChild(style);
  }

  waitForLayout(createTopbar);

})();
