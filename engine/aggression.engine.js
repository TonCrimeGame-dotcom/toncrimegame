/* ===================================================
   TONCRIME SOCIAL AGGRESSION ENGINE
   Building PvP Target System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Aggression waiting EVENT...");
  return;
}

/* ===========================================
   CONFIG
=========================================== */

const ATTACK_COOLDOWN = 120000; // 2 dk

/* ===========================================
   ENGINE
=========================================== */

const AGGRESSION = {

  targets:{},
  cooldowns:{},
  history:[],

  /* ===================================== */
  setPlayers(players){

    this.targets={};

    players.forEach(p=>{
      if(p.id===GAME.user.id) return;

      this.targets[p.id]=p;
    });

    this.updateUI();
  },

  /* ===================================== */
  canAttack(id){

    const last=this.cooldowns[id];
    if(!last) return true;

    return (Date.now()-last)>ATTACK_COOLDOWN;
  },

  /* ===================================== */
  attack(id){

    if(!this.canAttack(id)){
      NOTIFY.push("⏳ Hedef cooldown");
      return;
    }

    const target=this.targets[id];
    if(!target) return;

    this.cooldowns[id]=Date.now();

    const matchId="pvp_"+Date.now();

    EVENT.emit("pvp:createMatch",{
      matchId,
      attacker:GAME.user.id,
      defender:id
    });

    this.history.unshift({
      target:id,
      time:Date.now()
    });

    NOTIFY.push(
      "⚔ "+target.nickname+" oyuncusuna saldırdın!"
    );

  },

  /* ===================================== */
  bounty(targetId,amount){

    EVENT.emit("bounty:add",{
      target:targetId,
      amount
    });

    NOTIFY.push("💰 Ödül koyuldu");
  },

  /* ===================================== */
  updateUI(){

    if(!window.UI) return;

    UI.renderTargets(
      Object.values(this.targets),
      (id)=>this.attack(id)
    );
  }

};

window.AGGRESSION=AGGRESSION;

/* ===========================================
   WORLD EVENTS
=========================================== */

EVENT.on("world:players",(players)=>{
  AGGRESSION.setPlayers(players);
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "Aggression Engine",
    ()=>!!window.AGGRESSION
  );
}

console.log("⚔ Aggression Engine Ready");

})();
