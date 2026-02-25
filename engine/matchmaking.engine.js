/* ===================================================
   MATCHMAKING ENGINE
=================================================== */

async function findMatch() {

  const { data: waiting } = await db
    .from("pvp_matches")
    .select("*")
    .eq("status", "waiting")
    .limit(1);

  if (waiting.length > 0) {

    const match = waiting[0];

    await db.from("pvp_matches")
      .update({
        player2: CONFIG.USER_ID,
        status: "active"
      })
      .eq("id", match.id);

    startBattle(match.id);
    return;
  }

  await db.from("pvp_matches").insert({
    player1: CONFIG.USER_ID,
    status: "waiting",
    created_at: new Date()
  });

  console.log("Waiting for opponent...");
}

async function startBattle(matchId) {
  console.log("Battle started:", matchId);
}
