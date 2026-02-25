/* ===================================================
   TONCRIME GLOBAL EVENT ENGINE
=================================================== */

GAME.event = {
  active:null,
  checking:false
};

/* ================= EVENT POOL ================= */

const EVENTS = [

  {
    id:"nightclub_frenzy",
    name:"Gece Kulübü Çılgınlığı",
    type:"economy",
    building:"nightclub",
    incomeMultiplier:1.2
  },

  {
    id:"coffee_discount",
    name:"Coffee İndirimi",
    type:"economy",
    building:"coffee",
    priceMultiplier:0.8
  },

  {
    id:"pvp_fury",
    name:"PvP Fury",
    type:"pvp",
    xpMultiplier:2
  },

  {
    id:"soft_addiction",
    name:"Rahatlatıcı Gün",
    type:"consumption",
    addictionModifier:0.5
  },

  {
    id:"weapon_sale",
    name:"Silah İndirimi",
    type:"economy",
    building:"weapon",
    priceMultiplier:0.85
  }

];

/* ================= LOAD EVENT ================= */

async function loadEvent(){

  const { data } = await db
    .from("global_events")
    .select("*")
    .eq("active",true)
    .single();

  if(!data) return;

  GAME.event.active = data;
}

/* ================= CREATE EVENT ================= */

async function createEvent(){

  const random =
    EVENTS[Math.floor(
      Math.random()*EVENTS.length
    )];

  const end =
    new Date(Date.now()+86400000);

  await db.from("global_events")
    .insert({
      event_id:random.id,
      data:random,
      end_time:end,
      active:true
    });

  console.log("New event:",random.name);
}

/* ================= APPLY MULTIPLIERS ================= */

function getEventMultiplier(type,key,base){

  if(!GAME.event.active) return base;

  const data = GAME.event.active.data;

  if(data.type !== type) return base;

  if(data[key] === undefined)
    return base;

  return base * data[key];
}

/* ================= CHECK LOOP ================= */

async function eventLoop(){

  if(GAME.event.checking) return;
  GAME.event.checking=true;

  const { data:event } = await db
    .from("global_events")
    .select("*")
    .eq("active",true)
    .single();

  if(!event){
    await createEvent();
    GAME.event.checking=false;
    return;
  }

  const now = Date.now();
  const end =
    new Date(event.end_time).getTime();

  if(now >= end){

    await db.from("global_events")
      .update({active:false})
      .eq("id",event.id);

    await createEvent();
  }

  GAME.event.active = event;
  GAME.event.checking=false;
}

/* ================= AUTO START ================= */

setTimeout(loadEvent,2000);
setInterval(eventLoop,60000);
