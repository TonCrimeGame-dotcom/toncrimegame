/* ===================================================
   TONCRIME QUESTION ENGINE
   Infinite Non-Repeating Question System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Question engine waiting EVENT...");
  return;
}

/* ===========================================
   SAMPLE QUESTION BANK
   (sonra DB'ye taşınabilir)
=========================================== */

const QUESTION_BANK=[

{
id:1,
q:"Türkiye'nin başkenti neresidir?",
a:["İstanbul","Ankara","İzmir","Bursa"],
c:1
},
{
id:2,
q:"5 + 7 kaçtır?",
a:["10","11","12","13"],
c:2
},
{
id:3,
q:"HTML neyin kısaltmasıdır?",
a:[
"Hyper Text Markup Language",
"High Transfer Machine Logic",
"Home Tool Mark Language",
"Hyper Tool Multi Language"
],
c:0
},
{
id:4,
q:"Dünya kaç kıtadan oluşur?",
a:["5","6","7","8"],
c:2
},
{
id:5,
q:"TON hangi blockchain üzerine kuruludur?",
a:["Ethereum","TON","Solana","Polygon"],
c:1
}

];

/* ===========================================
   STORAGE
=========================================== */

const STORAGE_KEY="tc_answered";

/* ===========================================
   ENGINE
=========================================== */

const QUESTIONS={

answered:{},

init(){
  this.load();
  console.log("🧠 Question Engine Ready");
},

load(){
  try{
    this.answered=
      JSON.parse(localStorage.getItem(STORAGE_KEY))
      || {};
  }catch{
    this.answered={};
  }

  if(!this.answered[CONFIG.USER_ID])
    this.answered[CONFIG.USER_ID]=[];
},

save(){
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(this.answered)
  );
},

/* ===========================================
   GET RANDOM QUESTION
=========================================== */

get(){

  const used=this.answered[CONFIG.USER_ID];

  let available=
    QUESTION_BANK.filter(q=>!used.includes(q.id));

  /* reset if finished */
  if(available.length===0){
    this.answered[CONFIG.USER_ID]=[];
    available=[...QUESTION_BANK];
  }

  const q=
    available[
      Math.floor(Math.random()*available.length)
    ];

  used.push(q.id);
  this.save();

  return q;
},

/* ===========================================
   GET SET (5 QUESTIONS)
=========================================== */

getSet(count=5){

  let set=[];

  for(let i=0;i<count;i++)
    set.push(this.get());

  return set;
}

};

window.QUESTIONS=QUESTIONS;

/* START */

EVENT.on("game:ready",()=>{
  QUESTIONS.init();
});

/* REGISTER */

if(window.CORE){
  CORE.register(
    "Question Engine",
    ()=>!!window.QUESTIONS
  );
}

})();
