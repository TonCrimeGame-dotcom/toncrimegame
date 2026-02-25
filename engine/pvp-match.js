/* ===== PvP MATCHMAKING ===== */

let matchChannel = null;

async function findMatch(){

  const user = await loadUser();
  if(!user) return;

  // Kuyruğa gir
  await db.from("pvp_queue").insert({
    user_id: user.id,
    rank: user.pvp_rank,
    level: user.level,
    status: "waiting"
  });

  listenForMatch(user);
}

function listenForMatch(user){

  matchChannel = db
  .channel("pvp_queue_channel")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "pvp_queue"
    },
    async (payload) => {

      if(payload.new.user_id === user.id) return;

      const opponent = payload.new;

      const rankDiff = Math.abs(opponent.rank - user.pvp_rank);

      if(rankDiff <= 200){

        // Eşleşme
        await db.from("pvp_queue")
        .update({status:"matched"})
        .eq("user_id", user.id);

        await db.from("pvp_queue")
        .update({status:"matched"})
        .eq("user_id", opponent.user_id);

        startPvpBattle(user, opponent);
      }
    }
  )
  .subscribe();
}

function startPvpBattle(user, opponent){

  alert("Rakip bulundu: " + opponent.user_id);

  // Örnek PvP sonucu (şimdilik random)
  const win = Math.random() > 0.5;

  processPvpResult(opponent.rank, win);

  db.from("pvp_queue")
  .delete()
  .eq("user_id", user.id);

  db.from("pvp_queue")
  .delete()
  .eq("user_id", opponent.user_id);
}
