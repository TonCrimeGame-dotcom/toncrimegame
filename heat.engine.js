/* ===================================================
   TONCRIME HEAT ENGINE
   Police Attention System
   =================================================== */

(function(){

if(!window.db || !window.GAME){
  console.warn("Heat engine waiting...");
  return;
}

const Heat = {

  value:0,
  lastDecay:0,

  /* ===========================================
     LOAD
  =========================================== */

  async load(){

    const user = GAME.user;
    if(!user) return;

    const {data} = await db
      .from("users")
      .select("heat")
      .eq("id",user.id)
      .single();

    this.value = data?.heat || 0;

    this.updateState();
  },

  /* ===========================================
     ADD HEAT
  =========================================== */

  async add(amount){

    const user = GAME.user;
    if(!user) return;

    this.value += amount;
    this.value = Math.min(100,this.value);

    await db.from("users")
      .update({heat:this.value})
      .eq("id",user.id);

    this.updateState();

    if(window.NOTIFY)
      notify("🚨 Heat +" + amount);
  },

  /* ===========================================
     REDUCE HEAT
  =========================================== */

  async reduce(amount){

    const user = GAME.user;
    if(!user) return;

    this.value -= amount;
    this.value = Math.max(0,this.value);

    await db.from("users")
      .update({heat:this.value})
      .eq("id",user.id);

    this.updateState();
  },

  /* ===========================================
     STATE EFFECT
  =========================================== */

  updateState(){

    let level="safe";

    if(this.value>=80) level="wanted";
    else if(this.value>=50) level="danger";
    else if(this.value>=20) level="suspicious";

    GAME.heatLevel = level;

    if(window.EVENT)
      EVENT.emit("heat:update",{
        value:this.value,
        level
      });
  },

  /* ===========================================
     AUTO DECAY
  =========================================== */

  async decay(){

    const now = Date.now();

    if(now - this.lastDecay < 300000) return;

    this.lastDecay = now;

    await this.reduce(2);
  }

};

window.HEAT = Heat;


/* ===========================================
   EVENT LINKS
=========================================== */

/* black market buy */
if(window.EVENT){

  EVENT.on("blackmarket:update",()=>{
    // passive monitor
  });

  EVENT.on("blackmarket:buy",()=>{
    Heat.add(10);
  });

  EVENT.on("pvp:attack",()=>{
    Heat.add(3);
  });

}


/* ===========================================
   LOOP
=========================================== */

setInterval(()=>{
  Heat.decay();
},60000);


/* LOAD */
setTimeout(()=>Heat.load(),2000);

console.log("🚨 Heat Engine Ready");

})();
