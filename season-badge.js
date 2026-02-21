/* ===== SEASON BADGE SYSTEM ===== */

async function injectSeasonBadge(){

  const user = await loadUser();
  if(!user) return;

  const {data:season} = await db
    .from("season_history")
    .select("*")
    .order("created_at",{ascending:false})
    .limit(1);

  if(!season || season.length===0) return;

  const lastSeason = season[0];

  let badge = "";

  if(user.nickname === lastSeason.winner){
    badge = "👑 Sezon Şampiyonu";
  }else{
    const {data:topPlayers} = await db
      .from("users")
      .select("nickname,pvp_rank")
      .order("pvp_rank",{ascending:false})
      .limit(10);

    if(topPlayers){

      const index = topPlayers.findIndex(p=>p.nickname===user.nickname);

      if(index === 1) badge = "🥈 Sezon 2.si";
      if(index === 2) badge = "🥉 Sezon 3.sü";
      if(index > 2 && index < 10) badge = "🎖 Sezon Top 10";
    }
  }

  if(!badge) return;

  const panel = document.getElementById("userinfo");
  if(panel){
    panel.innerHTML += `<br><br><b style="color:gold">${badge}</b>`;
  }
}
