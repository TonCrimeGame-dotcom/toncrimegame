/* ===================================================
   TONCRIME SEASON ENGINE
   Live Service Season Pass System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Season engine waiting EVENT...");
  return;
}

/* ===========================================
   CONFIG
=========================================== */

const STORAGE_KEY="tc_season";

const SEASON_DURATION = 30*86400000;

const LEVEL_XP = 100;

/* rewards */
const FREE_REWARDS = {
  5:5,
  10:10,
  20:20,
  30:40
};

const PREMIUM_REWARDS = {
  5:10,
  10:25,
  20:50,
  30:100
};

/* ===========================================
   ENGINE
=========================================== */

const SEASON={

  data:null,

  /* ===================================== */
  init(){
    this.load();
    this.ensure();
    this.bindEvents();

    setInterval(()=>{
      this.checkReset();
    },60000);

    console.log("🎮 Season Engine Ready");
  },

  load(){
    try{
      this.data=
        JSON.parse(localStorage.getItem(STORAGE_KEY))
        || null;
    }catch{
      this.data=null;
    }
  },

  save(){
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.data)
    );
  },

  /* ===================================== */
  CREATE SEASON
  ===================================== */

  ensure(){

    if(this.data) return;

    this.data={
      start:Date.now(),
      players:{}
    };

    this.save();
  },

  /* ===================================== */
  PLAYER DATA
  ===================================== */

  player(){

    const id=GAME.user.id;

    if(!this.data.players[id]){
      this.data.players[id]={
        xp:0,
        level:1,
        claimed:{}
      };
    }

    return this.data.players[id];
  },

  /* ===================================== */
  ADD XP
  ===================================== */

  addXP(amount){

    const p=this.player();

    p.xp+=amount;

    while(p.xp>=LEVEL_XP){
      p.xp-=LEVEL_XP;
      p.level++;
      this.reward(p.level);
    }

    this.save();
  },

  /* ===================================== */
  REWARD SYSTEM
  ===================================== */

  reward(level){

    const p=this.player();

    if(FREE_REWARDS[level] &&
       !p.claimed["free_"+level]){

      GAME.user.yton+=FREE_REWARDS[level];

      p.claimed["free_"+level]=true;

      NOTIFY.push(
        "🎁 Sezon ödülü +"+
        FREE_REWARDS[level]+" YTON"
      );
    }

    if(GAME.user.premium &&
       PREMIUM_REWARDS[level] &&
       !p.claimed["premium_"+level]){

      GAME.user.yton+=PREMIUM_REWARDS[level];

      p.claimed["premium_"+level]=true;

      NOTIFY.push(
        "⭐ Premium sezon ödülü +"+
        PREMIUM_REWARDS[level]+" YTON"
      );
    }
  },

  /* ===================================== */
  RESET
  ===================================== */

  checkReset(){

    if(Date.now()-this.data.start < SEASON_DURATION)
      return;

    this.finishSeason();
  },

  finishSeason(){

    Object.keys(this.data.players).forEach(id=>{

      EVENT.emit("season:finished",{
        player:id,
        level:this.data.players[id].level
      });

    });

    this.data={
      start:Date.now(),
      players:{}
    };

    this.save();

    console.log("🔄 New Season Started");
  },

  /* ===================================== */
  EVENTS
  ===================================== */

  bindEvents(){

    EVENT.on("pvp:win",()=>{
      this.addXP(15);
    });

    EVENT.on("mission:completed",()=>{
      this.addXP(5);
    });

    EVENT.on("daily:claimed",()=>{
      this.addXP(10);
    });

  }

};

window.SEASON=SEASON;

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  SEASON.init();
});

})();
