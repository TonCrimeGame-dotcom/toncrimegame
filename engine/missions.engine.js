/* ===================================================
   TONCRIME MISSIONS ENGINE v2
   Animated Mission System
   =================================================== */

(function(){

if(!window.EVENT) return;

/* ================= MISSIONS ================= */

const MISSIONS_LIST=[

{ id:1,name:"Sokak Satıcılığı",energy:3,xp:5,reward:0.05,risk:10,time:3000 },
{ id:2,name:"Kaçak Mal Taşıma",energy:8,xp:12,reward:0.15,risk:25,time:5000 },
{ id:3,name:"Gece Baskını",energy:15,xp:20,reward:0.35,risk:45,time:8000 },
{ id:4,name:"Pavyon Soygunu",energy:25,xp:25,reward:1,risk:80,time:12000 }

];

let running=false;

/* ================= UI ================= */

function progressHTML(id){

return `
<div class="mission-progress">
<div id="bar-${id}" class="progress-fill"></div>
</div>
`;
}

/* ================= ENGINE ================= */

const MISSIONS={

render(){

const root=document.getElementById("tc-content");
if(!root) return;

let html=`<h2>🎯 Görevler</h2>`;

MISSIONS_LIST.forEach(m=>{

html+=`
<div class="card" id="mission-${m.id}">
<b>${m.name}</b><br>
Enerji: ${m.energy}<br>
XP: ${m.xp}<br>
Kazanç: ${m.reward} Yton<br>
Risk: %${m.risk}

${progressHTML(m.id)}

<button id="btn-${m.id}"
onclick="MISSIONS.start(${m.id})">
Başlat
</button>
</div>
`;

});

root.innerHTML=html;
},

/* ================= START ================= */

async start(id){

if(running) return;
running=true;

const mission=MISSIONS_LIST.find(x=>x.id===id);
const user=GAME.user;

if(user.energy<mission.energy){
EVENT.emit("notify","⚡ Enerji yetersiz");
running=false;
return;
}

const btn=document.getElementById("btn-"+id);
btn.disabled=true;

const bar=document.getElementById("bar-"+id);

/* animation */

let start=Date.now();

const anim=setInterval(()=>{

let progress=
(Date.now()-start)/mission.time*100;

bar.style.width=Math.min(progress,100)+"%";

},50);

/* wait */

await new Promise(r=>setTimeout(r,mission.time));

clearInterval(anim);

/* RESULT */

user.energy-=mission.energy;

const success=Math.random()*100>mission.risk;

if(success){

user.xp+=mission.xp;
user.yton+=mission.reward;

if(user.xp>=CONFIG.XP_LIMIT){
user.xp-=CONFIG.XP_LIMIT;
user.level++;
EVENT.emit("notify","⭐ LEVEL UP!");
}

EVENT.emit("mission:completed");

EVENT.emit("notify",
`✅ +${mission.reward} Yton`
);

}else{

EVENT.emit("notify","❌ Başarısız");

if(Math.random()<0.7){
EVENT.emit("player:hospitalized");
}

}

/* SAVE */

await db.from("users").update({
energy:user.energy,
xp:user.xp,
yton:user.yton,
level:user.level
}).eq("id",user.id);

EVENT.emit("user:update");

btn.disabled=false;
bar.style.width="0%";
running=false;

}

};

window.MISSIONS=MISSIONS;

/* ================= PAGE HOOK ================= */

EVENT.on("page:enter",page=>{
if(page==="missions") MISSIONS.render();
});

/* ================= REGISTER ================= */

if(window.CORE){
CORE.register("Mission Engine",()=>!!window.MISSIONS);
}

})();
