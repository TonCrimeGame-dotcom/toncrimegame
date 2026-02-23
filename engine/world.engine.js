/* ===================================================
   TONCRIME WORLD ENGINE
   Realtime Player Presence System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("World waiting EVENT...");
  return;
}

const WORLD={

channel:null,
location:null,
players:{},

/* ===========================================
   INIT
=========================================== */

init(){

  console.log("🌍 World Engine Ready");

  EVENT.on("page:enter",loc=>{
    this.enter(loc);
  });

},

/* ===========================================
   ENTER LOCATION
=========================================== */

async enter(location){

  if(!GAME.user) return;

  this.location=location;

  /* leave old */
  if(this.channel){
    await this.channel.unsubscribe();
  }

  const room="world-"+location;

  this.channel=db.channel(room,{
    config:{
      presence:{key:GAME.user.id}
    }
  });

  /* JOIN */
  this.channel.on(
    "presence",
    {event:"sync"},
    ()=>{
      const state=this.channel.presenceState();
      this.players=state;
      this.renderPlayers();
    }
  );

  this.channel.on(
    "presence",
    {event:"join"},
    ({key,newPresences})=>{

      EVENT.emit(
        "crimefeed:add",
        `👤 ${newPresences[0].nickname} mekana girdi`
      );
    }
  );

  this.channel.on(
    "presence",
    {event:"leave"},
    ({key,leftPresences})=>{

      EVENT.emit(
        "crimefeed:add",
        `🚪 ${leftPresences[0].nickname} mekandan çıktı`
      );
    }
  );

  await this.channel.subscribe();

  await this.channel.track({
    id:GAME.user.id,
    nickname:GAME.user.nickname,
    level:GAME.user.level
  });

},

/* ===========================================
   PLAYER LIST UI
=========================================== */

renderPlayers(){

  const box=document.getElementById("onlinePlayers");
  if(!box) return;

  let html="<h4>Online Oyuncular</h4>";

  Object.values(this.players).forEach(arr=>{
    arr.forEach(p=>{

      if(p.id===GAME.user.id) return;

      html+=`
      <div class="playerRow">
        ${p.nickname}
        <button onclick="PVP_TARGET.attack('${p.id}')">
        ⚔
        </button>
      </div>`;
    });
  });

  box.innerHTML=html;
}

};

window.WORLD=WORLD;

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  WORLD.init();
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

})();
