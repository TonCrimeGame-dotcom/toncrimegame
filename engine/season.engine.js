/* ===================================================
   TONCRIME SEASON ENGINE
=================================================== */

GAME.season = {
  durationDays:30,
  checking:false
};

/* ================= GET CURRENT SEASON ================= */

async function getSeason(){

  const { data } = await db
    .from("seasons")
    .select("*")
    .eq("active",true)
    .single();

  return data;
}

/* ================= CREATE NEW SEASON ================= */

async function createSeason(){

  const start = new Date();
  const end = new Date(
    start.getTime() +
    GAME.season.durationDays * 86400000
  );

  await db.from("seasons").insert({
    start_date:start,
    end_date:end,
    active:true
  });

  console.log("New season created");
}

/* ================= SNAPSHOT LEADERBOARD ================= */

async function snapshotLeaderboard(seasonId){

  const { data:players } = await db
    .from("users")
    .select("id,nickname,rank_score,league")
    .order("rank_score",{ascending:false})
    .limit(100);

  for(const p of players){

    await db.from("season_results").insert({
      season_id:seasonId,
      user_id:p.id,
      rank_score:p.rank_score,
      league:p.league
    });

    await grantSeasonBadge(p);
  }
}

/* ================= BADGE REWARD ================= */

async function grantSeasonBadge(player){

  let badge="participant";

  if(player.league==="Diamond")
    badge="diamond";
  else if(player.league==="Master")
    badge="master";

  await db.from("badges").insert({
    user_id:player.id,
    badge,
    created_at:new Date()
  });
}

/* ================= SOFT RESET ================= */

async function softResetRanks(){

  const { data:players } = await db
    .from("users")
    .select("id,rank_score");

  for(const p of players){

    const newScore =
      Math.floor(p.rank_score * 0.75);

    await db.from("users")
      .update({
        rank_score:newScore
      })
      .eq("id",p.id);
  }
}

/* ================= END SEASON ================= */

async function endSeason(season){

  console.log("Season ending...");

  await snapshotLeaderboard(season.id);

  await softResetRanks();

  await db.from("seasons")
    .update({active:false})
    .eq("id",season.id);

  await createSeason();
}

/* ================= CHECK LOOP ================= */

async function seasonCheckLoop(){

  if(GAME.season.checking) return;
  GAME.season.checking=true;

  let season = await getSeason();

  if(!season){
    await createSeason();
    GAME.season.checking=false;
    return;
  }

  const now = Date.now();
  const end = new Date(season.end_date).getTime();

  if(now >= end){
    await endSeason(season);
  }

  GAME.season.checking=false;
}

/* ================= AUTO LOOP ================= */

setInterval(seasonCheckLoop,60000);
