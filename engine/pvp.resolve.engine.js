/* ===================================================
   TONCRIME PVP RESOLVE ENGINE
   Match Result Processor
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Resolve waiting EVENT...");
  return;
}

const RESOLVE={

endpoint:
"https://hwhscuyudwphnsipibpy.supabase.co/functions/v1/resolve-pvp",

/* ===========================================
   INIT
=========================================== */

init(){

  EVENT.on("pvp:submit",data=>{
    this.sendResult(data);
  });

  console.log("🧠 Resolve Engine Ready");
},

/* ===========================================
   SEND RESULT TO SERVER
=========================================== */

async sendResult(result){

  try{

    EVENT.emit("notify","Sonuç doğrulanıyor...");

    const response=await fetch(this.endpoint,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":
          "Bearer "+CONFIG.SUPABASE_KEY
      },
      body:JSON.stringify({
        user_id:CONFIG.USER_ID,
        match_id:result.matchId,
        score:result.score,
        time:result.totalTime,
        hash:result.hash
      })
    });

    const data=await response.json();

    this.applyResult(data);

  }catch(e){

    console.error(e);
    EVENT.emit("notify","Sunucu hatası");
  }
},

/* ===========================================
   APPLY RESULT
=========================================== */

applyResult(data){

  if(!data) return;

  const user=GAME.user;

  if(data.winner===CONFIG.USER_ID){

    user.yton += data.reward_yton || 0;
    user.xp   += data.reward_xp   || 0;
    user.elo  = data.new_elo;

    EVENT.emit("notify","🏆 Kazandın!");

    EVENT.emit("pvp:win");

  }else{

    user.elo=data.new_elo;

    EVENT.emit("notify","💀 Kaybettin");
  }

  EVENT.emit("user:update",user);

  EVENT.emit("crimefeed:add",
    `${user.nickname} PvP savaşını tamamladı`
  );

}

};

window.RESOLVE=RESOLVE;

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  RESOLVE.init();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "PvP Resolve Engine",
    ()=>!!window.RESOLVE
  );
}

})();
