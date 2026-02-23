/* ===================================================
   TONCRIME CHAT ENGINE v2
   Persistent Building Chat System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Chat engine waiting EVENT...");
  return;
}

/* ===========================================
   STORAGE
=========================================== */

const STORAGE_KEY="tc_chat_history";

/* ===========================================
   ENGINE
=========================================== */

const CHAT={

  rooms:{},
  currentRoom:null,

  /* ===================================== */
  init(){
    this.load();
    this.bindPresence();
    console.log("💬 Chat Engine Ready");
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

  join(room){

    this.currentRoom=room;

    if(!this.rooms[room])
      this.rooms[room]=[];

    EVENT.emit("chat:update",{
      room,
      messages:this.rooms[room]
    });
  },

  /* ===================================== */
  SEND MESSAGE
  ===================================== */

  send(text){

    if(!this.currentRoom) return;
    if(!window.GAME || !GAME.user) return;

    const msg={
      id:"msg_"+Date.now(),
      user:GAME.user.id,
      name:GAME.user.name,
      text:text,
      time:Date.now(),
      type:"message"
    };

    this.rooms[this.currentRoom].push(msg);

    if(this.rooms[this.currentRoom].length>200)
      this.rooms[this.currentRoom].shift();

    this.save();

    EVENT.emit("chat:new",msg);
    EVENT.emit("chat:update",{
      room:this.currentRoom,
      messages:this.rooms[this.currentRoom]
    });
  },

  /* ===================================== */
  SYSTEM MESSAGE
  ===================================== */

  system(room,text){

    if(!this.rooms[room])
      this.rooms[room]=[];

    const msg={
      id:"sys_"+Date.now(),
      text:text,
      time:Date.now(),
      type:"system"
    };

    this.rooms[room].push(msg);

    this.save();

    EVENT.emit("chat:update",{
      room,
      messages:this.rooms[room]
    });
  },

  /* ===================================== */
  PRESENCE HOOK
  ===================================== */

  bindPresence(){

    EVENT.on("presence:enter",(data)=>{

      this.system(
        data.room,
        "🟢 "+data.player.name+" içeri girdi"
      );

      this.join(data.room);
    });

    EVENT.on("presence:leave",(data)=>{

      this.system(
        data.room,
        "🔴 Bir oyuncu ayrıldı"
      );
    });
  },

  /* ===================================== */
  GET HISTORY
  ===================================== */

  history(room){
    return this.rooms[room]||[];
  }

};

window.CHAT=CHAT;

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  CHAT.init();
});

})();
