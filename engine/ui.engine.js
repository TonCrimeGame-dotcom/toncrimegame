/* ===================================================
   TONCRIME MASTER UI ENGINE
   Global UI Renderer
   SAFE VERSION
=================================================== */

(function(){

/* ===================================================
   UI OBJECT
=================================================== */

window.UI = {

  /* -----------------------------------------
     UPDATE TOP STATS BAR
  ----------------------------------------- */
  updateStats(user){

    if(!user) return;

    const stats=document.getElementById("top-stats");
    if(!stats) return;

    stats.innerHTML =
      `Lv ${user.level} | XP ${user.xp}/${CONFIG.XP_LIMIT}
       ⚡ ${user.energy}
       💰 ${Number(user.yton).toFixed(2)}`;
  },

  /* -----------------------------------------
     PLAYER CARD
  ----------------------------------------- */
  renderPlayerCard(user){

    const card=document.getElementById("player-card");
    if(!card || !user) return;

    card.innerHTML = `
      <b>Oyuncu</b><br>
      ID: ${user.id}<br>
      Takma Ad: ${user.nickname || "Player"}<br>
      Seviye: ${user.level}<br>
      XP: ${user.xp}<br>
      Enerji: ${user.energy}
    `;
  },

  /* -----------------------------------------
     ONLINE COUNT
  ----------------------------------------- */
  setOnline(count){

    const el=document.getElementById("online-count");
    if(!el) return;

    el.innerText=count+" online";
  },

  /* -----------------------------------------
     CHAT RENDER
  ----------------------------------------- */
  pushChatMessage(msg){

    const box=document.getElementById("chat-box");
    if(!box) return;

    const div=document.createElement("div");

    div.innerHTML=
      `<b>${msg.user}</b>: ${msg.text}`;

    box.appendChild(div);

    box.scrollTop=box.scrollHeight;
  },

  /* -----------------------------------------
     SAFE INIT (🔥 FIX)
  ----------------------------------------- */
  init(){

    console.log("🎮 UI Init OK");
  }

};

console.log("🧩 Master UI Ready");

})();
