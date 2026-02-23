/* ===================================================
   TONCRIME RANKING ENGINE
   Global Leaderboard + ELO Ranking System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Ranking engine waiting EVENT...");
  return;
}

/* ===========================================
   STORAGE KEY
=========================================== */

const STORAGE_KEY = "toncrime_ranking";

/* ===========================================
   ENGINE
=========================================== */

const RANKING = {

  players:{},

  /* ===========================================
     INIT
  =========================================== */

  init(){

    this.load();
    this.bindEvents();

    console.log("🏆 Ranking Engine Ready");
  },

  /* ===========================================
     LOAD / SAVE
  =========================================== */

  load(){
    try{
      this.players =
        JSON.parse(localStorage.getItem(STORAGE_KEY))
        || {};
    }catch{
      this.players={};
    }
  },

  save(){
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.players)
    );
  },

  /* ===========================================
     ENSURE PLAYER
  =========================================== */

  ensurePlayer(id,name){

    if(!this.players[id]){
      this.players[id]={
        id,
        name:name||"Unknown",
        elo:1000,
        wins:0,
        losses:0,
        lastActive:Date.now()
      };
    }

    return this.players[id];
  },

  /* ===========================================
     EVENTS
  =========================================== */

  bindEvents(){

    /* PvP WIN */
    EVENT.on("pvp:win",(data)=>{

      if(!window.GAME || !GAME.user) return;

      const me=this.ensurePlayer(
        GAME.user.id,
        GAME.user.name
      );

      me.wins++;
      me.lastActive=Date.now();

      if(data && data.eloGain)
        me.elo+=data.eloGain;
      else
        me.elo+=25;

      this.save();
    });

    /* PvP LOSE */
    EVENT.on("pvp:lose",(data)=>{

      if(!window.GAME || !GAME.user) return;

      const me=this.ensurePlayer(
        GAME.user.id,
        GAME.user.name
      );

      me.losses++;
      me.lastActive=Date.now();

      if(data && data.eloLose)
        me.elo-=data.eloLose;
      else
        me.elo-=15;

      if(me.elo<0) me.elo=0;

      this.save();
    });

    /* GAME READY */
    EVENT.on("game:ready",()=>{

      if(window.GAME && GAME.user){
        this.ensurePlayer(
          GAME.user.id,
          GAME.user.name
        );
        this.save();
      }

    });

  },

  /* ===========================================
     GET SORTED LIST
  =========================================== */

  leaderboard(limit=100){

    return Object.values(this.players)
      .sort((a,b)=>b.elo-a.elo)
      .slice(0,limit);
  },

  /* ===========================================
     PLAYER RANK
  =========================================== */

  getRank(playerId){

    const list=this.leaderboard(99999);

    const index=list.findIndex(p=>p.id===playerId);

    return index>=0 ? index+1 : null;
  },

  /* ===========================================
     LEAGUE NAME
  =========================================== */

  league(elo){

    if(elo<800) return "Bronze";
    if(elo<1200) return "Silver";
    if(elo<1600) return "Gold";
    if(elo<2000) return "Platinum";
    if(elo<2400) return "Diamond";

    return "Legend";
  }

};

window.RANKING = RANKING;

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  RANKING.init();
});

})();
