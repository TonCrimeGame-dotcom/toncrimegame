/* ===================================================
   TONCRIME ANTI CHEAT ENGINE
   PvP Security Layer
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("AntiCheat waiting EVENT...");
  return;
}

/* ===========================================
   CONFIG
=========================================== */

const LIMITS = {
  MIN_REACTION_MS: 250,     // insan altı refleks
  MAX_AVG_SPEED: 1500,      // ortalama soru süresi
  MAX_IDENTICAL_HASH: 2     // replay koruması
};

/* ===========================================
   ENGINE
=========================================== */

const ANTICHEAT = {

  hashes:{},
  flagged:{},

  /* ===================================== */
  verify(session){

    if(!session) return false;

    if(!this.checkReaction(session)) return false;
    if(!this.checkAverageSpeed(session)) return false;
    if(!this.checkReplay(session.hash)) return false;

    return true;
  },

  /* ===================================== */
  REACTION CHECK
  ===================================== */

  checkReaction(session){

    for(const a of session.answers){

      if(a.time < LIMITS.MIN_REACTION_MS){

        console.warn("⚠ Impossible reaction detected");
        this.flag("reaction_speed");

        return false;
      }
    }

    return true;
  },

  /* ===================================== */
  AVG SPEED CHECK
  ===================================== */

  checkAverageSpeed(session){

    let total=0;

    session.answers.forEach(a=>{
      total+=a.time;
    });

    const avg = total/session.answers.length;

    if(avg < LIMITS.MAX_AVG_SPEED/5){

      console.warn("⚠ Unreal average speed");
      this.flag("avg_speed");

      return false;
    }

    return true;
  },

  /* ===================================== */
  HASH REPLAY CHECK
  ===================================== */

  checkReplay(hash){

    if(!this.hashes[hash])
      this.hashes[hash]=0;

    this.hashes[hash]++;

    if(this.hashes[hash] > LIMITS.MAX_IDENTICAL_HASH){

      console.warn("⚠ Replay attack detected");
      this.flag("replay");

      return false;
    }

    return true;
  },

  /* ===================================== */
  FLAG PLAYER
  ===================================== */

  flag(reason){

    if(!window.GAME || !GAME.user) return;

    this.flagged[GAME.user.id]=reason;

    EVENT.emit("anticheat:flag",{
      player:GAME.user.id,
      reason
    });

  }

};

window.ANTICHEAT = ANTICHEAT;

/* ===========================================
   SESSION FINISH HOOK
=========================================== */

EVENT.on("pvp:session:finished",(session)=>{

  const valid = ANTICHEAT.verify(session);

  if(!valid){

    console.log("❌ Session blocked by AntiCheat");

    EVENT.emit("pvp:blocked",session);
    return;
  }

  /* güvenliyse result engine devam eder */
  EVENT.emit("pvp:resolve",session);

});

console.log("🛡 AntiCheat Engine Ready");

})();
