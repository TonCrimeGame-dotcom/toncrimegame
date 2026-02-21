/* ===================================================
   TONCRIME TOURNAMENT ENGINE
   Weekly PvP Competition System
   =================================================== */

(function(){

let ACTIVE_TOURNAMENT=null;


/* ===================================================
   LOAD ACTIVE TOURNAMENT
   =================================================== */

async function loadTournament(){

  const { data } = await db
    .from("tournaments")
    .select("*")
    .eq("active",true)
    .maybeSingle();

  if(!data) return;

  ACTIVE_TOURNAMENT=data;

  console.log("🏆 Tournament Active:",data.name);
}


/* ===================================================
   ADD SCORE
   =================================================== */

async function addScore(userId,points){

  if(!ACTIVE_TOURNAMENT) return;

  const tid = ACTIVE_TOURNAMENT.id;

  const { data } = await db
    .from("tournament_scores")
    .select("*")
    .eq("tournament_id",tid)
    .eq("user_id",userId)
    .maybeSingle();

  if(!data){

    await db.from("tournament_scores")
      .insert({
        tournament_id:tid,
        user_id:userId,
        score:points
      });

  }else{

    await db.from("tournament_scores")
      .update({
        score:data.score + points
      })
      .eq("id",data.id);
  }

}


/* ===================================================
   RESULT HOOK
   =================================================== */

EVENT.on("pvp:resolved",async payload=>{

  if(!ACTIVE_TOURNAMENT) return;

  const { data:match } = await db
    .from("pvp_matches")
    .select("*")
    .eq("id",payload.matchId)
    .single();

  if(!match) return;

  if(payload.winner){

    await addScore(payload.winner,10);

    const loser =
      match.player1_id===payload.winner
        ? match.player2_id
        : match.player1_id;

    if(loser)
      await addScore(loser,2);

  }else{
    await addScore(match.player1_id,5);
    await addScore(match.player2_id,5);
  }

});


/* ===================================================
   LEADERBOARD
   =================================================== */

async function getLeaderboard(){

  if(!ACTIVE_TOURNAMENT) return [];

  const { data } = await db
    .from("tournament_scores")
    .select("*")
    .eq("tournament_id",ACTIVE_TOURNAMENT.id)
    .order("score",{ascending:false})
    .limit(10);

  return data||[];
}


/* ===================================================
   WEEKLY RESET CHECK
   =================================================== */

async function weeklyCheck(){

  const today = new Date();

  if(today.getDay()!==1) return; // Monday

  const { data } = await db
    .from("tournaments")
    .select("*")
    .eq("active",true)
    .maybeSingle();

  if(data) return;

  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate()+6);

  await db.from("tournaments")
    .insert({
      name:"Haftalık PvP Turnuvası",
      start_date:start.toISOString().slice(0,10),
      end_date:end.toISOString().slice(0,10),
      active:true
    });

  loadTournament();
}


/* ===================================================
   INIT
   =================================================== */

EVENT.on("engine:ready",async()=>{

  await weeklyCheck();
  await loadTournament();

});


/* ===================================================
   PUBLIC API
   =================================================== */

window.TOURNAMENT={
  leaderboard:getLeaderboard
};

console.log("🏆 Tournament Engine Ready");

})();
