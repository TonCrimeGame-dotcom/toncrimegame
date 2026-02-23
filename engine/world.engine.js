/* ===================================================
   TONCRIME WORLD INSTANCE ENGINE
   Building Presence + Live Rooms
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("World engine waiting EVENT...");
  return;
}

/* ===========================================
   ENGINE
=========================================== */

const WORLD = {

  current:null,
  players:{},

  /* ===================================== */
  enter(building){

    if(this.current===building) return;

    this.leave();

    this.current=building;
    this.players={};

    console.log("🌍 Entered:",building);

    EVENT.emit("world:entered",building);

    this.mockPresence(); // realtime sim (later supabase realtime)
  },

  /* ===================================== */
  leave(){

    if(!this.current) return;

    EVENT.emit("world:left",this.current);

    this.current=null;
    this.players={};
  },

  /* ===================================== */
  ADD PLAYER
  ===================================== */

  joinPlayer(player){

    this.players[player.id]=player;

    EVENT.emit("world:playerJoin",player);
    this.updateUI();
  },

  /* ===================================== */
  REMOVE PLAYER
  ===================================== */

  leavePlayer(id){

    const p=this.players[id];
    delete this.players[id];

    EVENT.emit("world:playerLeave",p);
    this.updateUI();
  },

  /* ===================================== */
  UI UPDATE
  ===================================== */

  updateUI(){

    if(!window.UI) return;

    UI.updateWorldPlayers(
      Object.values(this.players)
    );
  },

  /* ===================================== */
  MOCK REALTIME (TEMP)
  ===================================== */

  mockPresence(){

    /* demo simulation */
    setTimeout(()=>{
      this.joinPlayer({
        id:"AI_"+Math.floor(Math.random()*999),
        nickname:"Shadow"+Math.floor(Math.random()*99),
        level:Math.floor(Math.random()*50)
      });
    },2000);
  }

};

window.WORLD = WORLD;

/* ===========================================
   EVENTS
=========================================== */

EVENT.on("page:enterBuilding",(b)=>{
  WORLD.enter(b);
});

EVENT.on("page:leaveBuilding",()=>{
  WORLD.leave();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "World Engine",
    ()=>!!window.WORLD
  );
}

console.log("🌍 World Engine Loaded");

})();
