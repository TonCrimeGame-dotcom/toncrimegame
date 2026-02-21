/* ===================================================
   TONCRIME CLAN ENGINE
   Social System Core
   =================================================== */

(function(){

/* ===================================================
   CREATE CLAN
   =================================================== */

async function createClan(name){

  const user = GAME.user;
  if(!user) return;

  const { data, error } = await db
    .from("clans")
    .insert({
      name:name,
      owner_id:user.id
    })
    .select()
    .single();

  if(error){
    Notify.show("Clan oluşturulamadı","#e74c3c");
    return;
  }

  await db.from("clan_members")
    .insert({
      clan_id:data.id,
      user_id:user.id,
      role:"leader"
    });

  Notify.show("👑 Clan kuruldu!","#2ecc71");

  EVENT.emit("clan:joined",data.id);
}


/* ===================================================
   JOIN CLAN
   =================================================== */

async function joinClan(clanId){

  const user = GAME.user;

  const { error } = await db
    .from("clan_members")
    .insert({
      clan_id:clanId,
      user_id:user.id
    });

  if(error){
    Notify.show("Katılamadın","#e74c3c");
    return;
  }

  Notify.show("👥 Clan'a katıldın","#2ecc71");

  EVENT.emit("clan:joined",clanId);
}


/* ===================================================
   LOAD USER CLAN
   =================================================== */

async function loadMyClan(){

  const user = GAME.user;

  const { data } = await db
    .from("clan_members")
    .select("clan_id,role")
    .eq("user_id",user.id)
    .maybeSingle();

  if(!data) return null;

  GAME.clan=data;

  EVENT.emit("clan:loaded",data);

  return data;
}


/* ===================================================
   CLAN MEMBERS
   =================================================== */

async function getMembers(clanId){

  const { data } = await db
    .from("clan_members")
    .select("*")
    .eq("clan_id",clanId);

  return data||[];
}


/* ===================================================
   CLAN CHAT CHANNEL
   =================================================== */

function subscribeClanChat(clanId){

  db.channel("clan-chat-"+clanId)
    .on("broadcast",{event:"message"},payload=>{

      EVENT.emit("clan:chat",payload.payload);

    })
    .subscribe();
}


/* ===================================================
   SEND CLAN MESSAGE
   =================================================== */

function sendClanMessage(text){

  if(!GAME.clan) return;

  db.channel("clan-chat-"+GAME.clan.clan_id)
    .send({
      type:"broadcast",
      event:"message",
      payload:{
        user:GAME.user.nickname,
        text:text,
        time:Date.now()
      }
    });
}


/* ===================================================
   AUTO LOAD
   =================================================== */

EVENT.on("engine:ready",async()=>{

  const clan = await loadMyClan();

  if(clan)
    subscribeClanChat(clan.clan_id);

});


/* ===================================================
   PUBLIC API
   =================================================== */

window.CLAN={
  create:createClan,
  join:joinClan,
  members:getMembers,
  chat:sendClanMessage
};

console.log("👑 Clan Engine Ready");

})();
