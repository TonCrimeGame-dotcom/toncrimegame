/* ===================================================
   TONCRIME DAILY BONUS ENGINE
   Login Reward + Streak System
   =================================================== */

(function(){

const REWARDS = [
  {yton:1,xp:20},
  {yton:1.5,xp:25},
  {yton:2,xp:35},
  {yton:3,xp:50},
  {yton:5,xp:70},
  {yton:7,xp:90},
  {yton:10,xp:120}
];


/* ===================================================
   TODAY STRING
   =================================================== */

function today(){
  return new Date().toISOString().slice(0,10);
}


/* ===================================================
   CHECK CLAIM
   =================================================== */

async function checkDaily(){

  const user = GAME.user;
  if(!user) return;

  const t = today();

  if(user.last_daily_claim === t)
    return; // bugün almış

  await giveReward(user);
}


/* ===================================================
   GIVE REWARD
   =================================================== */

async function giveReward(user){

  const t = today();

  let streak = user.daily_streak || 0;

  const yesterday =
    new Date(Date.now()-86400000)
      .toISOString().slice(0,10);

  /* streak kontrol */
  if(user.last_daily_claim !== yesterday){
    streak = 0;
  }

  const reward = REWARDS[streak];

  let xp = reward.xp;

  /* premium bonus */
  if(user.premium)
    xp = Math.round(xp*1.3);

  const newData={
    yton:Number(user.yton)+reward.yton,
    xp:user.xp+xp,
    daily_streak:streak+1,
    last_daily_claim:t
  };

  /* 7 gün reset */
  if(newData.daily_streak>=7)
    newData.daily_streak=0;

  await db.from("users")
    .update(newData)
    .eq("id",user.id);

  Object.assign(user,newData);

  EVENT.emit("daily:claimed",{
    reward,
    streak:newData.daily_streak
  });
}


/* ===================================================
   EVENT HOOK
   =================================================== */

EVENT.on("engine:ready",checkDaily);


/* ===================================================
   NOTIFY
   =================================================== */

EVENT.on("daily:claimed",(d)=>{

  Notify.show(
    `🎁 Günlük Ödül<br>
     +${d.reward.yton} YTON<br>
     +${d.reward.xp} XP<br>
     🔥 Streak: ${d.streak}`,
    "#f39c12",
    4000
  );

});

console.log("🎁 Daily Bonus Engine Ready");

})();
