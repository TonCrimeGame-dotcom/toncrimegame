/* ===================================================
   TONCRIME ADDICTION ENGINE
   Usage Fatigue & Dependency System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Addiction engine waiting EVENT...");
  return;
}

/* ===========================================
   CONFIG
=========================================== */

const STORAGE_KEY="tc_addiction";

const ADDICT_BUILDINGS=[
  "coffee_shop",
  "night_club"
];

const LOSS_PER_USE = 0.02;     // %2 düşüş
const RECOVERY_RATE = 0.01;    // dakika başı %1 iyileşme
const MAX_LOSS = 0.60;         // max %60 kayıp

/* ===========================================
   ENGINE
=========================================== */

const ADDICTION={

  data:{},

  /* ===================================== */
  init(){
    this.load();

    setInterval(()=>{
      this.recover();
    },60000);

    console.log("☕ Addiction Engine Ready");
  },

  load(){
    try{
      this.data=
        JSON.parse(localStorage.getItem(STORAGE_KEY))
        || {};
    }catch{
      this.data={};
    }
  },

  save(){
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.data)
    );
  },

  /* ===================================== */
  ENSURE PLAYER
  ===================================== */

  ensure(player,building){

    if(!this.data[player])
      this.data[player]={};

    if(!this.data[player][building]){
      this.data[player][building]={
        loss:0,
        last:Date.now()
      };
    }

    return this.data[player][building];
  },

  /* ===================================== */
  APPLY USAGE
  ===================================== */

  use(building,baseEnergy){

    if(!GAME || !GAME.user) return baseEnergy;
    if(!ADDICT_BUILDINGS.includes(building))
      return baseEnergy;

    const entry=this.ensure(
      GAME.user.id,
      building
    );

    entry.loss += LOSS_PER_USE;

    if(entry.loss>MAX_LOSS)
      entry.loss=MAX_LOSS;

    entry.last=Date.now();

    this.save();

    const multiplier = 1 - entry.loss;

    const finalEnergy =
      Math.max(1,
        Math.floor(baseEnergy*multiplier)
      );

    EVENT.emit("addiction:update",{
      building,
      loss:entry.loss
    });

    return finalEnergy;
  },

  /* ===================================== */
  RECOVERY OVER TIME
  ===================================== */

  recover(){

    const now=Date.now();

    Object.keys(this.data).forEach(player=>{

      Object.keys(this.data[player]).forEach(b=>{

        const entry=this.data[player][b];

        const minutes =
          (now-entry.last)/60000;

        if(minutes<=0) return;

        entry.loss -= minutes*RECOVERY_RATE;

        if(entry.loss<0)
          entry.loss=0;

        entry.last=now;

      });

    });

    this.save();
  },

  /* ===================================== */
  CURRENT MULTIPLIER
  ===================================== */

  multiplier(building){

    if(!GAME || !GAME.user) return 1;

    const entry=this.ensure(
      GAME.user.id,
      building
    );

    return 1-entry.loss;
  }

};

window.ADDICTION=ADDICTION;

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  ADDICTION.init();
});

})();
