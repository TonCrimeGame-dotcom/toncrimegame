/* ===================================================
   TONCRIME PVP TARGET ENGINE
   Building Duel System
   =================================================== */

(function(){

if(!window.db || !window.EVENT || !window.BUILDING){
  console.warn("PvP Target waiting...");
  return;
}

const PVP_TARGET = {

  channel:null,

  /* ======================================
     SEND REQUEST
  ====================================== */

  async challenge(targetId){

    const user = GAME.user;

    if(targetId === user.id){
      alert("Kendine saldıramazsın");
      return;
    }

    await db.from("pvp_requests").insert({
      from_user:user.id,
      to_user:targetId,
      building:BUILDING.current
    });

    UI.notify("PvP isteği gönderildi ⚔");
  },

  /* ======================================
     ACCEPT REQUEST
  ====================================== */

  async accept(id){

    await db.from("pvp_requests")
      .update({status:"accepted"})
      .eq("id",id);

    EVENT.emit("pvp:start");
  },

  /* ======================================
     DECLINE
  ====================================== */

  async decline(id){

    await db.from("pvp_requests")
      .update({status:"declined"})
      .eq("id",id);
  },

  /* ======================================
     REALTIME LISTENER
  ====================================== */

  subscribe(){

    if(this.channel) return;

    this.channel = db.channel("pvp-request-live")

    .on("postgres_changes",
      {
        event:"INSERT",
        schema:"public",
        table:"pvp_requests"
      },
      payload=>{

        const req=payload.new;

        if(req.to_user===GAME.user.id &&
           req.status==="pending"){

          UI.confirm(
            "PvP meydan okuması!",
            ()=>this.accept(req.id),
            ()=>this.decline(req.id)
          );
        }

      })

    .on("postgres_changes",
      {
        event:"UPDATE",
        schema:"public",
        table:"pvp_requests"
      },
      payload=>{

        const req=payload.new;

        if(req.from_user===GAME.user.id &&
           req.status==="accepted"){

          UI.notify("Rakip kabul etti ⚔");
          EVENT.emit("pvp:start");
        }

      })

    .subscribe();
  }

};

window.PVP_TARGET=PVP_TARGET;


/* AUTO START */

document.addEventListener("DOMContentLoaded",()=>{
  PVP_TARGET.subscribe();
});

console.log("⚔ PvP Target Engine Ready");

})();
