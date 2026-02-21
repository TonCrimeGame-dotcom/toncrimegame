/* ===================================================
   TONCRIME BUSINESS PRODUCTION ENGINE
   Server → Player Economy
=================================================== */

(function(){

const BUSINESS = {

DAILY_PLAYER_PRODUCTION:100,

PRODUCTS:[
"espresso","latte","americano","mojito","vodka",
"whiskey","beer","energy_mix","smart_drink","club_shot"
],

/* =========================================
   BUILD ACCESS
========================================= */

canOwn(){

const u=GAME.user;
if(!u) return false;

return (u.level>=50 || u.premium===true);

},

/* =========================================
   RANDOM PRODUCT
========================================= */

randomProduct(){

return this.PRODUCTS[
Math.floor(Math.random()*this.PRODUCTS.length)
];

},

/* =========================================
   DAILY PLAYER PRODUCTION
========================================= */

async produceDaily(){

if(!this.canOwn()) return;

const user=GAME.user;
const now=new Date();
const today=now.toDateString();

if(user.last_business_day===today) return;

/* 100 RANDOM ITEMS */

let produced={};

for(let i=0;i<this.DAILY_PLAYER_PRODUCTION;i++){

const item=this.randomProduct();

produced[item]=(produced[item]||0)+1;
}

/* SAVE STOCK */

for(const item in produced){

await db.rpc("add_player_stock",{
p_user:user.id,
p_item:item,
p_amount:produced[item]
});

}

await db.from("users")
.update({last_business_day:today})
.eq("id",user.id);

console.log("🏭 Daily player production complete");

},

/* =========================================
   BUY FROM SERVER (WHOLESALE)
========================================= */

async buyServer(item,amount,price){

const user=GAME.user;
const total=amount*price;

if(user.yton<total){
NOTIFY.show("Yetersiz bakiye");
return;
}

await db.rpc("add_player_stock",{
p_user:user.id,
p_item:item,
p_amount:amount
});

await db.from("users")
.update({yton:user.yton-total})
.eq("id",user.id);

user.yton-=total;

NOTIFY.show("Server stok satın alındı");

EVENT.emit("stock:update");

}

};

window.BUSINESS=BUSINESS;

console.log("🏢 Business Production Ready");

})();
