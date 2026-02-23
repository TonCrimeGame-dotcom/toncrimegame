/* ===================================================
   TONCRIME ACHIEVEMENT ENGINE
   =================================================== */

(function(){

if(!window.db || !window.EVENT){
  console.warn("Achievement waiting...");
  return;
}

const ACHIEVEMENT = {

today(){ return new Date().toISOString().slice(0,10); },

/* ======================================
   INIT PLAYER ACHIEVEMENTS
====================================== */

async init(){

  const user=GAME.user;
  if(!user) return;

  const {data:defs}=await db
    .from("achievements")
    .select("*");

  for(const a of defs){

    const {data}=await db
      .from("user_achievements")
      .select("*")
      .eq("user_id",user.id)
      .eq("code",a.code)
      .maybeSingle();

    if(!data){
      await db.from("user_achievements").insert({
        user_id:user.id,
        code:a.code
      });
    }
  }

},

/* ======================================
   PROGRESS
====================================== */

async progress(code,amount=1){

  const user=GAME.user;

  const {data}=await db
    .from("user_achievements")
    .select("*")
    .eq("user_id",user.id)
    .eq("code",code)
    .single();

  if(!data || data.completed) return;

  let newProgress=data.progress+amount;

  const {data:def}=await db
    .from("achievements")
    .select("*")
    .eq("code",code)
    .single();

  let completed=false;

  if(newProgress>=def.goal){
    newProgress=def.goal;
    completed=true;
    await this.reward(def);
  }

  await db.from("user_achievements")
    .update({
      progress:newProgress,
      completed
    })
    .eq("id",data.id);
},

/* ======================================
   REWARD
====================================== */

async reward(def){

  const user=GAME.user;

  user.xp+=def.xp_reward;
  user.yton+=def.yton_reward;

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
    title:"🏆 Başarım Açıldı!",
    text:`${def.title}
+${def.xp_reward} XP
+${def.yton_reward} YTON`
  });
}

};

window.ACHIEVEMENT=ACHIEVEMENT;


/* AUTO INIT */

EVENT.on("engine:userLoaded",()=>{
  setTimeout(()=>ACHIEVEMENT.init(),2000);
});

console.log("🏆 Achievement Engine Ready");

})();
