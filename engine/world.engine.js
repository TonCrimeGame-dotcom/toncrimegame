/* ===================================================
   TONCRIME WORLD ENGINE
   Live MMO World Simulation
   =================================================== */

(function(){

let WORLD=null;


/* ===================================================
   LOAD WORLD
=================================================== */

async function loadWorld(){

  const { data } = await db
    .from("world_state")
    .select("*")
    .eq("id",1)
    .single();

  WORLD=data;

  EVENT.emit("world:update",WORLD);

}


/* ===================================================
   UPDATE FIELD
=================================================== */

async function updateField(field,delta){

  if(!WORLD) return;

  WORLD[field]+=delta;

  await db.from("world_state")
    .update({
      [field]:WORLD[field],
      updated_at:new Date()
    })
    .eq("id",1);

}


/* ===================================================
   PLAYER JOIN WORLD
=================================================== */

async function playerJoin(){

  await updateField("online_players",1);

  Notify.show("🌍 Dünyaya giriş yaptın","#3498db",2000);
}


/* ===================================================
   PLAYER LEAVE WORLD
=================================================== */

async function playerLeave(){
  await updateField("online_players",-1);
}


/* ===================================================
   BUILDING ENTER
=================================================== */

async function enterBuilding(type){

  const map={
    nightclub:"nightclub_population",
    coffeeshop:"coffeeshop_population",
    brothel:"brothel_population"
  };

  if(!map[type]) return;

  await updateField(map[type],1);
}


/* ===================================================
   BUILDING EXIT
=================================================== */

async function leaveBuilding(type){

  const map={
    nightclub:"nightclub_population",
    coffeeshop:"coffeeshop_population",
    brothel:"brothel_population"
  };

  if(!map[type]) return;

  await updateField(map[type],-1);
}


/* ===================================================
   REALTIME SYNC
=================================================== */

function subscribeWorld(){

  db.channel("world-live")
    .on("postgres_changes",{
      event:"UPDATE",
      schema:"public",
      table:"world_state"
    },payload=>{

      WORLD=payload.new;
      EVENT.emit("world:update",WORLD);

    })
    .subscribe();

}


/* ===================================================
   WORLD ECONOMY LOOP
   (server üretimi)
=================================================== */

async function economyTick(){

  console.log("🌍 World economy tick");

  EVENT.emit("world:economy");
}


/* ===================================================
   INIT
=================================================== */

EVENT.on("engine:ready",async()=>{

  await loadWorld();
  await playerJoin();
  subscribeWorld();

  /* 5 dk server tick */
  setInterval(economyTick,300000);

});


window.addEventListener("beforeunload",playerLeave);


/* ===================================================
   PUBLIC API
=================================================== */

window.WORLD={
  enter:enterBuilding,
  leave:leaveBuilding,
  state:()=>WORLD
};

console.log("🌍 World Engine Ready");

})();
