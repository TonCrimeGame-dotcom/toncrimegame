/* ===================================================
   TONCRIME TEMPLATE ENGINE
   Global Layout System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Template waiting EVENT...");
  return;
}

/* ===========================================
   TEMPLATE ENGINE
=========================================== */

const TEMPLATE = {

  /* ========================= */
  build(){

    document.body.innerHTML = `
    
    <!-- SIDEBAR -->
    <div id="sidebar" class="tc-sidebar">
      <h3>TonCrime</h3>

      <div class="menu-item" data-page="index.html">🏠 Ana Sayfa</div>
      <div class="menu-item" data-page="missions.html">🎯 Görevler</div>
      <div class="menu-item" data-page="pvp.html">⚔ PvP</div>
      <div class="menu-item" data-page="coffeeshop.html">☕ Coffee Shop</div>
      <div class="menu-item" data-page="nightclub.html">🍾 Gece Kulübü</div>
      <div class="menu-item" data-page="brothel.html">💋 Genel Ev</div>
      <div class="menu-item" data-page="weapons.html">🔫 Silah Kaçakçısı</div>
      <div class="menu-item" data-page="hospital.html">🏥 Hastane</div>
    </div>

    <div id="overlay" class="tc-overlay"></div>

    <!-- TOPBAR -->
    <div class="tc-topbar">

      <div class="left">
        <span id="menuBtn">☰</span>
        <span class="logo">TonCrime</span>
      </div>

      <div class="stats">

        <div id="statsText"></div>

        <div class="bar">
          <div id="xpBar" class="fill xp"></div>
        </div>

        <div class="bar">
          <div id="energyBar" class="fill energy"></div>
        </div>

        <div id="energyTimer" class="timer"></div>

      </div>

    </div>

    <!-- MAIN -->
    <div class="tc-main">

      <div id="pageContent" class="page"></div>

      <div id="playerCard" class="player-card"></div>

    </div>
    `;

    this.bindMenu();
    this.injectCSS();
  },

  /* ========================= */
  bindMenu(){

    document.getElementById("menuBtn").onclick=()=>{
      document.getElementById("sidebar")
        .classList.toggle("open");

      document.getElementById("overlay")
        .classList.toggle("show");
    };

    document.getElementById("overlay").onclick=()=>{
      document.getElementById("sidebar")
        .classList.remove("open");

      document.getElementById("overlay")
        .classList.remove("show");
    };

    document.querySelectorAll(".menu-item")
      .forEach(el=>{
        el.onclick=()=>{
          window.location.href=el.dataset.page;
        };
      });
  },

  /* ========================= */
  setContent(html){
    document.getElementById("pageContent").innerHTML=html;
  },

  /* ========================= */
  injectCSS(){

    const style=document.createElement("style");

    style.innerHTML=`

    body{
      margin:0;
      background:#0e0e0e;
      color:white;
      font-family:Arial;
    }

    .tc-sidebar{
      position:fixed;
      left:-260px;
      top:0;
      width:260px;
      height:100%;
      background:#151515;
      padding:20px;
      transition:.3s;
      z-index:3000;
    }

    .tc-sidebar.open{left:0;}

    .menu-item{
      padding:10px;
      cursor:pointer;
      border-bottom:1px solid #222;
    }

    .menu-item:hover{background:#222;}

    .tc-overlay{
      position:fixed;
      width:100%;
      height:100%;
      background:rgba(0,0,0,.6);
      display:none;
      z-index:2500;
    }

    .tc-overlay.show{display:block;}

    .tc-topbar{
      background:#111;
      padding:15px 30px;
      display:flex;
      justify-content:space-between;
      align-items:center;
      border-bottom:1px solid #222;
    }

    .logo{color:gold;font-size:22px;font-weight:bold;}

    .stats{width:420px;text-align:right;}

    .bar{
      height:8px;
      background:#333;
      border-radius:5px;
      margin:4px 0;
      overflow:hidden;
    }

    .fill{height:100%;}

    .xp{background:limegreen;}
    .energy{background:gold;}

    .tc-main{
      display:flex;
      gap:40px;
      padding:40px;
    }

    .page{width:60%;}
    .player-card{
      width:25%;
      background:#151515;
      padding:20px;
      border-radius:10px;
    }
    `;

    document.head.appendChild(style);
  }

};

window.TEMPLATE = TEMPLATE;

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  TEMPLATE.build();
  console.log("🧩 Template Engine Ready");
});

})();
