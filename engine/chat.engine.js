/* ===================================================
   TONCRIME CHAT ENGINE
   Persistent Realtime Chat
   =================================================== */

(function(){

let channel=null;
let currentRoom=null;

/* ===============================================
   JOIN ROOM
=============================================== */

window.Chat = {

async join(room){

  currentRoom=room;

  if(channel){
    await channel.unsubscribe();
    channel=null;
  }

  const user=GameState.getUser();
  if(!user) return;

  /* LOAD HISTORY */

  const {data}=await db
    .from("chat_messages")
    .select("*")
    .eq("room",room)
    .order("created_at",{ascending:true})
    .limit(100);

  renderMessages(data||[]);

  /* REALTIME */

  channel=db.channel("chat-"+room)
    .on(
      "postgres_changes",
      {
        event:"INSERT",
        schema:"public",
        table:"chat_messages",
        filter:`room=eq.${room}`
      },
      payload=>{
        addMessage(payload.new);
      }
    )
    .subscribe();

},

/* ===============================================
   SEND MESSAGE
=============================================== */

async send(text){

  if(!text.trim()) return;

  const user=GameState.getUser();
  if(!user) return;

  await db.from("chat_messages").insert({
    room:currentRoom,
    user_id:user.id,
    nickname:user.nickname,
    message:text
  });

}

};


/* ===============================================
   UI RENDER
=============================================== */

function renderMessages(list){

  const box=document.getElementById("chatBox");
  if(!box) return;

  box.innerHTML="";

  list.forEach(addMessage);
}

function addMessage(msg){

  const box=document.getElementById("chatBox");
  if(!box) return;

  const div=document.createElement("div");

  const time=new Date(msg.created_at)
    .toLocaleTimeString([],{
      hour:"2-digit",
      minute:"2-digit"
    });

  div.innerHTML=
    `<span style="color:gold">[${time}]</span>
     <b>${msg.nickname}</b>: ${msg.message}`;

  box.appendChild(div);
  box.scrollTop=box.scrollHeight;
}


/* ===============================================
   AUTO CHAT INPUT
=============================================== */

window.sendChatMessage=function(){

  const input=document.getElementById("chatInput");
  if(!input) return;

  Chat.send(input.value);
  input.value="";
};

})();
