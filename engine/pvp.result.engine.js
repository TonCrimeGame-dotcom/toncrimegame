/* ===================================================
   TONCRIME PVP RESULT ENGINE
   Winner + Reward + Rank Screen
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Result engine waiting...");
  return;
}

const PVP_RESULT = {

  /* ======================================
     CALCULATE SCORE
  ====================================== */

  calculate(results){

    let totalTime = 0;
    let correct = 0;

    results.forEach(r=>{
      if(r.correct){
        correct++;
        totalTime += r.final_time;
      }else{
        totalTime += 15000; // yanlış ceza
      }
    });

    return {
      correct,
      totalTime
    };
  },

  /* ======================================
     DETERMINE WINNER
  ====================================== */

  decide(player,enemy){

    if(player.correct > enemy.correct) return "win";
    if(player.correct < enemy.correct) return "lose";

    if(player.totalTime < enemy.totalTime) return "win";
    if(player.totalTime > enemy.totalTime) return "lose";

    return "draw";
  },

  /* ======================================
     APPLY REWARDS
  ====================================== */

  async reward(result){

    const user = GAME.user;

    let xpGain = 0;
    let ytonGain = 0;

    if(result==="win"){
      xpGain = 60;
      ytonGain = 4;
    }
    else if(result==="lose"){
      xpGain = 20;
      ytonGain = 0;
    }
    else{
      xpGain = 35;
      ytonGain = 2;
    }

    user.xp += xpGain;
    user.yton += ytonGain;

    if(user.xp >= CONFIG.XP_LIMIT){
      user.level++;
      user.xp -= CONFIG.XP_LIMIT;
    }

    await db.from("users")
      .update({
        xp:user.xp,
        yton:user.yton,
        level:user.level
      })
      .eq("id",user.id);

    return {xpGain,ytonGain};
  },

  /* ======================================
     RESULT SCREEN UI
  ====================================== */

  show(result,data,reward){

    const color =
      result==="win" ? "limegreen" :
      result==="lose" ? "red" : "gold";

    TEMPLATE.load(`
      <div class="battleResult">

        <h1 style="color:${color}">
          ${result==="win"?"ZAFER":"lose"===result?"KAYBETTİN":"BERABERE"}
        </h1>

        <div class="resultBox">

          ✅ Doğru: ${data.correct}<br>
          ⏱ Süre: ${(data.totalTime/1000).toFixed(2)} sn

          <hr>

          ⭐ +${reward.xpGain} XP<br>
          💰 +${reward.ytonGain} YTON

        </div>

        <button onclick="SCENE.load('index')">
          Ana Sayfa
        </button>

      </div>
    `);
  },

  /* ======================================
     FINALIZE MATCH
  ====================================== */

  async finalize(playerResults,enemyResults){

    const player = this.calculate(playerResults);
    const enemy = this.calculate(enemyResults);

    const result = this.decide(player,enemy);

    const reward = await this.reward(result);

    this.show(result,player,reward);

    EVENT.emit("pvp:completed",result);
  }

};

window.PVP_RESULT = PVP_RESULT;


/* ======================================
   AUTO LISTENER
====================================== */

EVENT.on("pvp:resolved",(data)=>{

  PVP_RESULT.finalize(
    data.player,
    data.enemy
  );

});

console.log("🏆 PvP Result Engine Ready");

})();
