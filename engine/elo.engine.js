/* ===================================================
   TONCRIME ELO RANK ENGINE
   Competitive Ranking System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("ELO waiting EVENT...");
  return;
}

const ELO={

K:32,

/* ===========================================
   INIT
=========================================== */

init(){

  EVENT.on("pvp:win",()=>{
    this.updateRank();
  });

  EVENT.on("pvp:lose",()=>{
    this.updateRank();
  });

  console.log("🏆 ELO Engine Ready");
},

/* ===========================================
   CALCULATE ELO
=========================================== */

calculate(playerElo,enemyElo,win){

  const expected =
    1/(1+Math.pow(10,(enemyElo-playerElo)/400));

  const score = win ? 1 : 0;

  return Math.round(
    playerElo + this.K*(score-expected)
  );
},

/* ===========================================
   LEAGUE DETECT
=========================================== */

league(elo){

  if(elo>=1600) return "🟨 Crime Lord";
  if(elo>=1400) return "🟪 Boss";
  if(elo>=1200) return "🟦 Soldier";
  if(elo>=1000) return "🟩 Hustler";

  return "🟫 Street Rat";
},

/* ===========================================
   UPDATE UI + STATE
=========================================== */

updateRank(){

  const user=GAME.user;

  user.league=this.league(user.elo);

  EVENT.emit("user:update",user);

  EVENT.emit(
    "notify",
    "Lig: "+user.league
  );

  EVENT.emit(
    "crimefeed:add",
    `${user.nickname} ligi: ${user.league}`
  );
}

};

window.ELO=ELO;

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  ELO.init();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "ELO Engine",
    ()=>!!window.ELO
  );
}

})();
