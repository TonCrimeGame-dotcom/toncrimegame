/* ===================================================
   TONCRIME SEASON ENGINE
   Weekly + Monthly Live Seasons
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Season waiting EVENT...");
  return;
}

/* ===========================================
   CONFIG
=========================================== */

const STORAGE_KEY="tc_season";

/* ===========================================
   ENGINE
=========================================== */

const SEASON={

data:null,

/* =========================================== */

init(){

  this.load();
  this.checkReset();
  this.bindEvents();

  console.log("🏁 Season Engine Ready");
},

/* =========================================== */

load(){

  const saved=
    localStorage.getItem(STORAGE_KEY);

  if(saved){
    this.data=JSON.parse(saved);
    return;
  }

  this.data={
    weeklyStart:Date.now(),
    monthlyStart:Date.now(),
    points:0,
    level:1
  };

  this.save();
},

save(){
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(this.data)
  );
},

/* ===========================================
   ADD POINTS
=========================================== */

add(points){

  this.data.points+=points;

  const needed=this.data.level*100;

  if(this.data.points>=needed){
    this.data.points-=needed;
    this.data.level++;

    EVENT.emit(
      "notify",
      "🏁 Season Level Up!"
    );
  }

  this.save();
},

/* ===========================================
   RESET CONTROL
=========================================== */

checkReset(){

  const now=Date.now();

  const WEEK=7*24*60*60*1000;
  const MONTH=30*24*60*60*1000;

  if(now-this.data.weeklyStart>WEEK){
    this.weeklyReset();
  }

  if(now-this.data.monthlyStart>MONTH){
    this.monthlyReset();
  }
},

weeklyReset(){

  EVENT.emit(
    "crimefeed:add",
    "🏁 Haftalık lig sıfırlandı"
  );

  this.data.weeklyStart=Date.now();
  this.save();
},

monthlyReset(){

  EVENT.emit(
    "crimefeed:add",
    "👑 Yeni sezon başladı!"
  );

  this.data.monthlyStart=Date.now();
  this.data.level=1;
  this.data.points=0;

  this.save();
},

/* ===========================================
   EVENTS
=========================================== */

bindEvents(){

  EVENT.on("pvp:win",()=>{
    this.add(20);
  });

  EVENT.on("mission:completed",()=>{
    this.add(5);
  });

  EVENT.on("daily:claimed",()=>{
    this.add(10);
  });

}

};

window.SEASON=SEASON;

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  SEASON.init();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "Season Engine",
    ()=>!!window.SEASON
  );
}

})();
