/* ===================================================
   TONCRIME GLOBAL CRIME FEED
   =================================================== */

(function(){

const FEED={};

/* ================= ADD ================= */

FEED.add=async function(text){

await db.from("crime_feed").insert({
message:text
});

};

/* ================= RENDER ================= */

FEED.render=async function(){

const root=document.getElementById("crimeFeed");

if(!root) return;

const {data}=await db
.from("crime_feed")
.select("*")
.order("created_at",{ascending:false})
.limit(20);

root.innerHTML=data.map(x=>
`<div>📰 ${x.message}</div>`
).join("");
};

/* ================= EVENTS ================= */

EVENT.on("mission:completed",()=>{
FEED.add("Bir oyuncu görev tamamladı");
});

EVENT.on("pvp:win",()=>{
FEED.add("⚔ PvP savaşı kazanıldı");
});

EVENT.on("territory:capture",()=>{
FEED.add("🗺 Yeni bölge ele geçirildi!");
});

/* realtime refresh */
setInterval(()=>FEED.render(),5000);

window.CRIMEFEED=FEED;

})();
