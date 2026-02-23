/* ===================================================
   TONCRIME MASTER ENGINE LOADER
   (TEK BAĞLANTI NOKTASI)
   =================================================== */

(function(){

const ENGINE_LIST = [

/* CORE */
"engine/state.engine.js",
"engine/event.engine.js",
"engine/ui.engine.js",
"engine/loop.engine.js",

/* PLAYER CORE */
"engine/engine.js",
"engine/daily.engine.js",

/* WORLD */
"engine/city.engine.js",
"engine/presence.engine.js",

/* SOCIAL */
"engine/chat.engine.js",
"engine/clan.engine.js",

/* ECONOMY */
"engine/business.engine.js",
"engine/market.engine.js",
"engine/production.engine.js",

/* PVP */
"engine/pvp.match.engine.js",
"engine/pvp.battle.engine.js",
"engine/elo.engine.js",
"engine/reward.engine.js",

/* SYSTEM */
"engine/achievement.engine.js",
"engine/notify.engine.js",
"engine/world.engine.js",

/* WALLET */
"engine/wallet.engine.js"

];

function loadScript(src){

return new Promise(resolve=>{

const s=document.createElement("script");
s.src=src;
s.onload=resolve;
document.body.appendChild(s);

});

}

async function boot(){

for(const file of ENGINE_LIST){
console.log("⚙ Loading:",file);
await loadScript(file);
}

console.log("🔥 ALL ENGINES LOADED");

EVENT.emit("game:ready");

}

document.addEventListener("DOMContentLoaded",boot);

})();
