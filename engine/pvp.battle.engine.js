/* ===================================================
   TONCRIME PVP BATTLE ENGINE
   Question Fight System + Weapon Speed
   =================================================== */

(function(){

if(!window.EVENT || !window.QUESTION || !window.WEAPONS){
  console.warn("⚠ PvP Battle waiting dependencies...");
  return;
}

const PVP_BATTLE = {

  questions: [],
  index: 0,
  results: [],
  timer: null,
  startTime: 0,
  timeLimit: 10000, // 10 saniye
  correctAnswer: 0,

  /* ===========================================
     START BATTLE
  =========================================== */

  async start(){

    console.log("⚔ PvP Battle Started");

    this.questions = QUESTION.getSet(5);
    this.index = 0;
    this.results = [];

    SCENE.load("pvp_battle");

    setTimeout(()=>this.nextQuestion(),200);
  },

  /* ===========================================
     LOAD NEXT QUESTION
  =========================================== */

  nextQuestion(){

    if(this.index >= this.questions.length){
      this.finish();
      return;
    }

    const q = this.questions[this.index];

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

    const container = document.getElementById("answers");

    q.a.forEach((text,i)=>{

      const btn=document.createElement("button");
      btn.className="answerBtn";
      btn.innerText=text;

      btn.onclick=()=>this.answer(i);

      container.appendChild(btn);
    });

    this.correctAnswer = q.correct;

    this.startTimer();
  },

  /* ===========================================
     TIMER SYSTEM
  =========================================== */

  startTimer(){

    const bar=document.getElementById("timerBar");

    this.startTime = Date.now();

    this.timer=setInterval(()=>{

      const elapsed = Date.now() - this.startTime;
      const percent = 100 - (elapsed/this.timeLimit*100);

      if(bar) bar.style.width = percent+"%";

      if(elapsed >= this.timeLimit){
        clearInterval(this.timer);
        this.record(false, elapsed);
      }

    },16);
  },

  /* ===========================================
     ANSWER CLICK
  =========================================== */

  answer(index){

    clearInterval(this.timer);

    const elapsed = Date.now() - this.startTime;
    const correct = index === this.correctAnswer;

    this.record(correct, elapsed);
  },

  /* ===========================================
     RECORD RESULT (WEAPON BONUS ACTIVE)
  =========================================== */

  record(correct, rawTime){

    const weapon =
      (GAME.user && GAME.user.weapon)
      ? GAME.user.weapon
      : "Fists";

    const adjustedTime =
      WEAPONS.apply(rawTime, weapon);

    this.results.push({
      correct: correct,
      raw_time: rawTime,
      final_time: adjustedTime,
      weapon: weapon
    });

    this.index++;

    setTimeout(()=>this.nextQuestion(),400);
  },

  /* ===========================================
     FINISH MATCH
  =========================================== */

  async finish(){

    console.log("🏁 Battle Finished", this.results);

    /* HASH (ANTI CHEAT) */

    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(this.results))
    );

    const hash = [...new Uint8Array(hashBuffer)]
      .map(b=>b.toString(16).padStart(2,"0"))
      .join("");

    EVENT.emit("pvp:finished",{
      results:this.results,
      hash:hash
    });

    TEMPLATE.load(`
      <div class="battle">
        <h2>Sonuçlar gönderiliyor...</h2>
      </div>
    `);
  }

};

window.PVP_BATTLE = PVP_BATTLE;


/* ===========================================
   EVENT HOOK
=========================================== */

EVENT.on("pvp:start",()=>{
  PVP_BATTLE.start();
});

console.log("⚔ PvP Battle Engine Ready");

})();
