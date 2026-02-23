/* ===================================================
   TONCRIME DAILY QUEST ENGINE
   =================================================== */

(function(){

if(!window.db || !window.EVENT){
  console.warn("DailyQuest waiting...");
  return;
}

const DAILYQUEST = {

today(){
  return new Date().toISOString().slice(0,10);
},

/* ======================================
   INIT DAILY QUESTS
====================================== */

async init(){

  const user = GAME.user;
  if(!user) return;

  const today=this.today();

  const {data:existing}=await db
    .from("user_daily_quests")
    .select("*")
    .eq("user_id",user.id)
    .eq("quest_date",today);

  if(existing && existing.length>0) return;

  const {data:quests}=await db
    .from("daily_quests")
    .select("*");

  for(const q of quests){
    await db.from("user_daily_quests").insert({
      user_id:user.id,
      quest_code:q.code,
      quest_date:today
    });
  }

  console.log("🎯 Daily quests created");
},

/* ======================================
   PROGRESS UPDATE
====================================== */

async progress(code,amount=1){

  const user=GAME.user;
  const today=this.today();

  const {data}=await db
    .from("user_daily_quests")
    .select("*")
    .eq("user_id",user.id)
    .eq("quest_code",code)
    .eq("quest_date",today)
    .single();

  if(!data || data.completed) return;

  let newProgress=data.progress+amount;

  const {data:quest}=await db
    .from("daily_quests")
    .select("*")
    .eq("code",code)
    .single();

  let completed=false;

  if(newProgress>=quest.goal){
    newProgress=quest.goal;
    completed=true;
    await this.reward(quest);
  }

  await db.from("user_daily_quests")
    .update({
      progress:newProgress,
      completed
    })
    .eq("id",data.id);

  EVENT.emit("dailyquest:update");
},

/* ======================================
   REWARD
====================================== */

async reward(quest){

  const user=GAME.user;

  user.xp+=quest.xp_reward;
  user.yton+=quest.yton_reward;

  if(user.xp>=CONFIG.XP_LIMIT){
    user.level++;
    user.xp-=CONFIG.XP_LIMIT;
  }

  await db.from("users").update({
    xp:user.xp,
    yton:user.yton,
    level:user.level
  }).eq("id",user.id);

  EVENT.emit("notify",{
    title:"Görev Tamamlandı 🎯",
    text:`+${quest.xp_reward} XP / +${quest.yton_reward} YTON`
  });
}

};

window.DAILYQUEST=DAILYQUEST;


/* ======================================
   AUTO INIT
====================================== */

EVENT.on("engine:userLoaded",()=>{
  setTimeout(()=>DAILYQUEST.init(),2000);
});

console.log("🎯 Daily Quest Engine Ready");

})();
