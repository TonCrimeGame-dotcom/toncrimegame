/* ===================================================
   TONCRIME PVP CORE
   =================================================== */

const PVP = {
  searching:false,
  activeMatch:null
};

/* ---------- FIND MATCH ---------- */

PVP.findMatch = async function(entryFee){

  if(PVP.searching) return;
  PVP.searching=true;

  const user = GAME.user;
  if(!user) return;

  if(user.yton < entryFee){
    notify("Yetersiz Yton","error");
    PVP.searching=false;
    return;
  }

  await CORE.updatePlayer({yton:-entryFee});

  /* waiting match ara */
  const {data:waiting} = await db
    .from("pvp_matches")
    .select("*")
    .eq("status","waiting")
    .limit(1);

  if(waiting.length>0){

    const match = waiting[0];

    await db.from("pvp_matches")
      .update({
        player2:user.id,
        status:"active",
        started_at:new Date()
      })
      .eq("id",match.id);

    notify("Rakip bulundu ⚔️","success");

  }else{

    await db.from("pvp_matches")
      .insert({
        player1:user.id,
        status:"waiting",
        entry_fee:entryFee
      });

    notify("Rakip aranıyor...","info");
  }

  PVP.searching=false;
};

/* ---------- REALTIME ---------- */

PVP.subscribe = function(){

  if(GAME.pvpSubscribed) return;

  db.channel("pvp-match-live")
  .on("postgres_changes",{
    event:"UPDATE",
    schema:"public",
    table:"pvp_matches"
  },payload=>{

    const m = payload.new;

    if(
      m.player1==CONFIG.USER_ID ||
      m.player2==CONFIG.USER_ID
    ){
      PVP.activeMatch=m;
      notify("PvP başladı!","success");
    }
  })
  .subscribe();
};
