/* ===================================================
   TONCRIME BUILDING INSTANCE ENGINE
   Room Sharding System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Instance engine waiting EVENT...");
  return;
}

/* ===========================================
   CONFIG
=========================================== */

const MAX_PLAYERS_PER_INSTANCE = 25;
const STORAGE_KEY = "tc_instances";

/* ===========================================
   ENGINE
=========================================== */

const INSTANCE = {

  data:{},

  /* ===================================== */
  init(){
    this.load();
    console.log("🏢 Instance Engine Ready");
  },

  load(){
    try{
      this.data =
        JSON.parse(localStorage.getItem(STORAGE_KEY))
        || {};
    }catch{
      this.data={};
    }
  },

  save(){
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.data)
    );
  },

  /* ===================================== */
  ENTER BUILDING
  ===================================== */

  enter(building){

    if(!window.GAME || !GAME.user) return;

    if(!this.data[building])
      this.data[building]={};

    let chosen=null;
    let lowest=9999;

    /* find best instance */
    Object.keys(this.data[building]).forEach(id=>{

      const count=this.data[building][id].length;

      if(count < MAX_PLAYERS_PER_INSTANCE &&
         count < lowest){

        lowest=count;
        chosen=id;
      }

    });

    /* create new instance */
    if(!chosen){
      chosen="instance_"+Date.now();
      this.data[building][chosen]=[];
    }

    const player={
      id:GAME.user.id,
      name:GAME.user.name
    };

    this.data[building][chosen].push(player);

    this.save();

    const roomName = building+"_"+chosen;

    console.log("➡ Assigned instance:",roomName);

    EVENT.emit("instance:joined",{
      building,
      instance:chosen,
      room:roomName
    });

    /* presence enter */
    EVENT.emit("room:enter",roomName);
  },

  /* ===================================== */
  LEAVE BUILDING
  ===================================== */

  leave(building){

    if(!GAME || !GAME.user) return;

    const instances=this.data[building];
    if(!instances) return;

    Object.keys(instances).forEach(id=>{

      instances[id] =
        instances[id].filter(
          p=>p.id!==GAME.user.id
        );

      if(instances[id].length===0)
        delete instances[id];

    });

    this.save();

    EVENT.emit("room:leave");
  }

};

window.INSTANCE = INSTANCE;

/* ===========================================
   AUTO BIND
=========================================== */

EVENT.on("building:enter",(building)=>{
  INSTANCE.enter(building);
});

EVENT.on("building:leave",(building)=>{
  INSTANCE.leave(building);
});

EVENT.on("game:ready",()=>{
  INSTANCE.init();
});

})();
