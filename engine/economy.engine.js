/* ===================================================
   TONCRIME GLOBAL ECONOMY ENGINE
   Dynamic Supply & Demand System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Economy engine waiting EVENT...");
  return;
}

/* ===========================================
   CONFIG
=========================================== */

const STORAGE_KEY="tc_global_economy";

const BUILDINGS=[
  "coffee_shop",
  "night_club",
  "brothel",
  "weapon_market"
];

const BASE_PRICE={
  coffee_shop:5,
  night_club:8,
  brothel:120,
  weapon_market:50
};

/* ===========================================
   ENGINE
=========================================== */

const ECONOMY={

  market:{},

  /* ===================================== */
  init(){

    this.load();
    this.ensureMarkets();

    setInterval(()=>{
      this.decayDemand();
    },60000);

    console.log("💰 Economy Engine Ready");
  },

  /* ===================================== */
  load(){
    try{
      this.market=
        JSON.parse(localStorage.getItem(STORAGE_KEY))
        || {};
    }catch{
      this.market={};
    }
  },

  save(){
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.market)
    );
  },

  /* ===================================== */
  ensureMarkets(){

    BUILDINGS.forEach(b=>{

      if(!this.market[b]){
        this.market[b]={
          demand:1,
          price:BASE_PRICE[b]
        };
      }

    });

    this.save();
  },

  /* ===================================== */
  BUY EVENT (PLAYER PURCHASE)
  ===================================== */

  buy(building,amount=1){

    const m=this.market[building];
    if(!m) return;

    m.demand += amount*0.05;

    this.recalculate(building);

    EVENT.emit("economy:update",{
      building,
      price:m.price
    });

    this.save();
  },

  /* ===================================== */
  DEMAND DECAY
  ===================================== */

  decayDemand(){

    Object.keys(this.market).forEach(b=>{

      const m=this.market[b];

      m.demand *= 0.97;

      if(m.demand<1)
        m.demand=1;

      this.recalculate(b);
    });

    this.save();
  },

  /* ===================================== */
  PRICE FORMULA
  ===================================== */

  recalculate(building){

    const m=this.market[building];

    const base=BASE_PRICE[building];

    m.price =
      Number(
        (base * m.demand).toFixed(2)
      );
  },

  /* ===================================== */
  GET PRICE
  ===================================== */

  price(building){

    if(!this.market[building])
      return BASE_PRICE[building];

    return this.market[building].price;
  }

};

window.ECONOMY=ECONOMY;

/* ===========================================
   AUTO EVENTS
=========================================== */

EVENT.on("game:ready",()=>{
  ECONOMY.init();
});

/* player purchase hook */
EVENT.on("market:buy",(data)=>{
  ECONOMY.buy(data.building,data.amount||1);
});

})();
