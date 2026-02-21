/* ===================================================
   TONCRIME REWARD ENGINE
   Economy + XP + Anti Farm System
   =================================================== */

(function(){

const DAILY_WIN_LIMIT = 50;


/* ===================================================
   DAILY RESET CHECK
   =================================================== */

async function dailyReset(user){

  const today =
    new Date().toISOString().slice(0,10);

  if(user.last_reward_reset === today)
    return user;

  await db.from("users")
    .update({
      daily_pvp_win:0,
      last_reward_reset:today
    })
    .eq("id",user.id);

  user.daily_pvp_win=0;
  user.last_reward_reset=today;

  return user;
}


/* ===================================================
   MATCH REWARD TABLE
   =================================================== */

function getReward(match){

  switch(match.entry_fee){

    case 2.5:
      return {yton:4,xp:40};

    case 6:
      return {yton:10,xp:80};

    case 0:
      return {yton:1,xp:20};

    default:
      return {yton:2,xp:25};
  }
}


/* ===================================================
   PREMIUM BONUS
   =================================================== */

function applyPremium(user,reward){

  if(!user.premium) return reward;

  return {
    yton: reward.yton,
    xp: Math.round(reward.xp*1.3)
  };
}


/* ===================================================
   GIVE REWARD
   =================================================== */

async function rewardWinner(matchId,winnerId){

  const { data:match } = await db
    .from("pvp_matches")
    .select("*")
    .eq("id",matchId)
    .single();

  if(!match || !winnerId) return;

  const { data:user } = await db
    .from("users")
    .select("*")
    .eq("id",winnerId)
    .single();

  if(!user) return;

  await dailyReset(user);

  /* anti farm */
  if(user.daily_pvp_win >= DAILY_WIN_LIMIT){
    console.log("Daily reward limit reached");
    return;
  }

  let reward = getReward(match);

  reward = applyPremium(user,reward);

  const newXp = user.xp + reward.xp;
  const newYton = Number(user.yton) + reward.yton;

  await db.from("users")
    .update({
      xp:newXp,
      yton:newYton,
      daily_pvp_win:user.daily_pvp_win+1
    })
    .eq("id",user.id);

  console.log("💰 Reward given:",reward);

  EVENT.emit("reward:given",{
    userId:user.id,
    reward
  });
}


/* ===================================================
   EVENT LISTENER
   =================================================== */

EVENT.on("pvp:resolved",async payload=>{

  if(!payload || !payload.winner) return;

  await rewardWinner(
    payload.matchId,
    payload.winner
  );

});

console.log("💰 Reward Engine Ready");

})();
