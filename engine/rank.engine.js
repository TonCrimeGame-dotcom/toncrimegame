/* ===================================================
   TONCRIME RANK ENGINE
   ELO + Leaderboard System
   =================================================== */

(function(){

if(!window.EVENT || !window.db){
  console.warn("Rank engine waiting...");
  return;
}

const RANK = {

K:32, // elo hız katsayısı

/* ======================================
   EXPECTED SCORE
====================================== */

expected(a,b){
  return 1/(1+Math.pow(10,(b-a)/400));
},

/* ======================================
   CALCULATE ELO
====================================== */

calc(playerElo,enemyElo,result){

  const expected=this.expected(playerElo,enemyElo);

  let score=0;

  if(result==="win") score=1;
  else if(result==="draw") score=0.5;
  else score=0;

  return Math.round(
    playerElo + this.K*(score-expected)
  );
},

/* ======================================
   APPLY RANK UPDATE
====================================== */

async update(result,enemyElo=1000){

  const user=GAME.user;

  const newElo=this.calc(
    user.elo||1000,
    enemyElo,
    result
  );

  user.elo=newElo;

  await db.from("users")
    .update({elo:newElo})
    .eq("id",user.id);

  await db.from("leaderboard_history")
    .insert({
      user_id:user.id,
      elo:newElo
    });

  EVENT.emit("rank:update",newElo);
},

/* ======================================
   GET TOP PLAYERS
====================================== */

async top(limit=10){

  const {data}=await db
    .from("users")
    .select("nickname,elo")
    .order("elo",{ascending:false})
    .limit(limit);

  return data||[];
}

};

window.RANK=RANK;


/* ======================================
   AUTO HOOK RESULT ENGINE
====================================== */

EVENT.on("pvp:completed",(result)=>{
  RANK.update(result);
});

console.log("🏆 Rank Engine Ready");

})();
