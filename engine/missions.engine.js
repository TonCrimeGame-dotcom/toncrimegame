/* ===================================================
   TONCRIME MISSIONS ENGINE
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Missions waiting EVENT...");
  return;
}

/* ================= MISSIONS DATA ================= */

const MISSIONS_LIST=[

{
id:1,
name:"Sokak Satıcılığı",
energy:3,
xp:5,
reward:0.05,
risk:10
},

{
id:2,
name:"Kaçak Mal Taşıma",
energy:8,
xp:12,
reward:0.15,
risk:25
},

{
id:3,
name:"Gece Baskını",
energy:15,
xp:20,
reward:0.35,
risk:45
},

{
id:4,
name:"Pavyon Soygunu",
energy:25,
xp:25,
reward:1,
risk:80
}

];

/* ================= ENGINE ================= */

const MISSIONS={

render(){

const root=document.getElementById("tc-content");
if(!root) return;

let html="<h2>🎯 Görevler</h2>";

MISSIONS_LIST.forEach(m=>{

html+=`
<div class="card">
<b>${m.name}</b><br>
Enerji: ${m.energy}<br>
XP: ${m.xp}<br>
Kazanç: ${m.reward} Yton<br>
Risk: %${m.risk}

<button onclick="MISSIONS.start(${m.id})">
Başlat
</button>
</div>
`;

});

root.innerHTML=html;
},

/* ================= START ================= */

async start(id){

const mission=MISSIONS_LIST.find(x=>x.id===id);
if(!mission) return;

const user=GAME.user;

if(user.energy<mission.energy){
EVENT.emit("notify","⚡ Enerji yetersiz");
return;
}

/* energy düş */
user.energy-=mission.energy;

/* risk */
const success=Math.random()*100>mission.risk;

if(success){

user.xp+=mission.xp;
user.yton+=mission.reward;

/* level up */
if(user.xp>=CONFIG.XP_LIMIT){
user.xp-=CONFIG.XP_LIMIT;
user.level++;
EVENT.emit("notify","⭐ Level Up!");
}

EVENT.emit("mission:completed");
EVENT.emit("notify",
`✅ Başarılı +${mission.reward} Yton`);

}else{

EVENT.emit("notify","❌ Başarısız — Dayak yedin");

if(Math.random()<0.7){
EVENT.emit("player:hospitalized");
}

}

/* save */
await db.from("users").update({
energy:user.energy,
xp:user.xp,
yton:user.yton,
level:user.level
}).eq("id",user.id);

/* refresh */
EVENT.emit("user:update");

}

};

window.MISSIONS=MISSIONS;

/* ================= PAGE HOOK ================= */

EVENT.on("page:enter",(page)=>{
if(page==="missions"){
MISSIONS.render();
}
});

/* ================= REGISTER ================= */

if(window.CORE){
CORE.register("Missions Engine",()=>!!window.MISSIONS);
}

})();
