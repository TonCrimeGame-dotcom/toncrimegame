/* ===================================================
   TONCRIME ACHIEVEMENT ENGINE
   Progression + Badge System
   =================================================== */

(function(){

/* ===================================================
   ACHIEVEMENT LIST
   =================================================== */

const ACHIEVEMENTS = {

  FIRST_WIN:{
    name:"İlk Kan",
    desc:"İlk PvP zaferi"
  },

  PVP_10:{
    name:"Sokak Dövüşçüsü",
    desc:"10 PvP kazandın"
  },

  RICH_100:{
    name:"Para Konuşur",
    desc:"100 YTON'a ulaştın"
  },

  STREAK_3:{
    name:"Bağımlı",
    desc:"3 gün üst üste giriş"
  },

  LEVEL_10:{
    name:"Yükselen Güç",
    desc:"Level 10 oldun"
  },

  NO_SLEEP:{
    name:"Uyku Yok",
    desc:"7 gün streak tamamlandı"
  }

};


/* ===================================================
   CHECK EXIST
   =================================================== */

async function hasAchievement(userId,code){

  const { data } = await db
    .from("user_achievements")
    .select("id")
    .eq("user_id",userId)
    .eq("code",code)
    .maybeSingle();

  return !!data;
}


/* ===================================================
   UNLOCK
   =================================================== */

async function unlock(userId,code){

  if(await hasAchievement(userId,code))
    return;

  await db.from("user_achievements")
    .insert({
      user_id:userId,
      code
    });

  const a = ACHIEVEMENTS[code];

  Notify.show(
    `🏅 ${a.name}<br>${a.desc}`,
    "#f1c40f",
    4500
  );

  EVENT.emit("achievement:unlock",{code});
}


/* ===================================================
   CHECK RULES
   =================================================== */

async function check(user){

  if(!user) return;

  /* FIRST WIN */
  if(user.wins>=1)
    unlock(user.id,"FIRST_WIN");

  /* 10 PvP */
  if(user.wins>=10)
    unlock(user.id,"PVP_10");

  /* Rich */
  if(Number(user.yton)>=100)
    unlock(user.id,"RICH_100");

  /* Level */
  if(user.level>=10)
    unlock(user.id,"LEVEL_10");

  /* streak */
  if(user.daily_streak>=3)
    unlock(user.id,"STREAK_3");

  if(user.daily_streak>=7)
    unlock(user.id,"NO_SLEEP");
}


/* ===================================================
   AUTO CHECK EVENTS
   =================================================== */

EVENT.on("reward:given",()=>check(GAME.user));
EVENT.on("daily:claimed",()=>check(GAME.user));
EVENT.on("elo:updated",()=>check(GAME.user));

console.log("🏅 Achievement Engine Ready");

})();
