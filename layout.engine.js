/* ===================================================
   TONCRIME GLOBAL LAYOUT ENGINE
   Tek UI sistemi — tüm sayfalar buradan yönetilir
   =================================================== */

(function () {

let layoutReady = false;

/* ===================================================
   BUILD GLOBAL UI
   =================================================== */

function buildLayout() {

  if (layoutReady) return;
  layoutReady = true;

  document.body.style.margin = "0";
  document.body.style.background = "#0f1115";
  document.body.style.fontFamily = "Arial, sans-serif";
  document.body.style.color = "#fff";

  /* ---------- ROOT GRID ---------- */

  document.body.innerHTML = `
  <div id="tc-root">

    <!-- SIDEBAR -->
    <div id="tc-sidebar">
      <h2>TonCrime</h2>

      <button onclick="goPage('index.html')">🏠 Ana Sayfa</button>
      <button onclick="goPage('missions.html')">🎯 Görevler</button>
      <button onclick="goPage('coffeeshop.html')">☕ Coffee Shop</button>
      <button onclick="goPage('nightclub.html')">🍾 Gece Kulübü</button>
      <button onclick="goPage('hospital.html')">🏥 Hastane</button>
      <button onclick="goPage('pvp.html')">⚔ PvP Arena</button>
    </div>

    <!-- MAIN -->
    <div id="tc-main">

      <!-- TOPBAR -->
      <div id="tc-topbar">
        <div id="tc-title">TonCrime</div>
        <div id="tc-stats">yükleniyor...</div>
      </div>

      <!-- PAGE CONTENT -->
      <div id="tc-content"></div>

    </div>

  </div>
  `;

  injectStyles();

  movePageContent();
}

/* ===================================================
   MOVE HTML INTO CONTENT AREA
   =================================================== */

function movePageContent() {

  const content = document.getElementById("tc-content");

  const old = document.querySelector("#app")
        || document.querySelector("main")
        || document.querySelector(".container");

  if (old) {
    content.appendChild(old);
    old.style.display = "block";
  }
}

/* ===================================================
   GLOBAL NAVIGATION
   =================================================== */

window.goPage = function (page) {
  window.location.href = page + "?v=" + Date.now();
};

/* ===================================================
   UPDATE USER STATS (ENGINE CALLS THIS)
   =================================================== */

window.renderTopStats = function(user){

  const el = document.getElementById("tc-stats");
  if(!el || !user) return;

  el.innerHTML =
    `Lv ${user.level}
     | XP ${user.xp}
     | ⚡ ${user.energy}
     | 💰 ${Number(user.yton).toFixed(2)}`;
};

/* ===================================================
   STYLE INJECTION
   =================================================== */

function injectStyles(){

const css = document.createElement("style");

css.innerHTML = `

#tc-root{
  display:flex;
  height:100vh;
}

/* SIDEBAR */

#tc-sidebar{
  width:220px;
  background:#15181f;
  padding:20px;
  box-sizing:border-box;
  border-right:1px solid #222;
}

#tc-sidebar h2{
  color:gold;
  margin-bottom:20px;
}

#tc-sidebar button{
  width:100%;
  margin:6px 0;
  padding:10px;
  background:#1f2430;
  border:none;
  color:white;
  cursor:pointer;
  border-radius:6px;
}

#tc-sidebar button:hover{
  background:#2a3142;
}

/* MAIN AREA */

#tc-main{
  flex:1;
  display:flex;
  flex-direction:column;
}

/* TOPBAR */

#tc-topbar{
  height:60px;
  background:#15181f;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 20px;
  border-bottom:1px solid #222;
}

#tc-title{
  color:gold;
  font-size:20px;
  font-weight:bold;
}

/* CONTENT */

#tc-content{
  flex:1;
  padding:20px 40px; /* <<< SOL BOŞLUK BURADA */
  overflow:auto;
}

`;

document.head.appendChild(css);
}

/* ===================================================
   AUTO START
   =================================================== */

document.addEventListener("DOMContentLoaded", buildLayout);

})();
