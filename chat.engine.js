/* ===================================================
   TONCRIME SOCIAL CHAT ENGINE
=================================================== */

GAME.chat = {
  location:null,
  mode:"location", // location | clan
  subscribed:false
};

/* ===================================================
   LOCATION ENTER
=================================================== */

async function enterBuilding(location){

  if(!GAME.user) return;

  GAME.chat.location = location;
  GAME.chat.mode="location";

  await updateLocation(location);

  await sendSystemMessage(
    GAME.user.nickname+" içeri girdi"
  );

  loadRoomUsers();
  loadChatHistory();
}

/* ===================================================
   SAFE AREA (CLAN CHAT)
=================================================== */

async function enterClanChat(){

  GAME.chat.mode="clan";
  GAME.chat.location=null;

  await updateLocation("safe_zone");

  loadClanChat();
}

/* ===================================================
   SEND MESSAGE
=================================================== */

async function sendChat(){

  const input=document.getElementById("chatInput");
  if(!input) return;

  const text=input.value.trim();
  if(!text) return;

  const payload={
    user_id:GAME.user.id,
    nickname:GAME.user.nickname,
    message:text
  };

  if(GAME.chat.mode==="location"){
    payload.location=GAME.chat.location;
  }else{
    payload.clan_id=GAME.user.clan_id;
  }

  await db.from("city_chat").insert(payload);

  input.value="";
}

/* ===================================================
   SYSTEM MESSAGE
=================================================== */

async function sendSystemMessage(msg){

  await db.from("city_chat").insert({
    user_id:"system",
    nickname:"SYSTEM",
    location:GAME.chat.location,
    message:msg,
    system:true
  });
}

/* ===================================================
   LOAD CHAT
=================================================== */

async function loadChatHistory(){

  let query=db
    .from("city_chat")
    .select("*")
    .order("created_at",{ascending:false})
    .limit(30);

  if(GAME.chat.mode==="location"){
    query=query.eq("location",GAME.chat.location);
  }else{
    query=query.eq("clan_id",GAME.user.clan_id);
  }

  const {data}=await query;

  renderChat(data.reverse());
}

/* ===================================================
   RENDER CHAT
=================================================== */

function renderChat(messages){

  const box=document.getElementById("chatBox");
  if(!box) return;

  box.innerHTML="";

  messages.forEach(m=>{

    const color=m.system?"#888":"#fff";

    box.innerHTML+=`
      <div style="color:${color}">
        <b>${m.nickname}:</b> ${m.message}
      </div>`;
  });

  box.scrollTop=box.scrollHeight;
}

/* ===================================================
   LOAD USERS IN BUILDING
=================================================== */

async function loadRoomUsers(){

  if(GAME.chat.mode!=="location") return;

  const {data}=await db
    .from("player_presence")
    .select("user_id,nickname")
    .eq("location",GAME.chat.location)
    .eq("online",true);

  const list=document.getElementById("roomUsers");
  if(!list) return;

  list.innerHTML="";

  data.forEach(u=>{

    if(u.user_id===GAME.user.id) return;

    list.innerHTML+=`
      <div class="roomUser"
           onclick="locationAttack('${u.user_id}')">
        ⚔ ${u.nickname}
      </div>`;
  });
}

/* ===================================================
   LOCATION PVP ATTACK
   (NO WEAPON INFO)
=================================================== */

function locationAttack(targetId){

  startPvpAttack({
    target:targetId,
    hiddenStats:true
  });

}

/* ===================================================
   REALTIME SUBSCRIBE
=================================================== */

function subscribeChat(){

  if(GAME.chat.subscribed) return;

  GAME.chat.subscribed=true;

  db.channel("chat-live")
    .on(
      "postgres_changes",
      {
        event:"INSERT",
        schema:"public",
        table:"city_chat"
      },
      payload=>{
        const msg=payload.new;

        if(
          GAME.chat.mode==="location" &&
          msg.location===GAME.chat.location
        ){
          loadChatHistory();
        }

        if(
          GAME.chat.mode==="clan" &&
          msg.clan_id===GAME.user.clan_id
        ){
          loadChatHistory();
        }
      }
    )
    .subscribe();
}

/* ===================================================
   AUTO INIT
=================================================== */

document.addEventListener(
  "DOMContentLoaded",
  subscribeChat
);
