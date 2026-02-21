/* ===================================================
   TONCRIME DAILY BONUS ENGINE
=================================================== */

GAME.daily = {
  checking:false
};

/* ================= SERVER DATE ================= */

function todayKey(){

  const d = new Date();

  return (
    d.getUTCFullYear() + "-" +
    (d.getUTCMonth()+1) + "-" +
    d.getUTCDate()
  );
}

/* ================= LOAD DAILY ================= */

async function getDailyData(){

  const { data } = await db
    .from("users")
    .select("last_daily, daily_streak")
    .eq("id", CONFIG.USER_ID)
    .single();

  return data;
}

/* ================= REWARD CALC ================= */

function calculateReward(streak){

  const baseYton = 1;
  const baseXP = 5;

  return {
    yton: baseYton + Math.floor(streak * 0.5),
    xp: baseXP + streak * 2
  };
}

/* ================= CLAIM DAILY ================= */

async function claimDaily(){

  const user = GAME.user;
  if(!user) return;

  const daily = await getDailyData();

  const today = todayKey();

  if(daily.last_daily === today){
    console.log("Daily already claimed");
    return;
  }

  let streak = daily.daily_streak || 0;

  const yesterday =
    new Date(Date.now()-86400000);

  const yKey =
    yesterday.getUTCFullYear()+"-"+
    (yesterday.getUTCMonth()+1)+"-"+
    yesterday.getUTCDate();

  if(daily.last_daily === yKey)
    streak++;
  else
    streak = 1;

  const reward =
    calculateReward(streak);

  /* ödül ver */
  GAME.user.yton += reward.yton;
  GAME.user.xp += reward.xp;

  if(GAME.user.xp >= CONFIG.XP_LIMIT){
    GAME.user.level++;
    GAME.user.xp -= CONFIG.XP_LIMIT;
  }

  await db.from("users")
    .update({
      yton:GAME.user.yton,
      xp:GAME.user.xp,
      level:GAME.user.level,
      daily_streak:streak,
      last_daily:today
    })
    .eq("id",CONFIG.USER_ID);

  console.log(
    "Daily reward:",
    reward,
    "Streak:",streak
  );

  renderStats();
}

/* ================= AUTO CHECK ================= */

async function dailyLoop(){

  if(GAME.daily.checking) return;
  GAME.daily.checking=true;

  await claimDaily();

  GAME.daily.checking=false;
}

/* ================= START ================= */

setTimeout(dailyLoop,4000);
