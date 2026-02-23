/* ===================================================
   TONCRIME CITY AI ENGINE
   Dynamic City Behaviour
   =================================================== */

(function(){

const CITY={

mood:1, // 1 normal

init(){

EVENT.on("mission:completed",()=>{
this.mood+=0.01;
});

EVENT.on("pvp:win",()=>{
this.mood+=0.03;
});

setInterval(()=>this.tick(),60000);

console.log("🌆 City AI Active");
},

tick(){

/* şehir sakinleşir */
this.mood*=0.995;

if(this.mood<1) this.mood=1;

/* ekonomi etkisi */
if(window.ECONOMY){
Object.values(ECONOMY.data).forEach(p=>{
p.demand*=this.mood;
});
}

EVENT.emit("city:update",this.mood);

}

};

window.CITY=CITY;

EVENT.on("game:ready",()=>CITY.init());

})();
