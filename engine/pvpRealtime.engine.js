/* ===================================================
   TONCRIME PvP REALTIME ENGINE
=================================================== */

GAME.realtime = {
  searching:false,
  currentMatch:null
};

/* ================= FIND OR CREATE MATCH ================= */

async function queuePvP(entryFee){

  secureAction();

  if(GAME.realtime.searching) return;

  GAME.realtime.searching = true;

  /* ücret düş */
  const paid = await spendYton(entryFee);
  if(!paid){
    console.log("Not enough YTON");
    GAME.realtime.searching=false;
    return;
  }

  /* uygun match ara */
  const { data:waiting } = await db
    .from("pvp_matches")
    .select("*")
    .eq("status","waiting")
    .limit(1);

  /* varsa bağlan */
  if(waiting.length>0){

    const match = waiting[0];

    await db.from("pvp_matches")
      .update({
        player2: CONFIG.USER_ID,
        status:"active",
        started_at:new Date()
      })
      .eq("id",match.id);

    GAME.realtime.currentMatch = match.id;
    startPvP(match.id);

    GAME.realtime.searching=false;
    return;
  }

  /* yoksa oluştur */
  const { data:newMatch } = await db
    .from("pvp_matches")
    .insert({
      player1: CONFIG.USER_ID,
      status:"waiting",
      entry_fee:entryFee,
      created_at:new Date()
    })
    .select()
    .single();

  GAME.realtime.currentMatch = newMatch.id;

  console.log("Waiting opponent...");
}

/* ================= REALTIME LISTENER ================= */

function subscribeRealtimeMatches(){

  db.channel("pvp-matchmaking")
    .on(
      "postgres_changes",
      {
        event:"UPDATE",
        schema:"public",
        table:"pvp_matches"
      },
      payload => {

        const match = payload.new;

        if(match.player1 !== CONFIG.USER_ID)
          return;

        if(match.status === "active"){

          GAME.realtime.currentMatch = match.id;
          startPvP(match.id);
        }
      }
    )
    .subscribe();
}

/* ================= SOLO MATCH SUPPORT ================= */

async function checkSoloTimeout(){

  const { data } = await db
    .from("pvp_matches")
    .select("*")
    .eq("player1",CONFIG.USER_ID)
    .eq("status","waiting")
    .limit(1);

  if(!data.length) return;

  const match = data[0];

  const waitTime =
    Date.now() -
    new Date(match.created_at).getTime();

  /* 10 saniye sonra solo aç */
  if(waitTime > 10000){

    await db.from("pvp_matches")
      .update({
        status:"solo"
      })
      .eq("id",match.id);

    console.log("Solo PvP opened");
  }
}

/* ================= AUTO LOOP ================= */

setInterval(checkSoloTimeout,5000);
