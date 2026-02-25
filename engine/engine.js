/* ===================================================
   AUTO UI SYNC (FIX LOADING SCREEN)
=================================================== */

(function(){

async function waitUserReady(){

  if(!window.GAME || !GAME.user){
    setTimeout(waitUserReady,300);
    return;
  }

  console.log("✅ User Ready → UI Sync");

  if(window.UI){

    try{
      UI.updateStats(GAME.user);
      UI.renderPlayerCard(GAME.user);
    }catch(e){
      console.warn("UI render retry...");
    }

  }

  const stats=document.getElementById("stats");
  if(stats && stats.innerText.includes("Yükleniyor")){
    stats.innerHTML=`
      Lv ${GAME.user.level}
      | XP ${GAME.user.xp}
      | ⚡ ${GAME.user.energy}
      | 💰 ${Number(GAME.user.yton).toFixed(2)}
    `;
  }

}

document.addEventListener("DOMContentLoaded",()=>{
  setTimeout(waitUserReady,500);
});

})();
