/* ===================================================
   TONCRIME PRESENCE ENGINE
   Realtime Online Player System
   =================================================== */

(function(){

let channel = null;

/* ===============================================
   JOIN PRESENCE
=============================================== */

async function joinPresence(){

  if(channel) return;

  const user = GameState.getUser();
  if(!user) return;

  channel = db.channel("online-global",{
    config:{
      presence:{ key:user.id }
    }
  });

  /* --- TRACK SELF --- */

  channel.on("presence",{event:"sync"},()=>{

    const state = channel.presenceState();
    const count = Object.keys(state).length;

    GameState.setOnline(count);

    EVENT.emit("ONLINE_UPDATED",count);
  });

  /* --- PLAYER JOIN --- */

  channel.on("presence",{event:"join"},({key,newPresences})=>{

    EVENT.emit("PLAYER_JOIN",key);

  });

  /* --- PLAYER LEAVE --- */

  channel.on("presence",{event:"leave"},({key})=>{

    EVENT.emit("PLAYER_LEAVE",key);

  });

  await channel.subscribe(async(status)=>{

    if(status !== "SUBSCRIBED") return;

    await channel.track({
      id:user.id,
      name:user.nickname,
      level:user.level,
      ts:Date.now()
    });

    console.log("🟢 Presence joined");
  });

}


/* ===============================================
   HEARTBEAT (LOOP ENGINE İLE)
=============================================== */

EVENT.on("ONLINE_PULSE",async()=>{

  if(!channel) return;

  const user = GameState.getUser();
  if(!user) return;

  await channel.track({
    id:user.id,
    level:user.level,
    ts:Date.now()
  });

});


/* ===============================================
   AUTO START WHEN USER READY
=============================================== */

STATE.subscribe("user",()=>{

  setTimeout(joinPresence,500);

});


})();
