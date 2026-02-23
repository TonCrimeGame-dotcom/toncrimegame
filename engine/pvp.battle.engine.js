/* ===================================================
   TONCRIME PVP BATTLE ENGINE
   Question Fight UI System
   =================================================== */

(function(){

if(!window.EVENT || !window.QUESTION){
  console.warn("PvP Battle waiting...");
  return;
}

const PVP_BATTLE = {

  questions:[],
  index:0,
  startTime:0,
  results:[],
  timer:null,
  timeLimit:10000, // 10sn

  /* ======================================
     START BATTLE
  ====================================== */

  async start(){

    console.log("⚔ PvP Battle Started");

    this.questions = QUESTION.getSet(5);
    this.index=0;
    this.results=[];

    SCENE.load("pvp_battle");

    setTimeout(()=>this.nextQuestion(),200);
  },

  /* ======================================
     NEXT QUESTION
  ====================================== */

  nextQuestion(){

    if(this.index>=this.questions.length){
      this.finish();
      return;
    }

    const q=this.questions[this.index];

    TEMPLATE.load(`
      <div class="battle">

        <h2>Soru ${this.index+1}/5</h2>

        <div class="question">${q.q}</div>

        <div id="answers"></div>

        <div class="timer">
          <div id="timerBar"></div>
        </div>

      </div>
    `);

    const ans=document.getElementById("answers");

    q.a.forEach((text,i)=>{

      const btn=document.createElement("button");
      btn.className="answerBtn";
      btn.innerText=text;

      btn.onclick=()=>this.answer(i);

      ans.appendChild(btn);
    });

    this.startTimer(q.correct);
  },

  /* ======================================
     TIMER
  ====================================== */

  startTimer(correct){

    const bar=document.getElementById("timerBar");

    let start=Date.now();
    this.startTime=start;

    this.timer=setInterval(()=>{

      const elapsed=Date.now()-start;
      const percent=100-(elapsed/this.timeLimit*100);

      bar.style.width=percent+"%";

      if(elapsed>=this.timeLimit){
        clearInterval(this.timer);
        this.record(false,elapsed);
      }

    },16);

    this.correctAnswer=correct;
  },

  /* ======================================
     ANSWER CLICK
  ====================================== */

  answer(index){

    clearInterval(this.timer);

    const time=Date.now()-this.startTime;

    const correct=index===this.correctAnswer;

    this.record(correct,time);
  },

  /* ======================================
     SAVE RESULT
  ====================================== */

  record(correct,time){

    this.results.push({
      correct,
      time
    });

    this.index++;

    setTimeout(()=>this.nextQuestion(),400);
  },

  /* ======================================
     FINISH MATCH
  ====================================== */

  async finish(){

    console.log("Battle finished",this.results);

    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(this.results))
    );

    const hashHex=[...new Uint8Array(hash)]
      .map(b=>b.toString(16).padStart(2,"0"))
      .join("");

    EVENT.emit("pvp:finished",{
      results:this.results,
      hash:hashHex
    });

    TEMPLATE.load(`
      <h2>Sonuç gönderiliyor...</h2>
    `);
  }

};

window.PVP_BATTLE=PVP_BATTLE;


/* ======================================
   EVENT HOOK
====================================== */

EVENT.on("pvp:start",()=>{
  PVP_BATTLE.start();
});

console.log("⚔ PvP Battle Engine Ready");

})();
