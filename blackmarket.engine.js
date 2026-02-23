/* ===================================================
   TONCRIME BLACK MARKET ENGINE
   Illegal Trade System
   =================================================== */

(function(){

if(!window.CONFIG || !window.db){
  console.warn("BlackMarket waiting engine...");
  return;
}

const BlackMarket = {

  cache: [],
  lastUpdate: 0,

  /* ===========================================
     RANDOM PRICE AI
  =========================================== */

  generatePrice(base){

    const volatility = 0.4; // %40 oynama
    const change = (Math.random()*2-1)*volatility;

    return Math.max(
      1,
      Math.floor(base + base*change)
    );
  },

  /* ===========================================
     RISK CALC
  =========================================== */

  generateRisk(){
    return Math.floor(5 + Math.random()*45); // %5-50
  },

  /* ===========================================
     REFRESH MARKET
  =========================================== */

  async refresh(){

    console.log("🕶️ Black Market Refresh");

    const items = [
      {id:"coffee", base:50},
      {id:"drink", base:120},
      {id:"electronics", base:300},
      {id:"weapon_parts", base:500}
    ];

    const rows = items.map(i=>({
      item_id:i.id,
      stock:Math.floor(50+Math.random()*150),
      price:this.generatePrice(i.base),
      risk:this.generateRisk(),
      updated_at:new Date()
    }));

    await db.from("black_market")
      .delete()
      .neq("id",0);

    await db.from("black_market")
      .insert(rows);

    this.lastUpdate = Date.now();
  },

  /* ===========================================
     LOAD MARKET
  =========================================== */

  async load(){

    const {data,error} =
      await db.from("black_market")
      .select("*");

    if(error){
      console.error(error);
      return;
    }

    this.cache = data;

    if(window.EVENT)
      EVENT.emit("blackmarket:update",data);
  },

  /* ===========================================
     BUY ITEM
  =========================================== */

  async buy(itemId,amount){

    const user = GAME.user;
    if(!user) return;

    const item =
      this.cache.find(i=>i.item_id===itemId);

    if(!item) return;

    const cost = item.price * amount;

    if(user.yton < cost){
      notify("Yetersiz bakiye");
      return;
    }

    /* risk check */
    if(Math.random()*100 < item.risk){

      notify("🚓 Polis baskını! Para kaybettin.");

      await db.from("users")
        .update({
          yton:user.yton - cost
        })
        .eq("id",user.id);

      return;
    }

    /* success */

    await db.from("inventory")
      .insert({
        user_id:user.id,
        item_id:itemId,
        amount
      });

    await db.from("users")
      .update({
        yton:user.yton - cost
      })
      .eq("id",user.id);

    notify("🕶️ Black Market alış başarılı");

    EVENT.emit("inventory:update");
  }

};

/* GLOBAL */
window.BLACKMARKET = BlackMarket;


/* ===========================================
   AUTO LOOP
=========================================== */

setInterval(async()=>{

  const now = Date.now();

  /* 30 dk refresh */
  if(now - BlackMarket.lastUpdate > 1800000){
    await BlackMarket.refresh();
  }

  await BlackMarket.load();

},60000);

console.log("🕶️ Black Market Engine Ready");

})();
