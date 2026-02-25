/* ===================================================
   TONCRIME BOUNTY ENGINE
   Wanted Player System
   =================================================== */

(function(){

if(!window.db || !window.GAME){
  console.warn("Bounty waiting...");
  return;
}

const BOUNTY = {

  /* ===========================================
     CHECK HEAT
  =========================================== */

  async check(userId,heat){

    if(heat < 80) return;

    const {data:existing} = await db
      .from("bounties")
      .select("*")
      .eq("target_id",userId)
      .eq("status","active")
      .single();

    if(existing) return;

    this.create(userId,heat);
  },

  /* ===========================================
     CREATE BOUNTY
  =========================================== */

  async create(userId,heat){

    const reward = Math.floor(heat * 50);

    await db.from("bounties").insert({
      target_id:userId,
      reward
    });

    if(window.NOTIFY)
      notify("💀 Yeni Bounty Açıldı!");

    if(window.EVENT)
      EVENT.emit("bounty:new",{userId,reward});
  },

  /* ===========================================
     CLAIM BOUNTY
  =========================================== */

  async claim(targetId,killerId){

    const {data:bounty} = await db
      .from("bounties")
      .select("*")
      .eq("target_id",targetId)
      .eq("status","active")
      .single();

    if(!bounty) return;

    /* ödül ver */
    await db.rpc("add_balance",{
      uid:killerId,
      amount:bounty.reward
    });

    /* bounty kapat */
    await db.from("bounties")
      .update({status:"done"})
      .eq("id",bounty.id);

    /* heat reset */
    await db.from("users")
      .update({heat:20})
      .eq("id",targetId);

    if(window.NOTIFY)
      notify("🏆 Bounty Kazanıldı!");

    EVENT.emit("bounty:claimed",bounty);
  }

};

window.BOUNTY = BOUNTY;


/* ===========================================
   HEAT LISTENER
=========================================== */

if(window.EVENT){

  EVENT.on("heat:update",(data)=>{
    if(!GAME.user) return;

    BOUNTY.check(GAME.user.id,data.value);
  });

}


/* ===========================================
   PVP RESULT LINK
=========================================== */

EVENT.on("pvp:result",(res)=>{

  if(res.winner && res.loser){
    BOUNTY.claim(res.loser,res.winner);
  }

});

console.log("🎯 Bounty Engine Ready");

})();
