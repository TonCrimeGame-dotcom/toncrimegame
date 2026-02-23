/* ===================================================
   TONCRIME DAILY BONUS ENGINE
   =================================================== */

(function(){

const DAILY = {

  claim(){

    if(!window.GAME) return;

    let user = GAME.user;

    if(!user.daily)
      user.daily={streak:0,last:0};

    const now = Date.now();
    const day = 86400000;

    if(now - user.daily.last < day){
      NOTIFY.push("Bugün zaten aldın");
      return;
    }

    user.daily.streak++;
    user.daily.last = now;

    let reward = 5;

    if(user.daily.streak >= 7){
      reward = 25;
      user.daily.streak = 0;

      /* ===== ACHIEVEMENT ===== */
      if(window.ACHIEVEMENT){
        ACHIEVEMENT.progress("7day_streak");
      }
    }

    GAME.user.yton += reward;

    NOTIFY.push("🎁 Günlük ödül +" + reward + " YTON");

    if(window.EVENT)
      EVENT.emit("daily:claimed",reward);
  }

};

window.DAILY = DAILY;

console.log("🎁 Daily Engine Ready");

})();
