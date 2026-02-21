/* ===================================================
   TONCRIME SCENE REGISTER
=================================================== */

(function(){

/* ================= HOME ================= */

SCENE.register("home", async(root)=>{

root.innerHTML=`

<div class="card">
<h2>🏠 Ana Sayfa</h2>
TonCrime dünyasına hoşgeldin.
</div>

<div class="card">
<button onclick="SCENE.load('pvp')">⚔ PvP Arena</button>
<button onclick="SCENE.load('world')">🌍 Mekanlar</button>
<button onclick="SCENE.load('clan')">👥 Clan</button>
</div>

`;

});


/* ================= PVP ================= */

SCENE.register("pvp", async(root)=>{

root.innerHTML=`

<div class="card">
<h2>⚔ PvP Arena</h2>

<button onclick="PVP_TARGET.find()">Rakip Ara</button>

<div id="pvpStatus"></div>

<button onclick="SCENE.load('home')">⬅ Geri</button>

</div>

`;

});


/* ================= WORLD ================= */

SCENE.register("world", async(root)=>{

root.innerHTML=`

<div class="card">
<h2>🌍 Mekanlar</h2>

<button onclick="CHAT.join('coffee')">☕ Coffee Shop</button>
<button onclick="CHAT.join('club')">🍾 Gece Kulübü</button>
<button onclick="CHAT.join('house')">🏠 Genel Ev</button>

<button onclick="SCENE.load('home')">⬅ Geri</button>

</div>

`;

});


/* ================= CLAN ================= */

SCENE.register("clan", async(root)=>{

root.innerHTML=`

<div class="card">
<h2>👥 Clan Merkezi</h2>
Clan sistemi aktif.
<button onclick="SCENE.load('home')">⬅ Geri</button>
</div>

`;

});

console.log("🎬 Scenes Registered");

})();
