/* ===================================================
   TONCRIME PVP TARGET ENGINE
   Online Player Attack System
   =================================================== */

(function(){

let onlinePlayers={};

/* ===============================================
   TRACK ONLINE PLAYERS
=============================================== */

EVENT.on("PLAYER_JOIN",(id)=>{
  onlinePlayers[id]=true;
  renderTargets();
});

EVENT.on("PLAYER_LEAVE",(id)=>{
  delete onlinePlayers[id];
  renderTargets();
});

/* ===============================================
   RENDER TARGET LIST
=============================================== */

function renderTargets(){

  const box=document.getElementById("pvpTargets");
  if(!box) return;

  const me=GameState.getUser();
  if(!me) return;

  box.innerHTML="";

  Object.keys(onlinePlayers).forEach(id=>{

    if(id==me.id) return;

    const btn=document.createElement("div");

    btn.style.padding="8px";
    btn.style.margin="6px 0";
    btn.style.background="#1a1f29";
    btn.style.cursor="pointer";
    btn.style.borderRadius="6px";

    btn.innerHTML=`⚔ Oyuncu ${id}`;

    btn.onclick=()=>startPvP(id);

    box.appendChild(btn);
  });
}

/* ===============================================
   CREATE MATCH
=============================================== */

async function startPvP(targetId){

  const me=GameState.getUser();
  if(!me) return;

  UI.toast("Rakip aranıyor...");

  const {data,error}=await db
    .from("pvp_matches")
    .insert({
      player1:me.id,
      player2:targetId,
      status:"waiting"
    })
    .select()
    .single();

  if(error){
    console.error(error);
    UI.toast("PvP başlatılamadı");
    return;
  }

  EVENT.emit("PVP_MATCH_CREATED",data);

  listenMatch(data.id);
}

/* ===============================================
   MATCH LISTENER
=============================================== */

function listenMatch(matchId){

  db.channel("pvp-match-"+matchId)
    .on("postgres_changes",
      {
        event:"UPDATE",
        schema:"public",
        table:"pvp_matches",
        filter:`id=eq.${matchId}`
      },
      payload=>{

        const match=payload.new;

        if(match.status==="active"){
          UI.toast("⚔ PvP Başladı!");
        }

        if(match.status==="finished"){
          EVENT.emit("PVP_FINISHED",match);
        }

      }
    )
    .subscribe();
}

/* ===============================================
   AUTO UI PANEL
=============================================== */

document.addEventListener("DOMContentLoaded",()=>{

  const content=document.getElementById("tc-content");
  if(!content) return;

  const panel=document.createElement("div");
  panel.className="ui-card";
  panel.innerHTML="<h3>⚔ PvP Hedefleri</h3><div id='pvpTargets'></div>";

  content.appendChild(panel);

});

})();
