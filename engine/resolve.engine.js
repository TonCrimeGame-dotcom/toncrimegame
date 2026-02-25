/* ===================================================
   TONCRIME RESOLVE ENGINE
   SERVER AUTHORITY LOGIC
=================================================== */

GAME.resolve = {
  running:false
};

/* ================= VERIFY HASH ================= */

async function verifyResult(result){

  const expected =
    await createScoreHash(
      JSON.stringify(result.answers)
    );

  return expected === result.hash;
}

/* ================= CALCULATE PERFORMANCE ================= */

function calculatePerformance(result){

  let totalTime = 0;
  let correct = 0;

  result.answers.forEach(a=>{
    totalTime += a.time;
    if(a.correct) correct++;
  });

  return {
    totalTime,
    correct
  };
}

/* ================= DETERMINE WINNER ================= */

function determineWinner(p1,p2){

  if(!p2) return {
    winner:p1.player_id,
    solo:true
  };

  if(p1.correct !== p2.correct){
    return {
      winner:
        p1.correct > p2.correct
        ? p1.player_id
        : p2.player_id
    };
  }

  return {
    winner:
      p1.totalTime < p2.totalTime
      ? p1.player_id
      : p2.player_id
  };
}

/* ================= CREATE HISTORY ================= */

async function createHistory(match,winner,p1,p2){

  const users = await db
    .from("users")
    .select("id,nickname")
    .in("id",[match.player1,match.player2]);

  const map = {};
  users.data.forEach(u=>map[u.id]=u.nickname);

  const build = async(player,enemy)=>{

    if(!player) return;

    await db.from("pvp_history").insert({
      user_id:player.player_id,
      match_id:match.id,
      opponent_name: enemy
        ? map[enemy.player_id]
        : "Solo Run",
      result:
        player.player_id===winner
        ? "win"
        : "lose",
      time_you:player.totalTime,
      time_enemy:enemy?enemy.totalTime:null,
      difference:enemy
        ? enemy.totalTime-player.totalTime
        : 0,
      created_at:new Date()
    });
  };

  await build(p1,p2);
  await build(p2,p1);
}

/* ================= REWARD SYSTEM ================= */

async function giveRewards(match,winner){

  if(!winner) return;

  const prize =
    match.entry_fee * 2;

  await addYton(prize);

  await applyMatchResult({
    playerId:winner,
    opponentScore:1000,
    win:true
  });
}

/* ================= RESOLVE MATCH ================= */

async function resolveMatch(match){

  const { data:results } = await db
    .from("pvp_results")
    .select("*")
    .eq("match_id",match.id);

  if(!results.length) return;

  let p1 = results.find(r=>r.player_id===match.player1);
  let p2 = results.find(r=>r.player_id===match.player2);

  /* solo allow */
  if(match.status==="solo" && p1){

    const valid = await verifyResult(p1);
    if(!valid) return;

    const perf = calculatePerformance(p1);
    Object.assign(p1,perf);

    await createHistory(match,p1.player_id,p1,null);

    await db.from("pvp_matches")
      .update({
        status:"finished",
        winner:p1.player_id,
        resolved_at:new Date()
      })
      .eq("id",match.id);

    return;
  }

  if(!p1 || !p2) return;

  const v1 = await verifyResult(p1);
  const v2 = await verifyResult(p2);

  if(!v1 || !v2){
    console.warn("Hash failed");
    return;
  }

  Object.assign(p1,calculatePerformance(p1));
  Object.assign(p2,calculatePerformance(p2));

  const outcome =
    determineWinner(p1,p2);

  await createHistory(
    match,
    outcome.winner,
    p1,
    p2
  );

  await giveRewards(match,outcome.winner);

  await db.from("pvp_matches")
    .update({
      status:"finished",
      winner:outcome.winner,
      resolved_at:new Date()
    })
    .eq("id",match.id);

  console.log("Match resolved:",match.id);
}

/* ================= RESOLVE LOOP ================= */

async function resolveLoop(){

  if(GAME.resolve.running) return;
  GAME.resolve.running=true;

  const { data:matches } = await db
    .from("pvp_matches")
    .select("*")
    .in("status",["active","solo"]);

  for(const m of matches){
    await resolveMatch(m);
  }

  GAME.resolve.running=false;
}

/* ================= AUTO LOOP ================= */

setInterval(resolveLoop,8000);
