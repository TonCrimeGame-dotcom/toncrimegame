/* ===================================================
   TONCRIME PVP TARGET ENGINE
   Player Attack Selector
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("PvP Target waiting EVENT...");
  return;
}

const PVP_TARGET={

target:null,

/* ===========================================
   SELECT TARGET
=========================================== */

select(playerId,nickname){

  this.target={
    id:playerId,
    name:nickname
  };

  EVENT.emit(
    "notify",
    "⚔ Hedef seçildi: "+nickname
  );
},

/* ===========================================
   ATTACK TARGET
=========================================== */

attack(playerId){

  if(!GAME.user) return;

  EVENT.emit("notify","Rakip aranıyor...");

  EVENT.emit("pvp:queue",{
    attacker:GAME.user.id,
    defender:playerId
  });

},

/* ===========================================
   SOLO SEARCH
=========================================== */

search(){

  EVENT.emit("notify","Rakip aranıyor...");
  EVENT.emit("pvp:queue",{
    attacker:GAME.user.id,
    defender:null
  });

}

};

window.PVP_TARGET=PVP_TARGET;

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "PvP Target Engine",
    ()=>!!window.PVP_TARGET
  );
}

})();
