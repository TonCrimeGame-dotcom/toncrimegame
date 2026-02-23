/* ===================================================
   TONCRIME PvP SESSION ENGINE
   Question Flow + Timer + Hash Score
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("PvP Session waiting EVENT...");
  return;
}

/* ===========================================
   CONFIG
=========================================== */

const QUESTION_COUNT = 5;

/* ===========================================
   ENGINE
=========================================== */

const PVP_SESSION = {

  active:null,

  /* ===================================== */
  start(match){

    console.log("🧠 PvP Session Start");

    const questions=this.generateQuestions();

    this.active={
      matchId:match.id,
      questions,
      index:0,
      answers:[],
      started:Date.now(),
      questionStart:Date.now()
    };

    EVENT.emit("pvp:question",questions[0]);
  },

  /* ===================================== */
  generateQuestions(){

    if(!window.QUESTION){
      console.warn("Question engine missing");
      return [];
    }

    return QUESTION.randomSet(QUESTION_COUNT);
  },

  /* ===================================== */
  answer(choice){

    if(!this.active) return;

    const q=this.active.questions[this.active.index];

    const time=Date.now()-this.active.questionStart;

    const correct=(choice===q.correct);

    this.active.answers.push({
      id:q.id,
      correct,
      time
    });

    this.next();
  },

  /* ===================================== */
  next(){

    this.active.index++;

    if(this.active.index>=this.active.questions.length){
      this.finish();
      return;
    }

    this.active.questionStart=Date.now();

    EVENT.emit(
      "pvp:question",
      this.active.questions[this.active.index]
    );
  },

  /* ===================================== */
  HASH SCORE
  ===================================== */

  buildHash(){

    const raw=JSON.stringify(this.active.answers)
      + this.active.matchId;

    let hash=0;

    for(let i=0;i<raw.length;i++){
      hash=((hash<<5)-hash)+raw.charCodeAt(i);
      hash|=0;
    }

    return Math.abs(hash);
  },

  /* ===================================== */
  FINISH
  ===================================== */

  finish(){

    console.log("✅ PvP Session Finished");

    const result={
      match_id:this.active.matchId,
      answers:this.active.answers,
      totalTime:Date.now()-this.active.started,
      hash:this.buildHash()
    };

    EVENT.emit("pvp:session:finished",result);

    this.active=null;
  }

};

window.PVP_SESSION=PVP_SESSION;

/* ===========================================
   EVENT BINDINGS
=========================================== */

EVENT.on("pvp:start",(match)=>{
  PVP_SESSION.start(match);
});

EVENT.on("pvp:answer",(choice)=>{
  PVP_SESSION.answer(choice);
});

console.log("🧠 PvP Session Engine Ready");

})();
