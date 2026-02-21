/* ===================================================
   TONCRIME MARKET ENGINE
=================================================== */

(function(){

const MARKET = {

  listings:[],

  /* ===========================
     LOAD MARKET
  =========================== */

  async load(){

    const {data,error}=await db
      .from("market_listings")
      .select("*")
      .order("created_at",{ascending:false});

    if(error) return;

    this.listings=data;

    EVENT.emit("market:update",data);
  },

  /* ===========================
     CREATE LISTING
  =========================== */

  async sell(item,amount,price){

    const user=GAME.user;

    await db.from("market_listings").insert({
      seller_id:user.id,
      item:item,
      amount:amount,
      price:price
    });

    NOTIFY.show("Ürün markete koyuldu");

    this.load();
  },

  /* ===========================
     BUY ITEM
  =========================== */

  async buy(listingId){

    const user=GAME.user;

    await db.rpc("buy_market_item",{
      p_listing:listingId,
      p_buyer:user.id
    });

    NOTIFY.show("Satın alındı");

    this.load();
  }

};

window.MARKET=MARKET;

console.log("💰 Market Engine Ready");

})();
