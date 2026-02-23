/* ===================================================
   TONCRIME PVP MATCHMAKER ENGINE
   Smart Queue + Ghost Match System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Matchmaker waiting EVENT...");
  return;
}

const MATCHMAKER={

queue:[],
matches:{},

SEARCH_EXPAND_TIME:10000,

/* ===========================================
   INIT
=========================================== */

init(){

  EVENT.on("pvp:queue",data=>{
    this.joinQueue(data);
  });

  console.log("⚔ Matchmaker Ready");
},

/* ===========================================
   JOIN QUEUE
=========================================== */

joinQueue({attacker,defender}){

  const player=GAME.user;

  const entry={
    id:attacker,
    level:player.level,
    range:2,
    time:Date.now(),
    target:defender
  };

  this.queue.push(entry);

  EVENT.emit("notify","Rakip aranıyor...");

  this.tryMatch();
},

/* ===========================================
   FIND MATCH
=========================================== */

tryMatch(){

  for(let i=0;i<this.queue.length;i++){

    for(let j=i+1;j<this.queue.length;j++){

      const A=this.queue[i];
      const B=this.queue[j];

      if(this.compatible(A,B)){
        this.createMatch(A,B);
        return;
      }
    }
  }
},

/* ===========================================
   LEVEL CHECK
=========================================== */

compatible(A,B){

  if(A.target && A.target!==B.id) return false;
  if(B.target && B.target!==A.id) return false;

  const diff=Math.abs(A.level-B.level);

  return diff<=Math.max(A.range,B.range);
},

/* ===========================================
   CREATE MATCH
=========================================== */

createMatch(A,B){

  const matchId="match_"+Date.now();

  this.matches[matchId]={
    id:matchId,
    players:[A.id,B.id],
    status:"active",
    start:Date.now()
  };

  this.queue=
    this.queue.filter(q=>q!==A && q!==B);

  EVENT.emit("pvp:start",this.matches[matchId]);

  EVENT.emit(
    "notify",
    "⚔ Rakip bulundu!"
  );
},

/* ===========================================
   EXPAND SEARCH
=========================================== */

expandRanges(){

  const now=Date.now();

  this.queue.forEach(q=>{

    if(now-q.time>this.SEARCH_EXPAND_TIME){
      q.range+=2;
      q.time=now;

      EVENT.emit(
        "notify",
        "Arama aralığı genişledi"
      );
    }

  });
},

/* ===========================================
   SOLO MATCH
=========================================== */

ghostCheck(){

  const now=Date.now();

  this.queue.forEach(q=>{

    if(now-q.time>20000){

      const matchId="ghost_"+Date.now();

      this.matches[matchId]={
        id:matchId,
        players:[q.id],
        status:"ghost",
        start:Date.now()
      };

      EVENT.emit("pvp:start",
        this.matches[matchId]
      );

      EVENT.emit(
        "notify",
        "⏱ Solo PvP başlatıldı"
      );

      this.queue=
        this.queue.filter(x=>x!==q);
    }

  });
}

};

/* ===========================================
   LOOP
=========================================== */

setInterval(()=>{
  MATCHMAKER.expandRanges();
  MATCHMAKER.ghostCheck();
},5000);

window.MATCHMAKER=MATCHMAKER;

/* START */

EVENT.on("game:ready",()=>{
  MATCHMAKER.init();
});

/* REGISTER */

if(window.CORE){
  CORE.register(
    "PvP Matchmaker",
    ()=>!!window.MATCHMAKER
  );
}

})();
