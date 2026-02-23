/* ===================================================
   TONCRIME REWARDED AD ENGINE
   =================================================== */

(function(){

window.REWARDED_AD = {

  watched(){

    console.log("📺 Ad watched");

    if(window.GAME)
      GAME.user.yton += 3;

    if(window.NOTIFY)
      NOTIFY.push("📺 Reklam ödülü +3 YTON");

    /* ===== ACHIEVEMENT ===== */
    if(window.ACHIEVEMENT){
      ACHIEVEMENT.progress("watch_ad");
    }

    if(window.EVENT){
      EVENT.emit("ad:rewarded");
    }
  }

};

console.log("📺 Rewarded Ad Engine Ready");

})();
