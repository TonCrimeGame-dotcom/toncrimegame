/* ===================================================
   TONCRIME ACHIEVEMENT ENGINE v2
   Persistent Achievement System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Achievement waiting EVENT...");
  return;
}

/* ===========================================
   DEFINITIONS
=========================================== */

const ACHIEVEMENTS=[

{
id:"first_pvp",
name:"🥊 First Blood",
reward:10,
check:(data)=>data==="pvp:win"
},

{
id:"missions_50",
name:"🎯 Worker",
reward:20,
check:(data)=>data.missions>=50
},

{
id:"daily_7",
name:"🔥 Loyal",
reward:25,
check:(data)=>data.streak===7
},

{
id:"watch_ad",
name:"📺 Sponsor",
reward:5,
check:(data)=>data==="ad:watched"
},

{
id:"invite_friend",
name:"🤝 Recruiter",
reward:30,
check:(data)=>data==="friend:joined"
}

];

/* ===========================================
   STORAGE
=========================================== */

const STORAGE_KEY="tc_achievements";

/* ===========================================
   ENGINE
=========================================== */

const ACHIEVEMENT={

data:{},

init(){
  this.load();
  this.bind();
  console.log("🏅 Achievement Engine Ready");
},

load(){
  try{
    this.data=
      JSON.parse(localStorage.getItem(STORAGE_KEY))
      || {};
  }catch{
    this.data={};
  }

  if(!this.data[CONFIG.USER_ID])
    this.data[CONFIG.USER_ID]={};
},

save(){
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(this.data)
  );
},

completed(id){
  return this.data[CONFIG.USER_ID][id];
},

unlock(def){

  if(this.completed(def.id)) return;

  this.data[CONFIG.USER_ID][def.id]=true;

  GAME.user.yton+=def.reward;

  EVENT.emit(
    "notify",
    `🏅 ${def.name} +${def.reward} YTON`
  );

  EVENT.emit("user:update",GAME.user);

  EVENT.emit("crimefeed:add",
    `${GAME.user.nickname} başarı kazandı: ${def.name}`
  );

  this.save();
},

/* ===========================================
   EVENT LISTENERS
=========================================== */

bind(){

  EVENT.on("pvp:win",()=>{
    this.check("pvp:win");
  });

  EVENT.on("mission:completed",data=>{
    this.check({missions:data.total});
  });

  EVENT.on("daily:claimed",data=>{
    this.check({streak:data.streak});
  });

  EVENT.on("ad:watched",()=>{
    this.check("ad:watched");
  });

  EVENT.on("friend:joined",()=>{
    this.check("friend:joined");
  });
},

/* ===========================================
   CHECK LOGIC
=========================================== */

check(data){

  ACHIEVEMENTS.forEach(def=>{
    try{
      if(def.check(data))
        this.unlock(def);
    }catch(e){}
  });
}

};

window.ACHIEVEMENT=ACHIEVEMENT;

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  ACHIEVEMENT.init();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "Achievement Engine",
    ()=>!!window.ACHIEVEMENT
  );
}

})();
