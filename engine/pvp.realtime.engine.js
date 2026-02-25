/* ===================================================
   TONCRIME PVP REALTIME ENGINE
=================================================== */

GAME.realtime = {
  subscribed:false,
  channel:null
};

/* ===================================================
   SUBSCRIBE MATCH UPDATES
=================================================== */

function subscribePvPRealtime(){

  if(GAME.realtime.subscribed) return;

  GAME.realtime.subscribed = true;

  GAME.realtime.channel =
    db.channel("pvp-realtime")

    .on(
      "postgres_changes",
      {
        event:"UPDATE",
        schema:"public",
        table:"pvp_matches"
      },
      payload => {

        const match = payload.new;

        handleRealtimeUpdate(match);
      }
    )

    .subscribe();

  console.log("Realtime PvP subscribed");
}

/* ===================================================
   HANDLE UPDATES
=================================================== */

function handleRealtimeUpdate(match){

  /* match started */
  if(match.status === "active"){
    onMatchStart(match);
  }

  /* opponent finished */
  if(match.status === "resolved"){
    onMatchResolved(match);
  }
}

/* ===================================================
   MATCH START EVENT
=================================================== */

function onMatchStart(match){

  if(GAME.battle.active) return;

  showRealtimeMessage("Rakip bulundu!");

  setTimeout(()=>{
    startBattle(match.id);
  },1000);
}

/* ===================================================
   MATCH RESOLVED
=================================================== */

async function onMatchResolved(match){

  if(match.winner_id === CONFIG.USER_ID){
    showRealtimeMessage("🏆 Kazandın!");
  }else{
    showRealtimeMessage("💀 Kaybettin!");
  }

  await loadUser();
  renderStats();
}

/* ===================================================
   WAITING STATUS UI
=================================================== */

function showSearching(){

  const el=document.getElementById("pvpStatus");
  if(!el) return;

  el.innerHTML="Rakip aranıyor...";
}

function showRealtimeMessage(text){

  const el=document.getElementById("pvpStatus");
  if(!el) return;

  el.innerHTML=text;
}

/* ===================================================
   AUTO INIT
=================================================== */

document.addEventListener(
  "DOMContentLoaded",
  subscribePvPRealtime
);
