/* ===================================================
   TONCRIME QUESTION ENGINE
   Infinite Deterministic Question System
   =================================================== */

(function(){

/* ===================================================
   QUESTION POOLS
   (örnek — sonra büyüteceğiz)
   =================================================== */

const POOLS = {

  math:[
    q => `${q.a} + ${q.b} kaçtır?`,
    q => `${q.a} × ${q.b} kaçtır?`,
    q => `${q.a} - ${q.b} kaçtır?`
  ],

  compare:[
    q => `${q.a} mi büyük ${q.b} mi?`
  ]

};


/* ===================================================
   SEEDED RANDOM (DETERMINISTIC)
   Aynı seed = aynı soru
   =================================================== */

function seededRandom(seed){

  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}


/* ===================================================
   RANDOM INT
   =================================================== */

function rand(seed,min,max){
  return Math.floor(
    seededRandom(seed)*(max-min+1)
  ) + min;
}


/* ===================================================
   QUESTION GENERATOR
   =================================================== */

function generate(seed){

  const typeIndex =
    rand(seed,0,Object.keys(POOLS).length-1);

  const type =
    Object.keys(POOLS)[typeIndex];

  const templates = POOLS[type];

  const template =
    templates[rand(seed+3,0,templates.length-1)];

  const data={
    a: rand(seed+11,1,20),
    b: rand(seed+19,1,20)
  };

  const questionText = template(data);

  const answer = solve(type,data);

  return {
    seed,
    type,
    question:questionText,
    answer,
    hash:createHash(answer)
  };
}


/* ===================================================
   SOLVER
   =================================================== */

function solve(type,d){

  switch(type){

    case "math":
      return d.a + d.b; // default (expand later)

    case "compare":
      return d.a > d.b ? d.a : d.b;

    default:
      return 0;
  }
}


/* ===================================================
   SIMPLE HASH
   Anti Cheat Base
   =================================================== */

function createHash(value){

  let str = String(value);
  let hash = 0;

  for(let i=0;i<str.length;i++){
    hash = ((hash<<5)-hash)+str.charCodeAt(i);
    hash |= 0;
  }

  return hash.toString();
}


/* ===================================================
   PUBLIC API
   =================================================== */

window.QUESTION = {

  current:null,

  create(matchId){

    const seed =
      Number(matchId) +
      Math.floor(Date.now()/1000);

    const q = generate(seed);

    this.current = q;

    console.log("🧠 Question Created:",q);

    EVENT.emit("question:new",q);

    return q;
  },

  verify(answer){

    if(!this.current) return false;

    const hash=createHash(answer);

    return hash===this.current.hash;
  }

};

console.log("🧠 Question Engine Ready");

})();
