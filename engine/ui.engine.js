/* ===================================================
   TONCRIME UI ENGINE
   Global Interface Controller
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("UI waiting EVENT...");
  return;
}

/* ===========================================
   UI OBJECT
=========================================== */

const UI={

/* ================= INIT ================= */

init(){

  EVENT.on("user:loaded",user=>{
    this.updateStats(user);
    this.renderPlayerCard(user);
  });

  EVENT.on("user:update",user=>{
    this.updateStats(user);
    this.renderPlayerCard(user);
  });

  EVENT.on("notify",msg=>{
    this.notify(msg);
  });

  EVENT.on("crimefeed:add",txt=>{
    this.addFeed(txt);
  });

  console.log("🎨 UI Engine Ready");
},

/* ================= STATS ================= */

updateStats(user){

  const stats=document.getElementById("stats");
  const xpBar=document.getElementById("xpBar");
  const energyBar=document.getElementById("energyBar");

  if(!stats) return;

  stats.innerHTML=
  `Lv ${user.level}
   | XP ${user.xp}/${CONFIG.XP_LIMIT}
   | ⚡ ${user.energy}
   | 💰 ${Number(user.yton).toFixed(2)}`;

  if(xpBar)
    xpBar.style.width=
      (user.xp/CONFIG.XP_LIMIT*100)+"%";

  if(energyBar)
    energyBar.style.width=
      (user.energy/CONFIG.MAX_ENERGY*100)+"%";
},

/* ================= PLAYER CARD ================= */

renderPlayerCard(user){

  const card=document.getElementById("playerCard");
  if(!card) return;

  card.innerHTML=`

  <h3>${user.nickname}</h3>

  <hr>

  <div>ID: ${user.id}</div>
  <div>Level: ${user.level}</div>
  <div>Reputation: ${user.reputation||0}</div>
  <div>Clan: ${user.clan||"Yok"}</div>

  <hr>

  <div>Silah: ${user.weapon||"Yok"}</div>
  <div>PvP Rank: ${user.elo||1000}</div>

  <hr>

  <div>Premium:
    ${user.premium ? "✅ Aktif" : "❌ Yok"}
  </div>

  `;
},

/* ================= NOTIFY ================= */

notify(text){

  let box=document.createElement("div");

  box.className="tc-notify";
  box.innerText=text;

  document.body.appendChild(box);

  setTimeout(()=>{
    box.classList.add("show");
  },50);

  setTimeout(()=>{
    box.classList.remove("show");
    setTimeout(()=>box.remove(),400);
  },3000);
},

/* ================= CRIME FEED ================= */

addFeed(text){

  const feed=document.getElementById("crimeFeed");
  if(!feed) return;

  const line=document.createElement("div");
  line.innerText=text;

  feed.prepend(line);

  while(feed.children.length>6)
    feed.removeChild(feed.lastChild);
}

};

/* ===========================================
   STYLE INJECTION
=========================================== */

(function(){

const style=document.createElement("style");

style.innerHTML=`

.tc-notify{
position:fixed;
right:20px;
bottom:70px;
background:#1b1b1b;
padding:12px 18px;
border-left:4px solid gold;
opacity:0;
transform:translateY(20px);
transition:.3s;
z-index:9999;
}

.tc-notify.show{
opacity:1;
transform:translateY(0);
}

#playerCard h3{
color:gold;
margin-top:0;
}

`;

document.head.appendChild(style);

})();

/* ===========================================
   GLOBAL EXPORT
=========================================== */

window.UI=UI;

/* ===========================================
   START
=========================================== */

EVENT.on("game:ready",()=>{
  UI.init();
});

})();
