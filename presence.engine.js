/* ===================================================
   TONCRIME PRESENCE ENGINE
=================================================== */

GAME.presence = {
  heartbeat:null,
  subscribed:false
};

const PRESENCE_INTERVAL = 30000; //30s
const OFFLINE_LIMIT = 120000; //2min

/* ===================================================
   SET ONLINE
=================================================== */

async function setOnline(location="city"){

  if(!GAME.user) return;

  await db.from("player_presence")
    .upsert({
      user_id:GAME.user.id,
      nickname:GAME.user.nickname,
      location:location,
      last_seen:new Date(),
      online:true
    });

}

/* ===================================================
   HEARTBEAT
=================================================== */

async function heartbeat(){

  if(!GAME.user) return;

  await db.from("player_presence")
    .update({
      last_seen:new Date(),
      online:true
    })
    .eq("user_id",GAME.user.id);
}

/* ===================================================
   AUTO OFFLINE CLEAN
=================================================== */

async function cleanupOffline(){

  const limit =
    new Date(Date.now()-OFFLINE_LIMIT);

  await db.from("player_presence")
    .update({online:false})
    .lt("last_seen",limit);
}

/* ===================================================
   ONLINE COUNT
=================================================== */

async function updateOnlineCount(){

  const { count } = await db
    .from("player_presence")
    .select("*",{count:"exact",head:true})
    .eq("online",true);

  const el=document.getElementById("onlineCount");
  if(el) el.innerText = count+" online";
}

/* ===================================================
   REALTIME SUBSCRIBE
=================================================== */

function subscribePresence(){

  if(GAME.presence.subscribed) return;

  GAME.presence.subscribed=true;

  db.channel("presence-live")
    .on(
      "postgres_changes",
      {
        event:"UPDATE",
        schema:"public",
        table:"player_presence"
      },
      ()=>{
        updateOnlineCount();
      }
    )
    .subscribe();
}

/* ===================================================
   LOCATION CHANGE
=================================================== */

async function updateLocation(loc){

  if(!GAME.user) return;

  await db.from("player_presence")
    .update({location:loc})
    .eq("user_id",GAME.user.id);
}

/* ===================================================
   INIT
=================================================== */

async function initPresence(){

  if(!GAME.user) return;

  await setOnline("city");

  GAME.presence.heartbeat =
    setInterval(heartbeat,PRESENCE_INTERVAL);

  setInterval(cleanupOffline,60000);

  subscribePresence();

  updateOnlineCount();

  console.log("Presence Engine Ready");
}

document.addEventListener(
  "DOMContentLoaded",
  ()=>{
    setTimeout(initPresence,2000);
  }
);
