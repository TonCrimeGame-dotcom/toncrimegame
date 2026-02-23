/* ===================================================
   TONCRIME CHAT ENGINE
   Persistent Realtime Chat System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Chat waiting EVENT...");
  return;
}

const CHAT={

channel:null,
room:null,

/* ===========================================
   INIT
=========================================== */

init(){

  EVENT.on("page:enter",room=>{
    this.join(room);
  });

  console.log("💬 Chat Engine Ready");
},

/* ===========================================
   JOIN ROOM
=========================================== */

async join(room){

  if(!GAME.user) return;

  this.room=room;

  if(this.channel)
    await this.channel.unsubscribe();

  this.loadHistory();

  this.channel=db.channel("chat-"+room);

  this.channel.on(
    "postgres_changes",
    {
      event:"INSERT",
      schema:"public",
      table:"chat_messages",
      filter:`room=eq.${room}`
    },
    payload=>{
      this.renderMessage(payload.new);
    }
  );

  await this.channel.subscribe();
},

/* ===========================================
   LOAD HISTORY
=========================================== */

async loadHistory(){

  const {data}=await db
    .from("chat_messages")
    .select("*")
    .eq("room",this.room)
    .order("id",{ascending:false})
    .limit(30);

  const box=document.getElementById("chatMessages");
  if(!box) return;

  box.innerHTML="";

  data.reverse().forEach(m=>{
    this.renderMessage(m);
  });
},

/* ===========================================
   SEND MESSAGE
=========================================== */

async send(){

  const input=document.getElementById("chatInput");
  if(!input) return;

  const msg=input.value.trim();
  if(!msg) return;

  input.value="";

  await db.from("chat_messages").insert({
    room:this.room,
    user_id:GAME.user.id,
    nickname:GAME.user.nickname,
    message:msg
  });
},

/* ===========================================
   RENDER MESSAGE
=========================================== */

renderMessage(m){

  const box=document.getElementById("chatMessages");
  if(!box) return;

  const line=document.createElement("div");

  line.className="chatLine";

  line.innerHTML=
    `<b>${m.nickname}</b>: ${m.message}`;

  box.appendChild(line);
  box.scrollTop=box.scrollHeight;
}

};

window.CHAT=CHAT;

/* ===========================================
   CHAT UI AUTO CREATE
=========================================== */

(function(){

const style=document.createElement("style");

style.innerHTML=`

.chatBox{
background:#111;
border:1px solid #222;
height:260px;
display:flex;
flex-direction:column;
}

#chatMessages{
flex:1;
overflow-y:auto;
padding:8px;
font-size:13px;
}

.chatInput{
display:flex;
}

.chatInput input{
flex:1;
background:#1b1b1b;
border:none;
color:white;
padding:8px;
}

.chatInput button{
background:gold;
border:none;
padding:8px 12px;
cursor:pointer;
}

.chatLine{
margin-bottom:4px;
}

`;

document.head.appendChild(style);

})();

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  CHAT.init();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "Chat Engine",
    ()=>!!window.CHAT
  );
}

})();
