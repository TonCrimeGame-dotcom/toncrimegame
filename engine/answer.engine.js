/* ===================================================
   TONCRIME ANSWER ENGINE
   PvP Answer + Time + Hash System
   =================================================== */

(function(){

let startTime = 0;
let answered = false;


/* ===================================================
   START QUESTION TIMER
   =================================================== */

function startTimer(){

  startTime = Date.now();
  answered = false;

  console.log("⏱ Question timer started");
}


/* ===================================================
   CREATE ANSWER HASH
   =================================================== */

function createHash(value,time){

  const raw = value + "|" + time;

  let hash = 0;

  for(let i=0;i<raw.length;i++){
    hash = ((hash<<5)-hash)+raw.charCodeAt(i);
    hash |= 0;
  }

  return hash.toString();
}


/* ===================================================
   SEND ANSWER
   =================================================== */

async function submit(answer){

  if(answered) return;
  if(!QUESTION.current) return;
  if(!GAME.user) return;

  answered = true;

  const elapsed =
    Math.floor((Date.now()-startTime)/1000);

  const hash =
    createHash(answer,elapsed);

  const payload = {

    match_id: STATE.get("currentMatch"),
    user_id: GAME.user.id,
    answer: answer,
    time: elapsed,
    hash: hash,
    question_seed: QUESTION.current.seed
  };

  console.log("📨 Sending Answer:",payload);

  const { error } = await db
    .from("pvp_answers")
    .insert(payload);

  if(error){
    console.error("Answer send error:",error);
    answered=false;
    return;
  }

  EVENT.emit("answer:sent",payload);
}


/* ===================================================
   LISTEN QUESTION EVENT
   =================================================== */

EVENT.on("question:new",()=>{
  startTimer();
});


/* ===================================================
   PUBLIC API
   =================================================== */

window.ANSWER = {

  send(value){
    submit(value);
  },

  reset(){
    answered=false;
    startTime=0;
  }

};

console.log("⚔️ Answer Engine Ready");

})();
