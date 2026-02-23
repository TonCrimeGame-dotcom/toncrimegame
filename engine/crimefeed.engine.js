/* ===================================================
   TONCRIME GLOBAL CRIME FEED ENGINE
   Living City Event Stream
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("CrimeFeed waiting EVENT...");
  return;
}

/* ===========================================
   STORAGE
=========================================== */

const STORAGE_KEY="tc_crime_feed";
const MAX_FEED=50;

/* ===========================================
   ENGINE
=========================================== */

const CRIMEFEED={

  feed:[],

  /* ===================================== */
  init(){
    this.load();
    this.bindEvents();
    this.render();

    console.log("📰 Crime Feed Ready");
  },

  load(){
    try{
      this.feed=
        JSON.parse(localStorage.getItem(STORAGE_KEY))
        || [];
    }catch{
      this.feed=[];
    }
  },

  save(){
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.feed)
    );
  },

  /* ===================================== */
  ADD EVENT
  ===================================== */

  add(text){

    this.feed.unshift({
      text,
      time:Date.now()
    });

    if(this.feed.length>MAX_FEED)
      this.feed.pop();

    this.save();
    this.render();
  },

  /* ===================================== */
  EVENTS LISTEN
  ===================================== */

  bindEvents(){

    EVENT.on("pvp:win",(d)=>{
      this.add(`⚔ ${d.winner} ${d.loser}'i yendi`);
    });

    EVENT.on("player:hospitalized",()=>{
      this.add(`🏥 ${GAME.user.nickname} hastanelik oldu`);
    });

    EVENT.on("tournament:winner",(d)=>{
      this.add(`🏆 ${d.winner} turnuvayı kazandı`);
    });

    EVENT.on("territory:capture",(d)=>{
      this.add(`🔥 ${d.faction} ${d.zone} bölgesini ele geçirdi`);
    });

    EVENT.on("season:finished",(d)=>{
      this.add(`⭐ ${d.player} sezonu tamamladı`);
    });

  },

  /* ===================================== */
  RENDER
  ===================================== */

  render(){

    if(!window.UI) return;

    UI.renderCrimeFeed(this.feed.slice(0,10));
  }

};

window.CRIMEFEED=CRIMEFEED;

/* ===========================================
   START
=========================================== */

EVENT.on("game:ready",()=>{
  CRIMEFEED.init();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "Crime Feed Engine",
    ()=>!!window.CRIMEFEED
  );
}

})();
