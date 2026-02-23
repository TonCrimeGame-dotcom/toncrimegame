/* ===================================================
   TONCRIME PvP RESULT ENGINE
   Match Resolve + Winner + Rewards + Achievement
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Result engine waiting EVENT...");
  return;
}

const PVP_RESULT = {

  /* ===========================================
     SCORE CALCULATION
  =========================================== */

  calculate(results){

    let totalTime = 0;
    let correct = 0;

    results.forEach(r=>{
      if(r.correct) correct++;
      totalTime += r.time;
    });

    return {
      correct,
      totalTime,
      score : (correct * 1000) - totalTime
    };
  },

  /* ===========================================
     WINNER DETERMINE
  =========================================== */

  determine(playerA, playerB){

    if(playerA.score > playerB.score) return playerA.id;
    if(playerB.score > playerA.score) return playerB.id;

    // tie breaker → faster wins
    if(playerA.totalTime < playerB.totalTime)
      return playerA.id;

    return playerB.id;
  },

  /* ===========================================
     RESOLVE MATCH
  =========================================== */

  async resolve(match){

    if(!match) return;

    console.log("⚔ Resolving PvP Match...");

    const A = this.calculate(match.playerA.results);
    const B = this.calculate(match.playerB.results);

    A.id = match.playerA.id;
    B.id = match.playerB.id;

    const winnerId = this.determine(A,B);

    const result = {
      match_id: match.id,
      winner: winnerId,
      scoreA: A.score,
      scoreB: B.score,
      timeA: A.totalTime,
      timeB: B.totalTime,
      finished_at: Date.now()
    };

    console.log("🏆 Winner:", winnerId);

    /* ===========================================
       EVENT EMIT
    =========================================== */

    EVENT.emit("pvp:finished", result);

    /* ===========================================
       LOCAL PLAYER WIN CHECK
    =========================================== */

    if(window.GAME && GAME.user){

      if(winnerId === GAME.user.id){

        console.log("✅ You won PvP");

        /* ---------- ACHIEVEMENT ---------- */
        if(window.ACHIEVEMENT){
          ACHIEVEMENT.progress("first_pvp");
        }

        /* ---------- REWARD ---------- */
        if(window.REWARD){
          REWARD.give("pvp_win");
        }

        /* ---------- NOTIFY ---------- */
        if(window.NOTIFY){
          NOTIFY.push("🏆 PvP Kazandın!");
        }

      }else{
        console.log("❌ PvP Lost");
      }

    }

    return result;
  }

};


/* ===========================================
   EVENT LISTENER
   (battle engine sonucu gönderir)
=========================================== */

EVENT.on("pvp:resolve", (match)=>{
  PVP_RESULT.resolve(match);
});


window.PVP_RESULT = PVP_RESULT;

console.log("🏆 PvP Result Engine Ready");

})();
