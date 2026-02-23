/* ===================================================
   TONCRIME PRESENCE ENGINE v2
   Building Presence + Online Players System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Presence waiting EVENT...");
  return;
}

/* ===========================================
   STORAGE
=========================================== */

const STORAGE_KEY="tc_presence_rooms";

/* ===========================================
   ENGINE
=========================================== */

const PRESENCE={

  rooms:{},
  currentRoom:null,

  /* ===================================== */
  init(){
    this.load();
    console.log("🌐 Presence Engine Ready");
  },

  /* ===================================== */
  load(){
    try{
      this.rooms=
        JSON.parse(localStorage.getItem(STORAGE_KEY))
        || {};
    }catch{
      this.rooms={};
    }
  },

  save(){
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.rooms)
    );
  },

  /* ===================================== */
  ENTER ROOM
  ===================================== */

  enter(room){

    if(!window.GAME || !GAME.user) return;

    this.leave();

    if(!this.rooms[room])
      this.rooms[room]=[];

    const player={
      id:GAME.user.id,
      name:GAME.user.name,
      time:Date.now()
    };

    this.rooms[room].push(player);
    this.currentRoom=room;

    this.save();

    EVENT.emit("presence:enter",{
      room,
      player
    });

    this.broadcast(room);

  },

  /* ===================================== */
  LEAVE ROOM
  ===================================== */

  leave(){

    if(!this.currentRoom) return;

    const room=this.currentRoom;

    if(!this.rooms[room]) return;

    this.rooms[room]=
      this.rooms[room].filter(
        p=>p.id!==GAME.user.id
      );

    EVENT.emit("presence:leave",{
      room,
      player:GAME.user.id
    });

    this.currentRoom=null;

    this.save();
  },

  /* ===================================== */
  BROADCAST ROOM STATE
  ===================================== */

  broadcast(room){

    EVENT.emit("presence:update",{
      room,
      players:this.rooms[room]||[]
    });

  },

  /* ===================================== */
  GET ONLINE PLAYERS
  ===================================== */

  players(room){
    return this.rooms[room]||[];
  }

};

window.PRESENCE=PRESENCE;

/* ===========================================
   AUTO EVENTS
=========================================== */

EVENT.on("room:enter",(room)=>{
  PRESENCE.enter(room);
});

EVENT.on("room:leave",()=>{
  PRESENCE.leave();
});

EVENT.on("game:ready",()=>{
  PRESENCE.init();
});

/* leave on close */
window.addEventListener("beforeunload",()=>{
  PRESENCE.leave();
});

})();
