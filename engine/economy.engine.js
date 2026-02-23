/* ===================================================
   TONCRIME WORLD ECONOMY ENGINE
   Dynamic Supply & Demand System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Economy waiting EVENT...");
  return;
}

/* ===========================================
   STORAGE
=========================================== */

const STORAGE_KEY="tc_economy";

/* ===========================================
   PRODUCTS
=========================================== */

const PRODUCTS={

coffee:{
  base:5,
  demand:1,
  stock:1000000
},

alcohol:{
  base:12,
  demand:1,
  stock:1000000
},

service:{
  base:100,
  demand:1,
  stock:999999
}

};

/* ===========================================
   ENGINE
=========================================== */

const ECONOMY={

data:{},

/* =========================================== */

init(){

  this.load();
  this.loop();

  EVENT.on("market:buy",p=>{
    this.purchase(p);
  });

  console.log("🌐 Economy Engine Ready");
},

/* =========================================== */

load(){

  const saved=
    localStorage.getItem(STORAGE_KEY);

  this.data = saved
    ? JSON.parse(saved)
    : PRODUCTS;

  this.save();
},

save(){
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(this.data)
  );
},

/* ===========================================
   PURCHASE EFFECT
=========================================== */

purchase(product){

  if(!this.data[product]) return;

  const p=this.data[product];

  p.stock=Math.max(0,p.stock-1);
  p.demand+=0.02;

  this.save();
},

/* ===========================================
   PRICE AI
=========================================== */

price(product){

  const p=this.data[product];
  if(!p) return 0;

  return Number(
    (p.base*p.demand).toFixed(2)
  );
},

/* ===========================================
   NATURAL MARKET FLOW
=========================================== */

tick(){

  Object.values(this.data).forEach(p=>{

    /* supply regeneration */
    p.stock+=50;

    /* demand decay */
    p.demand*=0.995;

    if(p.demand<1) p.demand=1;
  });

  this.save();

  EVENT.emit("economy:update");
},

/* ===========================================
   LOOP
=========================================== */

loop(){
  setInterval(()=>{
    this.tick();
  },60000); // 1 dk
}

};

window.ECONOMY=ECONOMY;

/* ===========================================
   AUTO START
=========================================== */

EVENT.on("game:ready",()=>{
  ECONOMY.init();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "World Economy",
    ()=>!!window.ECONOMY
  );
}

})();
