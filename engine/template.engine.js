/* ===================================================
   TONCRIME TEMPLATE ENGINE
   Global Layout System
   =================================================== */

(function(){

const TEMPLATE = {

  /* ======================================
     BUILD BASE LAYOUT
  ====================================== */

  build(){

    document.body.innerHTML = `

<div id="sidebar" class="sidebar">
  <h3 style="color:gold">Menü</h3>

  <p data-page="index">🏠 Ana Sayfa</p>
  <p data-page="missions">🎯 Görevler</p>
  <p data-page="pvp">⚔ PvP</p>
  <p data-page="coffeeshop">☕ Coffee Shop</p>
  <p data-page="nightclub">🍾 Gece Kulübü</p>
  <p data-page="weapons">🔫 Silah</p>
  <p data-page="hospital">🏥 Hastane</p>
</div>

<div id="overlay" class="overlay"></div>

<div class="topbar">
  <div style="display:flex;align-items:center;">
    <div id="menuBtn" class="menu-btn">☰</div>
    <div class="logo">TonCrime</div>
  </div>

  <div class="stats">
    <div id="stats"></div>

    <div class="bar">
      <div id="xpBar" class="fill xp"></div>
    </div>

    <div class="bar">
      <div id="energyBar" class="fill energy"></div>
    </div>
  </div>
</div>

<div id="pageContent" class="main"></div>
`;

    this.bindMenu();
  },

  /* ======================================
     MENU EVENTS
  ====================================== */

  bindMenu(){

    const sidebar=document.getElementById("sidebar");
    const overlay=document.getElementById("overlay");

    document.getElementById("menuBtn").onclick=()=>{
      sidebar.classList.add("open");
      overlay.classList.add("show");
    };

    overlay.onclick=()=>{
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    };

    sidebar.querySelectorAll("p").forEach(btn=>{

      btn.onclick=()=>{
        location.href = btn.dataset.page + ".html";
      };

    });
  },

  /* ======================================
     LOAD PAGE CONTENT
  ====================================== */

  load(contentHTML){

    const el=document.getElementById("pageContent");
    if(el) el.innerHTML=contentHTML;
  }

};

window.TEMPLATE=TEMPLATE;


/* AUTO BUILD */
document.addEventListener("DOMContentLoaded",()=>{
  TEMPLATE.build();
});

console.log("🧱 Template Engine Ready");

})();
