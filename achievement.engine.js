/* ===================================================
   TONCRIME ACHIEVEMENT ENGINE
=================================================== */

GAME.achievement = {
  loaded:false,
  list:[]
};

/* ================= DEFINITIONS ================= */

const ACHIEVEMENTS = [

  {
    id:"first_win",
    name:"İlk Kan",
    check:u => (u.wins||0) >= 1,
    reward:1
  },

  {
    id:"pvp_10",
    name:"Sokak Dövüşçüsü",
    check:u => (u.wins||0) >= 10,
    reward:3
  },

  {
    id:"trader_1000",
    name:"Tüccar",
    check:u => (u.total_trade||0) >= 1000,
    reward:5
  },

  {
    id:"first_business",
    name:"Girişimci",
    check:u => u.has_business === true,
    reward:3
  },

  {
    id:"daily_7",
    name:"Sadık Oyuncu",
    check:u => (u.daily_streak||0) >= 7,
    reward:2
  }

];

/* ================= LOAD PLAYER ACHIEVEMENTS ================= */

async function loadAchievements(){

  const { data } = await db
    .from("player_achievements")
    .select("achievement_id")
    .eq("user_id",CONFIG.USER_ID);

  GAME.achievement.list =
    data.map(a=>a.achievement_id);

  GAME.achievement.loaded=true;
}

/* ================= UNLOCK ================= */

async function unlockAchievement(def){

  if(GAME.achievement.list.includes(def.id))
    return;

  await db.from("player_achievements")
    .insert({
      user_id:CONFIG.USER_ID,
      achievement_id:def.id,
      unlocked_at:new Date()
    });

  GAME.achievement.list.push(def.id);

  /* küçük ödül */
  await addYton(def.reward);

  console.log("Achievement unlocked:",def.name);
}

/* ================= CHECK SYSTEM ================= */

async function checkAchievements(){

  if(!GAME.achievement.loaded)
    await loadAchievements();

  const user = GAME.user;
  if(!user) return;

  for(const a of ACHIEVEMENTS){

    if(GAME.achievement.list.includes(a.id))
      continue;

    if(a.check(user)){
      await unlockAchievement(a);
    }
  }
}

/* ================= LOOP ================= */

setInterval(checkAchievements,15000);
