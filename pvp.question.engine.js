/* ===================================================
   TONCRIME PVP QUESTION ENGINE
=================================================== */

GAME.questions = {
  pool:[],
  loaded:false
};

/* ===================================================
   SAMPLE QUESTION POOL
   (sonra DB'den çekilecek)
=================================================== */

const QUESTION_POOL = [

{
id:1,
q:"5 + 7 kaçtır?",
answers:["10","12","13","14"],
correct:1
},

{
id:2,
q:"Türkiye'nin başkenti?",
answers:["İstanbul","Ankara","İzmir","Bursa"],
correct:1
},

{
id:3,
q:"9 x 6 = ?",
answers:["42","54","63","48"],
correct:1
},

{
id:4,
q:"HTML neyin kısaltmasıdır?",
answers:[
"Hyper Text Markup Language",
"High Transfer Machine Logic",
"Home Tool Mark Language",
"Hyperlink Tool"
],
correct:0
},

{
id:5,
q:"TON hangi blockchain?",
answers:["Ethereum","TON","Solana","Polygon"],
correct:1
}

];

/* ===================================================
   LOAD QUESTIONS
=================================================== */

async function loadQuestions(){

  GAME.questions.pool = QUESTION_POOL;

  GAME.questions.loaded = true;

  console.log("Questions loaded:",
    GAME.questions.pool.length);
}

/* ===================================================
   SEEDED RANDOM
=================================================== */

function seededRandom(seed){

  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/* ===================================================
   SHUFFLE WITH SEED
=================================================== */

function shuffleSeeded(array,seed){

  let arr=[...array];

  for(let i=arr.length-1;i>0;i--){

    const j=Math.floor(
      seededRandom(seed+i)*(i+1)
    );

    [arr[i],arr[j]]=[arr[j],arr[i]];
  }

  return arr;
}

/* ===================================================
   GENERATE MATCH QUESTIONS
=================================================== */

function generateMatchQuestions(matchId,count=5){

  if(!GAME.questions.loaded)
    return [];

  /* matchId → numeric seed */
  let seed = 0;

  for(let i=0;i<matchId.length;i++)
    seed += matchId.charCodeAt(i);

  const shuffled =
    shuffleSeeded(GAME.questions.pool,seed);

  return shuffled.slice(0,count);
}

/* ===================================================
   ANSWER VALIDATION
=================================================== */

function validateAnswer(question,answerIndex){

  return question.correct === answerIndex;
}

/* ===================================================
   SCORE CALCULATION
=================================================== */

function calculateScore(results){

  /*
  results:
  [
    {correct:true,time:850},
    ...
  ]
  */

  let score=0;
  let totalTime=0;

  results.forEach(r=>{
    if(r.correct){
      score+=100;
      score+=Math.max(0,1000-r.time);
    }
    totalTime+=r.time;
  });

  return {
    score,
    totalTime
  };
}

/* ===================================================
   INIT
=================================================== */

document.addEventListener(
  "DOMContentLoaded",
  loadQuestions
);
