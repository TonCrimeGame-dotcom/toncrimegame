/* ===================================================
   TONCRIME CRIME REPUTATION ENGINE
   Player Identity & Crime Fame System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Reputation waiting EVENT...");
  return;
}

/* ===========================================
   STORAGE
=========================================== */

const STORAGE_KEY="tc_reputation";

/* ===========================================
   ENGINE
=========================================== */

const REPUTATION={

  data:{},

  /* ===================================== */
  init(){

    this.load();

    EVENT.on("pvp:win",()=>this.addRep(8));
    EVENT.on("pvp:lose",()=>this.addRep(-3));
    EVENT.on("pvp:attack",()=>this.addFear(2));
    EVENT.on("bounty:add",(b)=>this.addBounty(b.amount));

    console.log("🧬 Reputation Engine Ready");
  },

  /* ===================================== */
  load(){

    try{
      this.data =
        JSON.parse(localStorage.getItem(STORAGE_KEY))
        || {};
    }catch{
      this.data={};
    }

    if(!this.data[CONFIG.USER_ID]){
      this.data[CONFIG.USER_ID]={
        reputation:0,
        fear:0,
        heat:0,
        bounty:0
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
  REP CHANGE
  ===================================== */

  addRep(value){

    const p=this.player();

    p.reputation=Math.max(0,p.reputation+value);

    if(value>0) p.heat+=1;

    this.save();
    this.updateUI();
  },

  addFear(v){

    const p=this.player();
    p.fear+=v;

    this.save();
    this.updateUI();
  },

  addBounty(amount){

    const p=this.player();
    p.bounty+=amount;

    p.reputation+=Math.floor(amount/5);

    this.save();
    this.updateUI();
  },

  /* ===================================== */
  LEVEL TITLE
  ===================================== */

  title(){

    const r=this.player().reputation;

    if(r<20) return "Sokak Çocuğu";
    if(r<50) return "Serseri";
    if(r<120) return "Gang Üyesi";
    if(r<250) return "Yeraltı Figürü";
    if(r<500) return "Suç Lordu";

    return "Şehir Efsanesi";
  },

  /* ===================================== */
  UI
  ===================================== */

  updateUI(){

    if(!window.UI) return;

    UI.updateReputation({
      ...this.player(),
      title:this.title()
    });
  }

};

window.REPUTATION=REPUTATION;

/* ===========================================
   START
=========================================== */

EVENT.on("game:ready",()=>{
  REPUTATION.init();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "Reputation Engine",
    ()=>!!window.REPUTATION
  );
}

})();
