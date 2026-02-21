/* ===================================================
   TONCRIME PRICE AI ENGINE
   Market Intelligence System
=================================================== */

(function(){

const PRICE_AI = {

  averages:{},

  /* =====================================
     CALCULATE MARKET AVERAGES
  ===================================== */

  calculate(listings){

    const map={};

    listings.forEach(l=>{

      if(!map[l.item])
        map[l.item]={total:0,count:0};

      map[l.item].total += Number(l.price);
      map[l.item].count++;

    });

    this.averages={};

    for(const item in map){

      this.averages[item] =
        map[item].total / map[item].count;

    }

    console.log("🧠 Price AI Updated",this.averages);

  },

  /* =====================================
     PRICE ANALYSIS
  ===================================== */

  analyze(item,price){

    const avg=this.averages[item];

    if(!avg) return {
      label:"Bilinmiyor",
      color:"#999"
    };

    const ratio = price/avg;

    if(ratio <= 0.7)
      return {label:"🔥 Çok Ucuz",color:"#2ecc71"};

    if(ratio <= 1.1)
      return {label:"⚖ Dengeli",color:"#f1c40f"};

    return {label:"💀 Pahalı",color:"#e74c3c"};
  }

};

window.PRICE_AI=PRICE_AI;

/* =====================================
   AUTO LISTEN MARKET
===================================== */

if(window.EVENT){

  EVENT.on("market:update",(list)=>{
    PRICE_AI.calculate(list);
  });

}

console.log("🧠 Price AI Ready");

})();
