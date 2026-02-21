/* ===================================================
   TONCRIME EVENT ENGINE
   Global Event Bus System
   =================================================== */

(function(){

/* ===============================================
   EVENT BUS CORE
=============================================== */

window.EVENT = {

  events:{},

  /* ---------- EMIT ---------- */

  emit(name,data=null){

    if(!this.events[name]) return;

    this.events[name].forEach(cb=>{
      try{
        cb(data);
      }catch(e){
        console.error("Event error:",name,e);
      }
    });
  },

  /* ---------- LISTEN ---------- */

  on(name,callback){

    if(!this.events[name])
      this.events[name]=[];

    this.events[name].push(callback);
  },

  /* ---------- REMOVE ---------- */

  off(name,callback){

    if(!this.events[name]) return;

    this.events[name] =
      this.events[name].filter(cb=>cb!==callback);
  }

};

console.log("⚡ Event Engine Ready");


/* ===================================================
   DEFAULT GAME EVENTS
   (OYUNUN OTOMATİK REFLEKSLERİ)
   =================================================== */


/* ---------- LEVEL UP ---------- */

EVENT.on("LEVEL_UP",(lvl)=>{

  console.log("LEVEL UP:",lvl);

  if(window.UI)
    UI.toast("🎉 Level "+lvl+" oldun!");
});


/* ---------- ENERGY EMPTY ---------- */

EVENT.on("ENERGY_EMPTY",()=>{

  if(window.UI)
    UI.toast("⚡ Enerjin bitti!");
});


/* ---------- MISSION SUCCESS ---------- */

EVENT.on("MISSION_SUCCESS",(data)=>{

  if(!data) return;

  if(window.UI)
    UI.toast(
      `✅ Görev Başarılı +${data.xp} XP +${data.yton} Yton`
    );
});


/* ---------- MISSION FAIL ---------- */

EVENT.on("MISSION_FAIL",()=>{

  if(window.UI)
    UI.toast("❌ Görev başarısız");
});


/* ---------- PVP WIN ---------- */

EVENT.on("PVP_WIN",(data)=>{

  if(window.UI)
    UI.toast(
      `🏆 PvP Kazandın +${data.reward} Yton`
    );
});


/* ---------- DAILY REWARD ---------- */

EVENT.on("DAILY_REWARD",(reward)=>{

  if(window.UI)
    UI.toast(
      `🎁 Günlük ödül: ${reward} Yton`
    );
});


/* ---------- USER UPDATED ---------- */

EVENT.on("USER_UPDATED",(user)=>{

  if(window.UI){
    UI.updateStats(user);
    UI.renderPlayerCard(user);
  }

  if(window.renderTopStats)
    renderTopStats(user);
});


})();
