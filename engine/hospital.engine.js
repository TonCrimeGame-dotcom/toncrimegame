/* ===================================================
   TONCRIME HOSPITAL ENGINE
   24h Lock System
   =================================================== */

(function(){

if(!window.db || !window.EVENT){
  console.warn("Hospital engine waiting...");
  return;
}

const HOSPITAL = {

  locked:false,
  remaining:0,

  /* ===========================================
     SEND TO HOSPITAL
  =========================================== */

  async admit(userId){

    const until =
      Date.now() + (24*60*60*1000); // 24 saat

    await db.from("users")
      .update({
        hospital_until:until,
        heat:10
      })
      .eq("id",userId);

    if(userId===GAME.user.id){
      this.locked=true;
      this.remaining=until-Date.now();
      notify("🏥 Hastaneye kaldırıldın (24 Saat)");
    }

    EVENT.emit("hospital:enter",userId);
  },

  /* ===========================================
     CHECK STATUS
  =========================================== */

  async check(){

    if(!GAME.user) return;

    const {data}=await db
      .from("users")
      .select("hospital_until")
      .eq("id",GAME.user.id)
      .single();

    if(!data) return;

    const now=Date.now();

    if(data.hospital_until>now){

      this.locked=true;
      this.remaining=data.hospital_until-now;

      EVENT.emit("hospital:locked",this.remaining);

    }else{

      this.locked=false;
      EVENT.emit("hospital:free");
    }
  },

  /* ===========================================
     BLOCK ACTIONS
  =========================================== */

  canPlay(){

    if(this.locked){
      notify("🏥 Hastanedesin!");
      return false;
    }

    return true;
  },

  /* ===========================================
     TIMER LOOP
  =========================================== */

  tick(){

    if(!this.locked) return;

    this.remaining-=1000;

    EVENT.emit("hospital:timer",this.remaining);

    if(this.remaining<=0){
      this.locked=false;
      notify("✅ Hastaneden çıktın");
    }
  }

};

window.HOSPITAL=HOSPITAL;


/* ===========================================
   POLICE RAID LINK
=========================================== */

EVENT.on("police:raid",(data)=>{

  if(data.target===GAME.user.id){
    HOSPITAL.admit(GAME.user.id);
  }

});


/* ===========================================
   AUTO START
=========================================== */

setTimeout(()=>{
  HOSPITAL.check();
},2000);

setInterval(()=>{
  HOSPITAL.tick();
},1000);

console.log("🏥 Hospital Engine Ready");

})();
