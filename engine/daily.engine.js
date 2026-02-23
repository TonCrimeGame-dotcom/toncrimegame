/* ===================================================
   TONCRIME DAILY LOGIN ENGINE
   7 Day Streak Reward System
   =================================================== */

(function(){

if(!window.db || !window.GAME){
  console.warn("Daily engine waiting...");
  return;
}

const DAILY = {

BASE_REWARD:5,
STREAK_BONUS:25,
MAX_STREAK:7,

/* ======================================
   CHECK LOGIN REWARD
====================================== */

async check(){

  const user = GAME.user;
  if(!user) return;

  const today = new Date().toISOString().slice(0,10);

  /* already claimed today */
  if(user.last_login_reward === today){
    console.log("🎁 Daily already claimed");
    return;
  }

  let streak = user.login_streak || 0;

  /* yesterday control */
  const yesterday = new Date(Date.now()-86400000)
    .toISOString().slice(0,10);

  if(user.last_login_reward === yesterday){
    streak++;
  }else{
    streak = 1;
  }

  let reward = this.BASE_REWARD;

  /* 7 DAY BONUS */
  if(streak >= this.MAX_STREAK){
    reward += this.STREAK_BONUS;
    streak = 0; // reset cycle
  }

  const newYton = Number(user.yton) + reward;

  await db.from("users")
    .update({
      yton:newYton,
      login_streak:streak,
      last_login_reward:today
    })
    .eq("id",user.id);

  user.yton = newYton;
  user.login_streak = streak;
  user.last_login_reward = today;

  this.notify(reward,streak);
},

/* ======================================
   UI NOTIFY
====================================== */

notify(reward,streak){

  EVENT.emit("notify",{
    title:"Günlük Ödül 🎁",
    text:`+${reward} YTON kazandın!\nSeri: ${streak}/7`
  });

}

};

window.DAILY = DAILY;


/* AUTO RUN AFTER USER LOAD */

EVENT.on("engine:userLoaded",()=>{
  setTimeout(()=>DAILY.check(),1500);
});

console.log("🎁 Daily Login Engine Ready");

})();
