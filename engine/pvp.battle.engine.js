/* ===================================================
   TONCRIME PVP BATTLE ENGINE
   =================================================== */

(function(){

const PVP_BATTLE={};

let battle=null;

/* ================= START ================= */

PVP_BATTLE.start=function(match,question){

battle={
match,
question,
start:Date.now(),
answered:false
};

renderBattle();
};

/* ================= UI ================= */

function renderBattle(){

const root=document.getElementById("tc-content");

root.innerHTML=`
<div class="card">
<h2>⚔ PvP Savaşı</h2>

<h3>${battle.question.q}</h3>

<div id="timer">10.0</div>

<div id="answers">
${battle.question.a.map((x,i)=>
`<button onclick="PVP_BATTLE.answer(${i})">${x}</button>`
).join("")}
</div>

</div>
`;

startTimer();
}

/* ================= TIMER ================= */

function startTimer(){

const timer=document.getElementById("timer");

const int=setInterval(()=>{

let t=10-(Date.now()-battle.start)/1000;

timer.innerText=t.toFixed(1);

if(t<=0){
clearInterval(int);
finish(-1);
}

},50);

}

/* ================= ANSWER ================= */

PVP_BATTLE.answer=function(index){

if(battle.answered) return;

battle.answered=true;

const time=(Date.now()-battle.start);

finish(index,time);
};

/* ================= FINISH ================= */

async function finish(answer,time=99999){

const scoreHash=btoa(answer+"-"+time);

await fetch(
CONFIG.SUPABASE_URL+
"/functions/v1/resolve-pvp",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
user:CONFIG.USER_ID,
match:battle.match.id,
answer,
time,
hash:scoreHash
})
});

EVENT.emit("notify","⚔ Sonuç hesaplanıyor...");
};

/* ================= EXPORT ================= */

window.PVP_BATTLE=PVP_BATTLE;

})();
