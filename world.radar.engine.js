/* ===================================================
   TONCRIME WORLD RADAR ENGINE
   Wanted Player Tracker
   =================================================== */

(function(){

if(!window.db || !window.EVENT){
  console.warn("Radar waiting...");
  return;
}

const RADAR = {

  wantedPlayers:{},
  channel:null,

  /* ===========================================
     LOAD ACTIVE BOUNTIES
  =========================================== */

  async load(){

    const {data} = await db
      .from("users")
      .select("id,username,pos_x,pos_y,wanted")
      .eq("wanted",true);

    if(!data) return;

    data.forEach(p=>{
      this.wantedPlayers[p.id]=p;
    });

    EVENT.emit("radar:update",this.wantedPlayers);
  },

  /* ===========================================
     REALTIME TRACK
  =========================================== */

  subscribe(){

    if(this.channel) return;

    this.channel = db.channel("wanted-radar")
      .on(
        "postgres_changes",
        {
          event:"UPDATE",
          schema:"public",
          table:"users"
        },
        payload=>{

          const u = payload.new;

          if(!u.wanted){
            delete this.wantedPlayers[u.id];
          }else{
            this.wantedPlayers[u.id]=u;
          }

          EVENT.emit("radar:update",this.wantedPlayers);
        }
      )
      .subscribe();
  },

  /* ===========================================
     UPDATE MY POSITION
  =========================================== */

  async updatePosition(x,y){

    if(!GAME.user) return;

    await db.from("users")
      .update({
        pos_x:x,
        pos_y:y
      })
      .eq("id",GAME.user.id);
  }

};

window.RADAR = RADAR;


/* ===========================================
   AUTO START
=========================================== */

(async()=>{

  await RADAR.load();
  RADAR.subscribe();

})();

console.log("🧭 Radar Engine Ready");

})();
