/* ===================================================
   TONCRIME CLAN ENGINE
   =================================================== */

(function(){

const CLAN={};

/* ================= CREATE ================= */

CLAN.create=async function(){

const name=prompt("Clan adı:");
if(!name) return;

await db.from("clans").insert({
name,
owner:CONFIG.USER_ID
});

EVENT.emit("notify","Clan kuruldu");
};

/* ================= JOIN ================= */

CLAN.join=async function(id){

await db.from("clan_members").insert({
clan_id:id,
user_id:CONFIG.USER_ID
});

EVENT.emit("notify","Clan'a katıldın");
};

/* ================= LIST ================= */

CLAN.open=async function(){

const root=document.getElementById("tc-content");

const {data}=await db.from("clans").select("*");

root.innerHTML=`
<h2>👥 Clanlar</h2>

<button onclick="CLAN.create()">Clan Kur</button>

${data.map(c=>`
<div class="card">
<b>${c.name}</b>
<button onclick="CLAN.join('${c.id}')">Katıl</button>
</div>
`).join("")}
`;

};

EVENT.on("page:enter",p=>{
if(p==="clans") CLAN.open();
});

window.CLAN=CLAN;

})();
