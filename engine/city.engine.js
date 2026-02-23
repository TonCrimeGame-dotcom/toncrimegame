/* ===================================================
   TONCRIME CITY ENGINE
   Global World Presence System
   =================================================== */

(function(){

const CITY={

current:null,
channel:null

};

/* ================= LOAD PLAYER CITY ================= */

CITY.load = async function(){

const {data:user} = await db
.from("users")
.select("city_id")
.eq("id",CONFIG.USER_ID)
.single();

if(!user.city_id){
CITY.selectUI();
return;
}

CITY.join(user.city_id);

};

/* ================= CITY SELECT UI ================= */

CITY.selectUI = async function(){

const root=document.getElementById("tc-content");

const {data:cities}=await db
.from("cities")
.select("*")
.order("name");

root.innerHTML=`
<h2>🌍 Şehir Seç</h2>

${cities.map(c=>`
<div class="card">
<b>${c.name}</b>
<br>Bonus: ${c.bonus}
<br><br>
<button onclick="CITY.choose(${c.id})">
Şehre Git
</button>
</div>
`).join("")}
`;

};

/* ================= CHOOSE CITY ================= */

CITY.choose = async function(id){

await db.from("users")
.update({city_id:id})
.eq("id",CONFIG.USER_ID);

CITY.join(id);

};

/* ================= JOIN CITY ================= */

CITY.join = async function(cityId){

CITY.current=cityId;

if(CITY.channel){
await CITY.channel.unsubscribe();
}

/* realtime channel */

CITY.channel=db.channel(
"city-"+cityId,
{
config:{presence:{key:CONFIG.USER_ID}}
}
);

/* presence sync */

CITY.channel.on("presence",{event:"sync"},()=>{

const state=CITY.channel.presenceState();

EVENT.emit("city:players",state);

});

CITY.channel.subscribe(async(status)=>{

if(status==="SUBSCRIBED"){

await CITY.channel.track({
user:CONFIG.USER_ID,
joined:Date.now()
});

console.log("🌍 Joined city",cityId);

EVENT.emit("city:joined",cityId);

}

});

CITY.renderHUD();

};

/* ================= HUD ================= */

CITY.renderHUD=function(){

const top=document.getElementById("onlinePlayers");
if(!top) return;

EVENT.on("city:players",state=>{
top.innerText=
"🌍 Şehir Online: "+
Object.keys(state).length;
});

};

window.CITY=CITY;

/* ================= AUTO START ================= */

EVENT.on("game:ready",()=>{
CITY.load();
});

console.log("🌍 City Engine Ready");

})();
