/* ===================================================
   TONCRIME PLAYER PROFILE ENGINE
   Full Player Statistics & History System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Profile engine waiting EVENT...");
  return;
}

/* ===========================================
   PROFILE OBJECT
=========================================== */

const PROFILE = {

  data:null,

  /* ===========================================
     INIT
  =========================================== */

  init(){

    if(!window.GAME || !GAME.user) return;

    if(!GAME.user.profile){

      GAME.user.profile = {

        created:Date.now(),

        /* PvP */
        pvp:{
          wins:0,
          losses:0,
          total:0,
          fastestWin:9999,
          lastResults:[]
        },

        /* Missions */
        missions:{
          completed:0
        },

        /* Economy */
        economy:{
          earned:0,
          spent:0
        },

        /* Login */
        login:{
          streakBest:0,
          totalDays:0
        }

      };
    }

    this.data = GAME.user.profile;

    this.bindEvents();

    console.log("👤 Profile Engine Ready");
  },

  /* ===========================================
     EVENTS
  =========================================== */

  bindEvents(){

    /* PvP RESULT */
    EVENT.on("pvp:win",(data)=>{
      this.data.pvp.wins++;
      this.data.pvp.total++;

      if(data && data.time){
        if(data.time < this.data.pvp.fastestWin)
          this.data.pvp.fastestWin = data.time;
      }

      this.pushHistory("WIN",data);
    });

    EVENT.on("pvp:lose",(data)=>{
      this.data.pvp.losses++;
      this.data.pvp.total++;
      this.pushHistory("LOSE",data);
    });

    /* MISSIONS */
    EVENT.on("mission:completed",()=>{
      this.data.missions.completed++;
    });

    /* DAILY LOGIN */
    EVENT.on("daily:claimed",()=>{
      this.data.login.totalDays++;

      if(GAME.user.daily &&
         GAME.user.daily.streak >
         this.data.login.streakBest){

        this.data.login.streakBest =
          GAME.user.daily.streak;
      }
    });

    /* ECONOMY */
    EVENT.on("money:earned",(v)=>{
      this.data.economy.earned += v||0;
    });

    EVENT.on("money:spent",(v)=>{
      this.data.economy.spent += v||0;
    });

  },

  /* ===========================================
     HISTORY
  =========================================== */

  pushHistory(type,data){

    this.data.pvp.lastResults.unshift({
      type:type,
      time:Date.now(),
      detail:data||null
    });

    if(this.data.pvp.lastResults.length>20)
      this.data.pvp.lastResults.pop();
  },

  /* ===========================================
     WIN RATE
  =========================================== */

  winRate(){

    const p=this.data.pvp;
    if(p.total===0) return 0;

    return Math.round((p.wins/p.total)*100);
  },

  /* ===========================================
     SUMMARY
  =========================================== */

  summary(){

    return {
      winRate:this.winRate(),
      wins:this.data.pvp.wins,
      losses:this.data.pvp.losses,
      missions:this.data.missions.completed,
      earned:this.data.economy.earned,
      spent:this.data.economy.spent,
      bestStreak:this.data.login.streakBest
    };
  }

};

window.PROFILE = PROFILE;

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  PROFILE.init();
});

})();
