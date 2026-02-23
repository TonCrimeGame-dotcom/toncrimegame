/* ===================================================
   TONCRIME FACTION / MAFIA WAR ENGINE
   Clan Warfare & Territory Control
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Faction engine waiting EVENT...");
  return;
}

/* ===========================================
   STORAGE
=========================================== */

const STORAGE_KEY="tc_factions";

/* ===========================================
   WORLD MAP
=========================================== */

const TERRITORIES=[
  {id:"downtown", income:40},
  {id:"harbor", income:60},
  {id:"industrial", income:80},
  {id:"night_district", income:100},
  {id:"old_town", income:120}
];

/* ===========================================
   ENGINE
=========================================== */

const FACTION={

  data:null,

  /* ===================================== */
  init(){
    this.load();
    this.ensureWorld();

    setInterval(()=>this.dailyIncome(),60000);

    console.log("🏴 Faction Engine Ready");
  },

  load(){
    try{
      this.data=
        JSON.parse(localStorage.getItem(STORAGE_KEY))
        || {factions:{}, territories:{}};
    }catch{
      this.data={factions:{},territories:{}};
    }
  },

  save(){
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.data)
    );
  },

  ensureWorld(){

    TERRITORIES.forEach(t=>{
      if(!this.data.territories[t.id]){
        this.data.territories[t.id]={
          owner:null,
          income:t.income
        };
      }
    });

    this.save();
  },

  /* ===================================== */
  CREATE FACTION
  ===================================== */

  create(name){

    const id="fac_"+Date.now();

    this.data.factions[id]={
      id,
      name,
      leader:GAME.user.id,
      members:[GAME.user.id],
      power:0
    };

    this.save();

    NOTIFY.push("🏴 Clan kuruldu!");
  },

  /* ===================================== */
  JOIN
  ===================================== */

  join(factionId){

    const f=this.data.factions[factionId];
    if(!f) return;

    if(!f.members.includes(GAME.user.id))
      f.members.push(GAME.user.id);

    this.save();
  },

  /* ===================================== */
  TERRITORY ATTACK
  ===================================== */

  attackTerritory(id){

    const territory=this.data.territories[id];
    if(!territory) return;

    const win=Math.random()>0.5;

    if(win){
      territory.owner=this.getPlayerFaction();
      NOTIFY.push("🔥 Bölge ele geçirildi!");
    }else{
      NOTIFY.push("❌ Savaş kaybedildi");
    }

    this.save();
  },

  /* ===================================== */
  DAILY INCOME
  ===================================== */

  dailyIncome(){

    const today=new Date().toDateString();

    if(localStorage.getItem("tc_faction_income")==today)
      return;

    localStorage.setItem("tc_faction_income",today);

    Object.values(this.data.territories)
      .forEach(t=>{

        if(!t.owner) return;

        const faction=this.data.factions[t.owner];
        if(!faction) return;

        const share=t.income/faction.members.length;

        faction.members.forEach(m=>{
          if(m===GAME.user.id){
            GAME.user.yton+=share;
            NOTIFY.push("💰 Bölge geliri +"+share);
          }
        });

      });
  },

  /* ===================================== */
  PLAYER FACTION
  ===================================== */

  getPlayerFaction(){

    return Object.values(this.data.factions)
      .find(f=>f.members.includes(GAME.user.id))?.id;
  }

};

window.FACTION=FACTION;

/* ===========================================
   START
=========================================== */

EVENT.on("game:ready",()=>{
  FACTION.init();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "Faction Engine",
    ()=>!!window.FACTION
  );
}

})();
