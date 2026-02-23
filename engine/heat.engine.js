/* ===================================================
   TONCRIME HEAT & HOSPITAL ENGINE
   Dynamic Crime Consequence System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Heat engine waiting EVENT...");
  return;
}

/* ===========================================
   CONFIG
=========================================== */

const STORAGE_KEY="tc_heat";

const HOSPITAL_TIME = 24*60*60*1000; // 24 saat
const EXIT_COST = 700;

/* ===========================================
   ENGINE
=========================================== */

const HEAT = {

  data:{},

  /* ===================================== */
  init(){

    this.load();

    EVENT.on("pvp:attack",()=>this.addHeat(4));
    EVENT.on("pvp:win",()=>this.addHeat(2));
    EVENT.on("mission:fail",()=>this.addHeat(3));

    setInterval(()=>this.checkHospital(),5000);

    console.log("🕵️ Heat Engine Ready");
  },

  /* ===================================== */
  load(){

    try{
      this.data=
        JSON.parse(localStorage.getItem(STORAGE_KEY))
        || {};
    }catch{
      this.data={};
    }

    if(!this.data[CONFIG.USER_ID]){
      this.data[CONFIG.USER_ID]={
        heat:0,
        hospitalUntil:0
      };
    }
  },

  save(){
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.data)
    );
  },

  player(){
    return this.data[CONFIG.USER_ID];
  },

  /* ===================================== */
  HEAT SYSTEM
  ===================================== */

  addHeat(v){

    const p=this.player();

    p.heat+=v;

    /* risk roll */
    const risk=Math.min(60,p.heat);

    if(Math.random()*100 < risk){
      this.sendHospital();
    }

    this.save();
    this.updateUI();
  },

  /* ===================================== */
  HOSPITAL
  ===================================== */

  sendHospital(){

    const p=this.player();

    p.hospitalUntil=Date.now()+HOSPITAL_TIME;
    p.heat=0;

    if(GAME.user)
      GAME.user.energy=0;

    EVENT.emit("player:hospitalized");

    NOTIFY.push("🏥 Ağır yaralandın! Hastanedesin.");

    this.save();
  },

  checkHospital(){

    const p=this.player();

    if(!p.hospitalUntil) return;

    if(Date.now()>p.hospitalUntil){

      p.hospitalUntil=0;
      NOTIFY.push("✅ Hastaneden çıktın.");

      EVENT.emit("player:released");

      this.save();
    }
  },

  /* ===================================== */
  PAY EXIT
  ===================================== */

  earlyExit(){

    const p=this.player();

    if(!p.hospitalUntil) return;

    if(GAME.user.yton < EXIT_COST){
      NOTIFY.push("Yetersiz YTON");
      return;
    }

    GAME.user.yton -= EXIT_COST;

    p.hospitalUntil=0;

    EVENT.emit("player:released");

    NOTIFY.push("💊 Özel tedavi ile çıktın.");

    this.save();
  },

  /* ===================================== */
  UI
  ===================================== */

  updateUI(){

    if(!window.UI) return;

    const p=this.player();

    UI.updateHeat({
      heat:p.heat,
      hospital:p.hospitalUntil>Date.now()
    });
  }

};

window.HEAT=HEAT;

/* ===========================================
   START
=========================================== */

EVENT.on("game:ready",()=>{
  HEAT.init();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "Heat Engine",
    ()=>!!window.HEAT
  );
}

})();
