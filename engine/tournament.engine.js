/* ===================================================
   TONCRIME TOURNAMENT & LEAGUE ENGINE
   Weekly + Monthly Competition System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Tournament engine waiting EVENT...");
  return;
}

/* ===========================================
   STORAGE
=========================================== */

const STORAGE_KEY="tc_tournaments";

/* ===========================================
   CONFIG
=========================================== */

const WEEK = 7*86400000;
const MONTH = 30*86400000;

const REWARD_POOL_GAIN = {
  pvp_win:2,
  mission:1
};

/* ===========================================
   ENGINE
=========================================== */

const TOURNAMENT={

  data:null,

  /* ===================================== */
  init(){

    this.load();
    this.ensure();
    this.bindEvents();

    setInterval(()=>{
      this.checkReset();
    },60000);

    console.log("🏆 Tournament Engine Ready");
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
  CREATE STRUCTURE
  ===================================== */

  ensure(){

    if(this.data) return;

    const now=Date.now();

    this.data={
      weekly:{
        start:now,
        pool:0,
        scores:{}
      },
      monthly:{
        start:now,
        pool:0,
        scores:{}
      }
    };

    this.save();
  },

  /* ===================================== */
  ADD SCORE
  ===================================== */

  addScore(type){

    const id=GAME.user.id;

    this.add(this.data.weekly,id,type);
    this.add(this.data.monthly,id,type);

    this.save();
  },

  add(block,id,type){

    if(!block.scores[id])
      block.scores[id]=0;

    block.scores[id]++;

    block.pool += REWARD_POOL_GAIN[type] || 1;
  },

  /* ===================================== */
  EVENTS
  ===================================== */

  bindEvents(){

    EVENT.on("pvp:win",()=>{
      this.addScore("pvp_win");
    });

    EVENT.on("mission:completed",()=>{
      this.addScore("mission");
    });

  },

  /* ===================================== */
  RESET CHECK
  ===================================== */

  checkReset(){

    const now=Date.now();

    if(now-this.data.weekly.start > WEEK){
      this.finish("weekly");
    }

    if(now-this.data.monthly.start > MONTH){
      this.finish("monthly");
    }
  },

  /* ===================================== */
  FINISH TOURNAMENT
  ===================================== */

  finish(type){

    const block=this.data[type];

    const winner=this.getWinner(block.scores);

    if(winner){

      EVENT.emit("tournament:winner",{
        type,
        winner,
        reward:block.pool
      });

      console.log(
        "🏆 "+type+" winner:",
        winner,
        "reward:",
        block.pool
      );
    }

    /* reset */
    block.start=Date.now();
    block.pool=0;
    block.scores={};

    this.save();
  },

  /* ===================================== */
  FIND WINNER
  ===================================== */

  getWinner(scores){

    let best=null;
    let max=-1;

    Object.keys(scores).forEach(id=>{
      if(scores[id]>max){
        max=scores[id];
        best=id;
      }
    });

    return best;
  },

  /* ===================================== */
  LEAGUE (ELO BASED)
  ===================================== */

  league(){

    if(!window.RANKING) return "Unranked";

    const elo =
      RANKING.ensurePlayer(GAME.user.id).elo;

    if(elo<800) return "Bronze";
    if(elo<1200) return "Silver";
    if(elo<1600) return "Gold";
    if(elo<2000) return "Platinum";
    if(elo<2400) return "Diamond";

    return "Legend";
  }

};

window.TOURNAMENT=TOURNAMENT;

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  TOURNAMENT.init();
});

})();
