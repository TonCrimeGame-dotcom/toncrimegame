/* ===================================================
   TONCRIME UI ENGINE
   Global UI Controller
   =================================================== */

window.UI = {

  cache:{},

  /* ===============================================
     INIT
  =============================================== */

  init(){

    this.cache.stats = document.getElementById("tc-stats");
    this.cache.content = document.getElementById("tc-content");

    console.log("✅ UI Engine Ready");
  },

  /* ===============================================
     USER STATS UPDATE
  =============================================== */

  updateStats(user){

    if(!user || !this.cache.stats) return;

    this.cache.stats.innerHTML =
      `Lv ${user.level}
       | XP ${user.xp}/${CONFIG.XP_LIMIT}
       | ⚡ ${user.energy}
       | 💰 ${Number(user.yton).toFixed(2)}`;
  },

  /* ===============================================
     PLAYER CARD
  =============================================== */

  renderPlayerCard(user){

    let box = document.getElementById("ui-player");

    if(!box){
      box = document.createElement("div");
      box.id = "ui-player";
      box.className = "ui-card";
      this.cache.content.prepend(box);
    }

    box.innerHTML = `
      <h3>👤 Oyuncu</h3>
      ID: ${user.id}<br>
      Takma Ad: ${user.username}<br>
      Seviye: ${user.level}<br>
      XP: ${user.xp}<br>
      Enerji: ${user.energy}
    `;
  },

  /* ===============================================
     ONLINE COUNTER
  =============================================== */

  setOnline(count){

    let box = document.getElementById("ui-online");

    if(!box){
      box = document.createElement("div");
      box.id = "ui-online";
      box.className = "ui-card";
      this.cache.content.appendChild(box);
    }

    box.innerHTML = `
      <h3>🟢 Online</h3>
      ${count}
    `;
  },

  /* ===============================================
     TOURNAMENT PANEL
  =============================================== */

  renderTournament(text){

    let box = document.getElementById("ui-tournament");

    if(!box){
      box = document.createElement("div");
      box.id = "ui-tournament";
      box.className = "ui-wide";
      this.cache.content.prepend(box);
    }

    box.innerHTML =
      `<h3>🏆 Aktif Turnuva</h3>${text}`;
  },

  /* ===============================================
     GLOBAL MESSAGE
  =============================================== */

  toast(msg){

    const t = document.createElement("div");
    t.className = "ui-toast";
    t.innerText = msg;

    document.body.appendChild(t);

    setTimeout(()=>t.remove(),3000);
  }

};


/* ===================================================
   UI STYLES
   =================================================== */

(function(){

const css=document.createElement("style");

css.innerHTML=`

.ui-card{
  background:#1a1f29;
  padding:15px;
  border-radius:10px;
  margin-bottom:15px;
}

.ui-wide{
  background:#1a1f29;
  padding:20px;
  border-radius:10px;
  margin-bottom:20px;
}

.ui-toast{
  position:fixed;
  bottom:20px;
  right:20px;
  background:gold;
  color:black;
  padding:12px 18px;
  border-radius:8px;
  font-weight:bold;
  z-index:9999;
}

`;

document.head.appendChild(css);

})();


/* ===================================================
   AUTO START
   =================================================== */

document.addEventListener("DOMContentLoaded",()=>{
  setTimeout(()=>UI.init(),50);
});
