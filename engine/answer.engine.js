/* ===================================================
   TONCRIME ANSWER ENGINE
   PvP Timing + Anti Cheat Core
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Answer engine waiting EVENT...");
  return;
}

const ANSWER={

startTime:0,
currentQuestion:null,
answers:[],
matchId:null,

/* ===========================================
   START QUESTION
=========================================== */

start(question,matchId){

  this.currentQuestion=question;
  this.matchId=matchId;
  this.startTime=performance.now();

  EVENT.emit("question:render",question);
},

/* ===========================================
   SUBMIT ANSWER
=========================================== */

submit(choice){

  if(!this.currentQuestion) return;

  const end=performance.now();

  let elapsed=end-this.startTime; // ms

  /* weapon modifier */
  elapsed=this.applyWeaponBonus(elapsed);

  const correct =
    choice===this.currentQuestion.c;

  const result={
    questionId:this.currentQuestion.id,
    choice,
    correct,
    time:Math.round(elapsed)
  };

  this.answers.push(result);

  EVENT.emit("answer:recorded",result);
},

/* ===========================================
   WEAPON BONUS
   (slower timer effect)
=========================================== */

applyWeaponBonus(time){

  const weapon=GAME.user.weapon_bonus||0;

  /* örnek:
     %10 bonus = süre %10 düşer
  */

  const modified=
    time*(1-(weapon/100));

  return modified;
},

/* ===========================================
   FINISH MATCH
=========================================== */

async finish(){

  const totalTime=
    this.answers.reduce((t,a)=>t+a.time,0);

  const score=
    this.answers.filter(a=>a.correct).length;

  const hash=await this.createHash({
    answers:this.answers,
    totalTime,
    score
  });

  EVENT.emit("pvp:submit",{
    matchId:this.matchId,
    score,
    totalTime,
    hash
  });

  this.reset();
},

/* ===========================================
   HASH (ANTI CHEAT)
=========================================== */

async createHash(data){

  const enc=new TextEncoder();
  const buffer=enc.encode(JSON.stringify(data));

  const hashBuffer=
    await crypto.subtle.digest(
      "SHA-256",
      buffer
    );

  const hashArray=
    Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map(b=>b.toString(16).padStart(2,"0"))
    .join("");
},

/* ===========================================
   RESET
=========================================== */

reset(){
  this.answers=[];
  this.currentQuestion=null;
  this.startTime=0;
}

};

window.ANSWER=ANSWER;

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "Answer Engine",
    ()=>!!window.ANSWER
  );
}

})();
