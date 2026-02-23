/* ===================================================
   TONCRIME BUILDING ENGINE
   Presence + Chat + PvP Lobby
   =================================================== */

(function(){

if(!window.db || !window.EVENT){
  console.warn("Building engine waiting...");
  return;
}

const BUILDING = {

  current:null,
  users:[],
  channel:null,

  /* ===========================================
     ENTER BUILDING
  =========================================== */

  async enter(name){

    const user = GAME.user;
    if(!user) return;

    this.current=name;

    await db.from("building_presence")
      .upsert({
        user_id:user.id,
        building:name
      });

    await this.systemMessage(
      `${user.nickname} binaya girdi`
    );

    this.subscribe();
    this.loadUsers();
    this.loadChat();

    EVENT.emit("building:enter",name);
  },

  /* ===========================================
     EXIT BUILDING
  =========================================== */

  async exit(){

    const user=GAME.user;
    if(!user || !this.current) return;

    await this.systemMessage(
      `${user.nickname} binadan çıktı`
    );

    await db.from("building_presence")
      .delete()
      .eq("user_id",user.id);

    this.current=null;

    EVENT.emit("building:exit");
  },

  /* ===========================================
     LOAD USERS
  =========================================== */

  async loadUsers(){

    const {data}=await db
      .from("building_presence")
      .select("*")
      .eq("building",this.current);

    this.users=data||[];

    EVENT.emit("building:users",this.users);
  },

  /* ===========================================
     SEND CHAT
  =========================================== */

  async send(message){

    const user=GAME.user;

    await db.from("building_chat").insert({
      building:this.current,
      user_id:user.id,
      nickname:user.nickname,
      message
    });
  },

  /* ===========================================
     SYSTEM MESSAGE
  =========================================== */

  async systemMessage(msg){

    await db.from("building_chat").insert({
      building:this.current,
      user_id:"system",
      nickname:"SYSTEM",
      message:msg
    });
  },

  /* ===========================================
     LOAD CHAT
  =========================================== */

  async loadChat(){

    const {data}=await db
      .from("building_chat")
      .select("*")
      .eq("building",this.current)
      .order("created_at",{ascending:true})
      .limit(50);

    EVENT.emit("building:chat",data||[]);
  },

  /* ===========================================
     REALTIME
  =========================================== */

  subscribe(){

    if(this.channel) return;

    this.channel=db.channel("building-live")

    .on("postgres_changes",
      {event:"INSERT",schema:"public",table:"building_chat"},
      payload=>{
        if(payload.new.building===this.current)
          EVENT.emit("building:newMessage",payload.new);
      })

    .on("postgres_changes",
      {event:"*",schema:"public",table:"building_presence"},
      ()=>this.loadUsers())

    .subscribe();
  }

};

window.BUILDING=BUILDING;

console.log("🏢 Building Engine Ready");

})();
