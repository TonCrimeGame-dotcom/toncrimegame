/* ===================================================
   TONCRIME BUSINESS OWNER ENGINE v2
   Player Production + Market System
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Business engine waiting EVENT...");
  return;
}

/* ===========================================
   CONFIG
=========================================== */

const STORAGE_KEY="tc_business_v2";

const DAILY_PRODUCTION = 100;
const PRODUCTION_TIME = 86400000; // 24h

const PRODUCTS = {

  coffee_shop:[
    "Espresso","Latte","Cold Brew","Turbo Shot",
    "Black Energy","Night Coffee"
  ],

  night_club:[
    "Vodka","Whiskey","Gin","Neon Shot",
    "Dark Mix","Ultra Drink"
  ]

};

/* ===========================================
   ENGINE
=========================================== */

const BUSINESS={

  data:{},

  /* ===================================== */
  init(){
    this.load();
    console.log("🏢 Business Engine Ready");
  },

  load(){
    try{
      this.data=
        JSON.parse(localStorage.getItem(STORAGE_KEY))
        || {};
    }catch{
      this.data={};
    }
  },

  save(){
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.data)
    );
  },

  /* ===================================== */
  BUY BUILDING
  ===================================== */

  buy(building){

    const user=GAME.user;

    if(user.level<50 && !user.premium){
      NOTIFY.push("Level 50 veya Premium gerekli");
      return;
    }

    const key=user.id+"_"+building;

    if(this.data[key]){
      NOTIFY.push("Zaten bu işletmeye sahipsin");
      return;
    }

    this.data[key]={
      owner:user.id,
      building,
      product:null,
      stock:0,
      price:0,
      lastProduction:0
    };

    this.save();

    EVENT.emit("business:chooseProduct",{
      building,
      options:PRODUCTS[building]
    });
  },

  /* ===================================== */
  SELECT PRODUCT
  ===================================== */

  selectProduct(building,product){

    const key=GAME.user.id+"_"+building;
    const biz=this.data[key];

    if(!biz) return;

    biz.product=product;
    biz.lastProduction=Date.now();
    biz.price=ECONOMY.price(building);

    this.save();

    NOTIFY.push("Üretim başladı: "+product);
  },

  /* ===================================== */
  DAILY PRODUCTION
  ===================================== */

  produce(){

    const now=Date.now();

    Object.values(this.data).forEach(biz=>{

      if(!biz.product) return;

      if(now-biz.lastProduction >= PRODUCTION_TIME){

        biz.stock += DAILY_PRODUCTION;
        biz.lastProduction = now;

        EVENT.emit("business:produced",biz);

      }

    });

    this.save();
  },

  /* ===================================== */
  BUY FROM SERVER STOCK
  ===================================== */

  buyServer(building,amount){

    const key=GAME.user.id+"_"+building;
    const biz=this.data[key];
    if(!biz) return;

    const price = ECONOMY.price(building);

    const cost = price*amount;

    if(GAME.user.yton < cost){
      NOTIFY.push("Yetersiz bakiye");
      return;
    }

    GAME.user.yton -= cost;
    biz.stock += amount;

    EVENT.emit("money:spent",cost);

    this.save();

    NOTIFY.push(amount+" ürün stoklandı");
  },

  /* ===================================== */
  SET SELL PRICE
  ===================================== */

  setPrice(building,price){

    const key=GAME.user.id+"_"+building;
    const biz=this.data[key];

    if(!biz) return;

    biz.price=price;
    this.save();
  },

  /* ===================================== */
  PLAYER BUY
  ===================================== */

  buyFromOwner(ownerId,building,amount){

    const key=ownerId+"_"+building;
    const biz=this.data[key];

    if(!biz || biz.stock<amount){
      NOTIFY.push("Stok yetersiz");
      return;
    }

    const total=biz.price*amount;

    if(GAME.user.yton < total){
      NOTIFY.push("Yetersiz YTON");
      return;
    }

    GAME.user.yton -= total;
    biz.stock -= amount;

    /* owner earns */
    EVENT.emit("money:earned",total);

    EVENT.emit("market:buy",{
      building,
      amount
    });

    this.save();

    NOTIFY.push("Satın alındı");
  }

};

window.BUSINESS=BUSINESS;

/* ===========================================
   AUTO LOOP
=========================================== */

setInterval(()=>{
  if(window.BUSINESS)
    BUSINESS.produce();
},60000);

EVENT.on("game:ready",()=>{
  BUSINESS.init();
});

})();
