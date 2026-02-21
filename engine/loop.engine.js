/* ===================================================
   TONCRIME GAME LOOP ENGINE
=================================================== */

(function(){

const LOOP_INTERVAL = 60000; // 60 saniye

async function gameLoop(){

  /* ENERGY REGEN */
  if(window.ENGINE && ENGINE.regenEnergy){
    ENGINE.regenEnergy();
  }

  /* DAILY BUSINESS PRODUCTION */
  if(window.BUSINESS && BUSINESS.produceDaily){
    BUSINESS.produceDaily();
  }

  /* UI UPDATE */
  if(window.UI && window.GAME && GAME.user){
    UI.updateStats(GAME.user);
    UI.renderPlayerCard(GAME.user);
  }

}

/* START LOOP */
setInterval(gameLoop, LOOP_INTERVAL);

console.log("🔄 Game Loop Started");

})();
