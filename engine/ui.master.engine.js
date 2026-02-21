/* ===================================================
   TONCRIME MASTER UI ENGINE
   Global Layout + Binding Layer
   =================================================== */

(function(){

/* ===================================================
   CREATE BASE LAYOUT
=================================================== */

function createLayout(){

  if(document.getElementById("tc-layout")) return;

  document.body.innerHTML = `
  
  <div id="tc-layout">

    <div id="tc-topbar">
      <div class="tc-left">
        <span id="tc-menu-btn">☰</span>
        <span class="logo">TonCrime</span>
      </div>

      <div id="stats"></div>
    </div>

    <div id="tc-sidebar" class="closed">
      <p data-page="index.html">🏠 Ana Sayfa</p>
      <p data-page="missions.html">🎯 Görevler</p>
      <p data-page="pvp.html">⚔ PvP</p>
      <p data-page="nightclub.html">🍾 Gece Kulübü</p>
      <p data-page="coffeeshop.html">☕ Coffee</p>
      <p data-page="hospital.html">🏥 Hastane</p>
    </div>

    <div id="tc-content"></div>

  </div>
  `;

  injectStyle();
  bindMenu();
}


/* ===================================================
   STYLE
=================================================== */

function injectStyle(){

const style=document.createElement("style");

style.innerHTML=`

body{
 margin:0;
 background:#0e0e0e;
 color:white;
 font-family:Arial;
}

#tc-topbar{
 display:flex;
 justify-content:space-between;
 align-items:center;
 background:#111;
 padding:15px 25px;
 border-bottom:1px solid #222;
}

.logo{color:gold;font-weight:bold;font-size:22px;}

#tc-sidebar{
 position:fixed;
 left:-220px;
 top:0;
 width:220px;
 height:100%;
 background:#151515;
 padding-top:60px;
 transition:.3s;
}

#tc-sidebar.open{left:0;}

#tc-sidebar p{
 padding:12px 20px;
 cursor:pointer;
 border-bottom:1px solid #222;
}

#tc-sidebar p:hover{
 background:#222;
}

#tc-content{
 padding:25px;
 max-width:1400px;
 margin:auto;
}

`;

document.head.appendChild(style);
}


/* ===================================================
   MENU
=================================================== */

function bindMenu(){

const btn=document.getElementById("tc-menu-btn");
const sidebar=document.getElementById("tc-sidebar");

btn.onclick=()=>{
  sidebar.classList.toggle("open");
};

sidebar.querySelectorAll("p")
.forEach(el=>{
  el.onclick=()=>{
    window.location.href=el.dataset.page;
  };
});

}


/* ===================================================
   PLAYER CARD
=================================================== */

function renderPlayer(user){

let card=document.getElementById("playerCard");

if(!card){
  card=document.createElement("div");
  card.id="playerCard";
  card.style.marginTop="15px";
  document.getElementById("tc-content")
    .prepend(card);
}

card.innerHTML=`
<b>${user.nickname}</b><br>
Lv ${user.level} | ELO ${user.elo||1000}<br>
⚡ ${user.energy} | 💰 ${Number(user.yton).toFixed(2)}
`;
}


/* ===================================================
   UPDATE STATS
=================================================== */

function updateStats(user){

const el=document.getElementById("stats");
if(!el) return;

el.innerHTML=
`Lv ${user.level} | XP ${user.xp}
 | ⚡ ${user.energy}
 | 💰 ${Number(user.yton).toFixed(2)}`;
}


/* ===================================================
   EVENT BINDS
=================================================== */

EVENT.on("engine:ready",()=>{

  createLayout();

  if(GAME.user){
    updateStats(GAME.user);
    renderPlayer(GAME.user);
  }

});


EVENT.on("elo:updated",()=>{
  updateStats(GAME.user);
});

EVENT.on("reward:given",()=>{
  updateStats(GAME.user);
});

EVENT.on("daily:claimed",()=>{
  updateStats(GAME.user);
});


/* ===================================================
   PUBLIC API
=================================================== */

window.UI={
  updateStats,
  renderPlayerCard:renderPlayer
};

console.log("🧩 Master UI Ready");

})();
