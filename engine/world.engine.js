/* ===================================================
   TONCRIME WORLD ENGINE
   Living World Simulation System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("World engine waiting EVENT...");
  return;
}

/* ===========================================
   CONFIG
=========================================== */

const NPC_NAMES=[
  "Rico","Viper","Ghost","Mia","Kobra",
  "Shadow","Nero","Luna","Axel","Nova",
  "Scar","Raven","Zero","Blade","Kira"
];

const BUILDINGS=[
  "coffee_shop",
  "night_club",
  "brothel"
];

const CHAT_LINES=[
  "Mal geldi mi?",
  "Fiyatlar uçmuş bugün.",
  "Yeni gelen kim?",
  "Dikkatli ol polis dolu.",
  "Bu gece hareket var.",
  "PvP atan var mı?",
  "Stok bitti yakında.",
  "Patron kızgın bugün.",
  "İşler iyi gidiyor.",
  "Büyük iş dönüyor."
];

/* ===========================================
   ENGINE
=========================================== */

const WORLD={

  npcs:{},

  /* ===================================== */
  init(){

    this.spawnNPCs();

    setInterval(()=>{
      this.randomActivity();
    },15000);

    console.log("🌍 World Engine Ready");
  },

  /* ===================================== */
  NPC CREATE
  ===================================== */

  spawnNPCs(){

    BUILDINGS.forEach(b=>{

      this.npcs[b]=[];

      for(let i=0;i<3;i++){

        this.npcs[b].push({
          id:"npc_"+Math.random(),
          name:NPC_NAMES[
            Math.floor(Math.random()*NPC_NAMES.length)
          ]
        });

      }

    });

  },

  /* ===================================== */
  RANDOM WORLD ACTION
  ===================================== */

  randomActivity(){

    const building=
      BUILDINGS[Math.floor(Math.random()*BUILDINGS.length)];

    const npcList=this.npcs[building];
    if(!npcList.length) return;

    const npc=
      npcList[Math.floor(Math.random()*npcList.length)];

    const text=
      CHAT_LINES[Math.floor(Math.random()*CHAT_LINES.length)];

    EVENT.emit("world:npc:chat",{
      building,
      npc,
      text
    });

    /* chat engine hook */
    if(window.CHAT){
      CHAT.system(
        building+"_npc",
        "🤖 "+npc.name+": "+text
      );
    }

  }

};

window.WORLD=WORLD;

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  WORLD.init();
});

})();
