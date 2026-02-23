/* ===================================================
   TONCRIME ADMIN / DEBUG ENGINE
   =================================================== */

(function(){

const ADMIN={};

/* ================= PANEL UI ================= */

ADMIN.open=function(){

let panel=document.getElementById("adminPanel");

if(panel){
panel.remove();
return;
}

panel=document.createElement("div");
panel.id="adminPanel";

panel.style=`
position:fixed;
right:10px;
bottom:10px;
width:260px;
background:#111;
border:1px solid #333;
padding:15px;
z-index:9999;
border-radius:10px;
font-size:14px;
`;

panel.innerHTML=`

<b>🛠 ADMIN PANEL</b><br><br>

<button onclick="ADMIN.addEnergy()">+10 Energy</button><br><br>
<button onclick="ADMIN.addXP()">+25 XP</button><br><br>
<button onclick="ADMIN.addYton()">+5 YTON</button><br><br>
<button onclick="ADMIN.levelUp()">Level +1</button><br><br>
<button onclick="ADMIN.simPvP()">Sim PvP Win</button><br><br>
<button onclick="ADMIN.dailyReset()">Daily Reset</button>

`;

document.body.appendChild(panel);
};

/* ================= ACTIONS ================= */

ADMIN.addEnergy=function(){
GAME.user.energy+=10;
UIupdate();
};

ADMIN.addXP=function(){
GAME.user.xp+=25;
UIupdate();
};

ADMIN.addYton=function(){
GAME.user.yton+=5;
UIupdate();
};

ADMIN.levelUp=function(){
GAME.user.level++;
UIupdate();
};

ADMIN.simPvP=function(){
GAME.user.yton+=10;
alert("PvP kazanıldı (test)");
UIupdate();
};

ADMIN.dailyReset=function(){
EVENT.emit("daily:reset");
alert("Daily reset tetiklendi");
};

/* ================= UI REFRESH ================= */

function UIupdate(){

document.getElementById("ui-level").innerText=GAME.user.level;
document.getElementById("ui-xp").innerText=GAME.user.xp;
document.getElementById("ui-energy").innerText=GAME.user.energy;
document.getElementById("ui-yton").innerText=GAME.user.yton;

}

/* ================= HOTKEY ================= */
/* CTRL + SHIFT + A */

document.addEventListener("keydown",e=>{
if(e.ctrlKey && e.shiftKey && e.key==="A"){
ADMIN.open();
}
});

window.ADMIN=ADMIN;

console.log("🛠 Admin Engine Loaded");

})();
