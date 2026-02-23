/* ===================================================
   TONCRIME PLAYER JOURNEY ENGINE
   New Player Retention System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Journey waiting EVENT...");
  return;
}

/* ===========================================
   STORAGE
=========================================== */

const STORAGE_KEY="tc_journey";

/* ===========================================
   JOURNEY STEPS
=========================================== */

const STEPS=[

{ id:"first_login", reward:5 },
{ id:"first_mission", reward:10 },
{ id:"first_pvp", reward:15 },
{ id:"visit_building", reward:8 },
{ id:"first_income", reward:12 },
{ id:"daily_login", reward:10 },
{ id:"join_clan", reward:20 }

];

/* ===========================================
   ENGINE
=========================================== */

const JOURNEY={

  data:{},

  init(){
    this.load();
    this.bindEvents();
    console.log("🧭 Journey Engine Ready");
  },

  load(){
    try{
      this.data=
        JSON.parse(localStorage.getItem(STORAGE_KEY))
        || {};
    }catch{
      this.data={};
    }

    if(!this.data[CONFIG.USER_ID]){
      this.data[CONFIG.USER_ID]={};
    }
  },

  save(){
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.data)
    );
  },

  completed(step){
    return this.data[CONFIG.USER_ID][step];
  },

  complete(step){

    if(this.completed(step)) return;

    const def = STEPS.find(s=>s.id===step);
    if(!def) return;

    this.data[CONFIG.USER_ID][step]=true;

    GAME.user.yton += def.reward;
    GAME.user.xp += 5;

    NOTIFY.push(
      "🎯 Görev tamamlandı +" +
      def.reward + " YTON"
    );

    EVENT.emit("journey:complete",step);

    if(window.CRIMEFEED){
      CRIMEFEED.add(
        `${GAME.user.nickname} yeni bir yolculuk adımı tamamladı`
      );
    }

    this.save();
  },

  /* ===================================== */
  EVENTS
  ===================================== */

  bindEvents(){

    EVENT.on("game:ready",()=>{
      this.complete("first_login");
    });

    EVENT.on("mission:completed",()=>{
      this.complete("first_mission");
    });

    EVENT.on("pvp:win",()=>{
      this.complete("first_pvp");
    });

    EVENT.on("page:enterBuilding",()=>{
      this.complete("visit_building");
    });

    EVENT.on("wallet:deposit",()=>{
      this.complete("first_income");
    });

    EVENT.on("daily:claimed",()=>{
      this.complete("daily_login");
    });

    EVENT.on("clan:joined",()=>{
      this.complete("join_clan");
    });

  }

};

window.JOURNEY=JOURNEY;

/* ===========================================
   START
=========================================== */

EVENT.on("game:ready",()=>{
  JOURNEY.init();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "Journey Engine",
    ()=>!!window.JOURNEY
  );
}

})();
