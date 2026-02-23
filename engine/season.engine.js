/* ===================================================
   TONCRIME SEASON ENGINE
   Live Service Season System
   =================================================== */

(function(){

if(!window.db || !window.EVENT){
  console.warn("Season engine waiting...");
  return;
}

const SEASON = {

DURATION: 30*24*60*60*1000, // 30 gün

current:null,

/* ======================================
   GET ACTIVE SEASON
====================================== */

async load(){

  const {data}=await db
    .from("seasons")
    .select("*")
    .eq("active",true)
    .maybeSingle();

  if(!data){
    await this.create();
    return this.load();
  }

  this.current=data;

  this.checkEnd();
},

/* ======================================
   CREATE NEW SEASON
====================================== */

async create(){

  const now=Date.now();

  await db.from("seasons").insert({
    season_number:1,
    start_date:new Date(now),
    end_date:new Date(now+this.DURATION),
    active:true
  });

  console.log("🌍 First season created");
},

/* ======================================
   CHECK SEASON END
====================================== */

async checkEnd(){

  const now=Date.now();
  const end=new Date(this.current.end_date).getTime();

  if(now<end) return;

  await this.finishSeason();
  await this.startNext();
},

/* ======================================
   FINISH SEASON
====================================== */

async finishSeason(){

  console.log("🏁 Season Finished");

  const {data:players}=await db
    .from("users")
    .select("id,elo");

  for(const p of players){

    await db.from("season_players").insert({
      user_id:p.id,
      season:this.current.season_number,
      final_elo:p.elo
    });

    /* SOFT RESET */
    const newElo=Math.round(1000+(p.elo-1000)*0.4);

    await db.from("users")
      .update({
        elo:newElo,
        season_badge:this.getBadge(p.elo)
      })
      .eq("id",p.id);
  }

  await db.from("seasons")
    .update({active:false})
    .eq("id",this.current.id);
},

/* ======================================
   START NEXT SEASON
====================================== */

async startNext(){

  const now=Date.now();

  await db.from("seasons").insert({
    season_number:this.current.season_number+1,
    start_date:new Date(now),
    end_date:new Date(now+this.DURATION),
    active:true
  });

  console.log("🚀 New season started");

  EVENT.emit("season:new");
},

/* ======================================
   BADGE SYSTEM
====================================== */

getBadge(elo){

  if(elo>1600) return "💎 Diamond";
  if(elo>1400) return "🥇 Gold";
  if(elo>1200) return "🥈 Silver";
  return "🥉 Bronze";
}

};

window.SEASON=SEASON;


/* AUTO START */

document.addEventListener("DOMContentLoaded",()=>{
  setTimeout(()=>SEASON.load(),2000);
});

console.log("📅 Season Engine Ready");

})();
