/* ===================================================
   TONCRIME PLAYER MARKET ENGINE
   =================================================== */

(function(){

const MARKET={};

/* ================= LOAD ================= */

MARKET.open=async function(){

const root=document.getElementById("tc-content");

const {data}=await db
.from("player_market")
.select("*")
.order("price",{ascending:true});

root.innerHTML=`
<h2>🏪 Oyuncu Pazarı</h2>

${data.map(item=>`
<div class="card">
<b>${item.product}</b><br>
Fiyat: ${item.price} YTON<br>
Satıcı: ${item.owner}

<button onclick="MARKET.buy('${item.id}')">
Satın Al
</button>
</div>
`).join("")}
`;

};

/* ================= BUY ================= */

MARKET.buy=async function(id){

const {data:item}=await db
.from("player_market")
.select("*")
.eq("id",id)
.single();

const {data:user}=await db
.from("users")
.select("*")
.eq("id",CONFIG.USER_ID)
.single();

if(user.yton<item.price){
EVENT.emit("notify","Yetersiz bakiye");
return;
}

/* para transfer */

await db.from("users")
.update({yton:user.yton-item.price})
.eq("id",user.id);

await db.rpc("give_money",{
target:item.owner,
amount:item.price
});

await db.from("player_market")
.delete()
.eq("id",id);

EVENT.emit("notify","🛒 Satın alındı");

MARKET.open();
};

window.MARKET=MARKET;

/* PAGE HOOK */

EVENT.on("page:enter",p=>{
if(p==="market") MARKET.open();
});

})();
