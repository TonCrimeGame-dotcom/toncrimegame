/* ===================================================
   TONCRIME RANDOM CITY EVENTS ENGINE
   Dynamic Living City System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("CityEvents waiting EVENT...");
  return;
}

/* ===========================================
   CONFIG
=========================================== */

const STORAGE_KEY="tc_city_events";
const EVENT_INTERVAL = 10 * 60 * 1000; // 10 dk

/* ===========================================
   EVENTS LIST
=========================================== */

const EVENTS=[

{
id:"police_raid",
text:"🚔 Polis şehirde baskın başlattı!",
effect(){
  EVENT.emit("city:heatBoost",5);
}
},

{
id:"black_market",
text:"💰 Kara borsa açıldı! Fiyatlar düştü.",
effect(){
  EVENT.emit("market:discount",20);
}
},

{
id:"party_night",
text:"🍾 Şehirde çılgın parti! Enerji kazanımı arttı.",
effect(){
  EVENT.emit("energy:boost",15);
}
},

{
id:"market_crash",
text:"📉 Ekonomi sarsıldı! Ürün değerleri düştü.",
effect(){
  EVENT.emit("market:crash");
}
},

{
id:"secret_job",
text:"🎯 Gizli iş fırsatı ortaya çıktı!",
effect(){
  EVENT.emit("mission:bonus");
}
}

];

/* ===========================================
   ENGINE
=========================================== */

const CITYEVENTS={

  lastEvent:0,

  init(){

    this.load();

    setInterval(()=>{
      this.tick();
    },60000);

    console.log("🎲 City Events Ready");
  },

  load(){
    this.lastEvent =
      Number(localStorage.getItem(STORAGE_KEY)) || 0;
  },

  save(){
    localStorage.setItem(STORAGE_KEY,this.lastEvent);
  },

  tick(){

    const now=Date.now();

    if(now-this.lastEvent < EVENT_INTERVAL)
      return;

    this.lastEvent=now;
    this.save();

    this.triggerRandom();
  },

  triggerRandom(){

    const event =
      EVENTS[Math.floor(Math.random()*EVENTS.length)];

    event.effect();

    EVENT.emit("city:event",event);

    if(window.CRIMEFEED){
      CRIMEFEED.add(event.text);
    }

    console.log("🌆 City Event:",event.id);
  }

};

window.CITYEVENTS=CITYEVENTS;

/* ===========================================
   START
=========================================== */

EVENT.on("game:ready",()=>{
  CITYEVENTS.init();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "City Events Engine",
    ()=>!!window.CITYEVENTS
  );
}

})();
