/* ===================================================
   TONCRIME REALTIME ENGINE
   Supabase Presence + Live Sync
   =================================================== */

(function(){

if(!window.CONFIG || !window.supabase){
  console.warn("Realtime waiting CONFIG...");
  return;
}

const db = window.supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_KEY
);

/* ===========================================
   ENGINE
=========================================== */

const REALTIME = {

  channel:null,
  room:null,

  /* ===================================== */
  async join(room){

    if(this.room===room) return;

    this.leave();

    this.room=room;

    console.log("⚡ Realtime join:",room);

    this.channel = db.channel("room:"+room,{
      config:{
        presence:{ key: CONFIG.USER_ID }
      }
    });

    /* ---------- PRESENCE SYNC ---------- */

    this.channel.on("presence", { event:"sync" },()=>{

      const state=this.channel.presenceState();
      const players=[];

      Object.keys(state).forEach(key=>{
        players.push(state[key][0]);
      });

      EVENT.emit("world:players",players);
    });

    /* ---------- JOIN EVENT ---------- */

    this.channel.on("presence",{event:"join"},({newPresences})=>{
      newPresences.forEach(p=>{
        EVENT.emit("world:playerJoin",p);
      });
    });

    /* ---------- LEAVE EVENT ---------- */

    this.channel.on("presence",{event:"leave"},({leftPresences})=>{
      leftPresences.forEach(p=>{
        EVENT.emit("world:playerLeave",p);
      });
    });

    await this.channel.subscribe(async status=>{

      if(status!=="SUBSCRIBED") return;

      await this.channel.track({
        id:GAME.user.id,
        nickname:GAME.user.nickname,
        level:GAME.user.level
      });

    });

  },

  /* ===================================== */
  leave(){

    if(!this.channel) return;

    db.removeChannel(this.channel);

    this.channel=null;
    this.room=null;
  }

};

window.REALTIME=REALTIME;

/* ===========================================
   WORLD BIND
=========================================== */

EVENT.on("page:enterBuilding",(b)=>{
  REALTIME.join(b);
});

EVENT.on("page:leaveBuilding",()=>{
  REALTIME.leave();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "Realtime Engine",
    ()=>!!window.REALTIME
  );
}

console.log("⚡ Realtime Engine Loaded");

})();
