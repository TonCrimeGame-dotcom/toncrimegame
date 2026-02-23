/* ===================================================
   TONCRIME TERRITORY CONTROL ENGINE
   =================================================== */

(function(){

const ZONES=[
{id:1,name:"Merkez"},
{id:2,name:"Liman"},
{id:3,name:"Gece Bölgesi"},
{id:4,name:"Sanayi"}
];

const TERRITORY={};

TERRITORY.render=async function(){

const root=document.getElementById("tc-content");

const {data}=await db.from("territories").select("*");

root.innerHTML=`
<h2>🗺 Bölge Kontrolü</h2>

${ZONES.map(z=>{

const owner=data.find(x=>x.zone_id===z.id);

return`
<div class="card">
<b>${z.name}</b><br>
Sahip: ${owner?owner.owner:"Yok"}

<button onclick="TERRITORY.attack(${z.id})">
Saldır
</button>
</div>`;
}).join("")}
`;
};

TERRITORY.attack=async function(zone){

await db.from("territories")
.upsert({
zone_id:zone,
owner:CONFIG.USER_ID
});

EVENT.emit("notify","Bölge ele geçirildi!");
};

EVENT.on("page:enter",p=>{
if(p==="territory") TERRITORY.render();
});

window.TERRITORY=TERRITORY;

})();
