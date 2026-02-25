/* ===================================================
   TONCRIME PVP BATTLE ENGINE
=================================================== */

GAME.battle = {
  active:false,
  matchId:null,
  questions:[],
  index:0,
  startTime:0,
  results:[]
};

/* ===================================================
   START MATCH
=================================================== */

function startBattle(matchId){

  GAME.battle.matchId = matchId;
  GAME.battle.questions =
    generateMatchQuestions(matchId,5);

  GAME.battle.index = 0;
  GAME.battle.results = [];
  GAME.battle.active = true;

  nextQuestion();
}

/* ===================================================
   LOAD NEXT QUESTION
=================================================== */

function nextQuestion(){

  if(!GAME.battle.active) return;

  if(GAME.battle.index >=
     GAME.battle.questions.length){

    finishBattle();
    return;
  }

  const q =
    GAME.battle.questions[GAME.battle.index];

  GAME.battle.startTime =
    performance.now();

  renderQuestion(q);
}

/* ===================================================
   RENDER QUESTION (UI hook)
=================================================== */

function renderQuestion(q){

  const area =
    document.getElementById("pvpQuestion");

  if(!area) return;

  let html = `<h2>${q.q}</h2>`;

  q.answers.forEach((a,i)=>{
    html += `
      <button onclick="answerQuestion(${i})">
        ${a}
      </button>
    `;
  });

  area.innerHTML = html;
}

/* ===================================================
   ANSWER
=================================================== */

function answerQuestion(index){

  if(!GAME.battle.active) return;

  const q =
    GAME.battle.questions[GAME.battle.index];

  const end = performance.now();
  const time =
    Math.floor(end - GAME.battle.startTime);

  const correct =
    validateAnswer(q,index);

  GAME.battle.results.push({
    question:q.id,
    answer:index,
    correct,
    time
  });

  GAME.battle.index++;

  setTimeout(nextQuestion,300);
}

/* ===================================================
   SCORE + HASH
=================================================== */

async function finishBattle(){

  GAME.battle.active=false;

  const scoreData =
    calculateScore(GAME.battle.results);

  const payload = {
    match_id:GAME.battle.matchId,
    user_id:CONFIG.USER_ID,
    results:GAME.battle.results,
    score:scoreData.score,
    total_time:scoreData.totalTime
  };

  payload.hash =
    await createBattleHash(payload);

  sendBattleResult(payload);
}

/* ===================================================
   HASH (ANTI CHEAT BASE)
=================================================== */

async function createBattleHash(data){

  const text =
    JSON.stringify(data.results)
    + data.total_time
    + CONFIG.USER_ID;

  const enc =
    new TextEncoder().encode(text);

  const buffer =
    await crypto.subtle.digest("SHA-256",enc);

  const hashArray =
    Array.from(new Uint8Array(buffer));

  return hashArray
    .map(b=>b.toString(16).padStart(2,"0"))
    .join("");
}

/* ===================================================
   SEND RESULT
=================================================== */

async function sendBattleResult(payload){

  await fetch(
    CONFIG.SUPABASE_URL+
    "/functions/v1/resolve-pvp",
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify(payload)
    }
  );

  console.log("Battle sent");
}
