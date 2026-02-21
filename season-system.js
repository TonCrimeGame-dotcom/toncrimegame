/* ===== PvP SEASON SYSTEM ===== */

async function checkSeasonReset(){

  const now = new Date();
  const currentMonth = now.getFullYear() + "-" + (now.getMonth()+1);

  const {data:seasonData} = await db
    .from("season_history")
    .select("season_month")
    .order("created_at",{ascending:false})
    .limit(1);

  let lastSeason = seasonData?.[0]?.season_month;

  if(lastSeason === currentMonth){
    return;
  }

  console.log("Yeni sezon başlıyor...");

  const {data:topPlayers} = await db
    .from("users")
    .select("id,nickname,pvp_rank")
    .order("pvp_rank",{ascending:false})
    .limit(10);

  if(topPlayers && topPlayers.length > 0){

    const winner = topPlayers[0];

    await db.from("season_history").insert({
      season_month: currentMonth,
      winner: winner.nickname,
      winner_rank: winner.pvp_rank
    });

    for(let i=0;i<topPlayers.length;i++){

      let reward = 0;

      if(i===0) reward=1000;
      else if(i<3) reward=500;
      else reward=200;

      await db.from("users").update({
        yton: topPlayers[i].pvp_rank + reward
      }).eq("id", topPlayers[i].id);
    }
  }

  await db.from("users").update({
    pvp_rank:1000,
    pvp_wins:0,
    pvp_losses:0
  });

  console.log("Sezon reset tamamlandı");
}
