/* ===================================================
   TONCRIME CLAN ENGINE
=================================================== */

GAME.clan = {
  data:null,
  members:[]
};

/* ===================================================
   CREATE CLAN
=================================================== */

async function createClan(name){

  if(GAME.user.clan_id){
    alert("Zaten bir clandasın");
    return;
  }

  const { data, error } =
    await db.from("clans")
    .insert({
      name:name,
      owner_id:GAME.user.id
    })
    .select()
    .single();

  if(error){
    alert("Clan adı alınmış");
    return;
  }

  await db.from("clan_members").insert({
    clan_id:data.id,
    user_id:GAME.user.id,
    nickname:GAME.user.nickname,
    role:"leader"
  });

  await db.from("users")
    .update({clan_id:data.id})
    .eq("id",GAME.user.id);

  loadClan();
}

/* ===================================================
   JOIN CLAN
=================================================== */

async function joinClan(clanId){

  if(GAME.user.clan_id) return;

  await db.from("clan_members")
    .insert({
      clan_id:clanId,
      user_id:GAME.user.id,
      nickname:GAME.user.nickname
    });

  await db.from("users")
    .update({clan_id:clanId})
    .eq("id",GAME.user.id);

  loadClan();
}

/* ===================================================
   LOAD CLAN
=================================================== */

async function loadClan(){

  if(!GAME.user.clan_id) return;

  const { data:clan } = await db
    .from("clans")
    .select("*")
    .eq("id",GAME.user.clan_id)
    .single();

  GAME.clan.data = clan;

  const { data:members } = await db
    .from("clan_members")
    .select("*")
    .eq("clan_id",clan.id);

  GAME.clan.members = members;

  renderClanPanel();
}

/* ===================================================
   RENDER CLAN UI
=================================================== */

function renderClanPanel(){

  const el=document.getElementById("clanPanel");
  if(!el || !GAME.clan.data) return;

  let html=`
    <h3>${GAME.clan.data.name}</h3>
    Clan Bank: ${GAME.clan.data.bank.toFixed(2)} YTON
    <hr>
  `;

  GAME.clan.members.forEach(m=>{
    html+=`<div>${m.nickname} (${m.role})</div>`;
  });

  el.innerHTML=html;
}

/* ===================================================
   CLAN BANK DEPOSIT
=================================================== */

async function depositClan(amount){

  if(!GAME.clan.data) return;

  const paid = await spendYton(amount);
  if(!paid) return;

  await db.from("clans")
    .update({
      bank:GAME.clan.data.bank + amount
    })
    .eq("id",GAME.clan.data.id);

  loadClan();
}

/* ===================================================
   CLAN SCORE (PVP HOOK)
=================================================== */

async function addClanScore(points){

  if(!GAME.user.clan_id) return;

  await db.rpc("increase_clan_score",{
    cid:GAME.user.clan_id,
    pts:points
  });
}

/* ===================================================
   AUTO LOAD
=================================================== */

document.addEventListener(
  "DOMContentLoaded",
  ()=>setTimeout(loadClan,2000)
);
