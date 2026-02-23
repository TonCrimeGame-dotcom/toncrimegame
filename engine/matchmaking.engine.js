/* ===================================================
   TONCRIME MATCHMAKING ENGINE
   Async PvP Match System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Matchmaking waiting EVENT...");
  return;
}

/* ===========================================
   STORAGE
=========================================== */

const STORAGE_KEY="tc_match_pool";

/* ===========================================
   ENGINE
=========================================== */

const MATCHMAKING={

  pool:[],

  /* ===================================== */
  init(){

    this.load();
    this.bindEvents();

    console.log("⚔ Matchmaking Engine Ready");
  },

  /* ===================================== */
  load(){
    try{
      this.pool=
        JSON.parse(localStorage.getItem(STORAGE_KEY))
        || [];
    }catch{
      this.pool=[];
    }
  },

  save(){
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.pool)
    );
  },

  /* ===================================== */
  bindEvents(){

    EVENT.on("pvp:search",()=>{
      this.enterQueue();
    });

  },

  /* ===================================== */
  enterQueue(){

    if(!window.GAME || !GAME.user) return;

    const player={
      id:GAME.user.id,
      name:GAME.user.name,
      elo: (window.RANKING ?
            RANKING.ensurePlayer(GAME.user.id).elo
            :1000),
      joined:Date.now()
    };

    console.log("🔎 Searching opponent...");

    const opponent=this.findOpponent(player);

    if(opponent){
      this.createMatch(player,opponent);
    }else{
      this.pool.push(player);
      this.save();
      EVENT.emit("match:waiting",player);
    }

  },

  /* ===================================== */
  findOpponent(player){

    if(this.pool.length===0) return null;

    let bestIndex=-1;
    let bestDiff=999999;

    this.pool.forEach((p,i)=>{

      const diff=Math.abs(p.elo-player.elo);

      if(diff<bestDiff){
        bestDiff=diff;
        bestIndex=i;
      }

    });

    /* skill range expand */
    if(bestDiff>400) return null;

    const opponent=this.pool.splice(bestIndex,1)[0];

    this.save();

    return opponent;
  },

  /* ===================================== */
  createMatch(A,B){

    const match={
      id:"match_"+Date.now(),
      playerA:A,
      playerB:B,
      created:Date.now(),
      status:"active"
    };

    console.log("⚔ Match Found:",match.id);

    EVENT.emit("match:found",match);

    /* start battle */
    EVENT.emit("pvp:start",match);
  },

  /* ===================================== */
  SOLO FALLBACK
  ===================================== */

  soloCheck(){

    const now=Date.now();

    this.pool.forEach(player=>{

      if(now-player.joined>10000){

        console.log("🤖 Solo match opened");

        const soloMatch={
          id:"solo_"+Date.now(),
          playerA:player,
          playerB:null,
          solo:true,
          created:now
        };

        EVENT.emit("match:solo",soloMatch);
      }

    });

  }

};

window.MATCHMAKING=MATCHMAKING;

/* ===========================================
   LOOP CHECK
=========================================== */

setInterval(()=>{
  if(window.MATCHMAKING)
    MATCHMAKING.soloCheck();
},3000);

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  MATCHMAKING.init();
});

})();
