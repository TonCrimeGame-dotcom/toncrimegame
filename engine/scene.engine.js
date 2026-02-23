/* ===================================================
   TONCRIME SCENE REGISTRY
=================================================== */

(function(){

/* ================= HOME ================= */

SCENE.register("index",async()=>{

return `
<h2>🌆 Yeraltı Şehri</h2>
<p>Şehir yaşıyor...</p>
`;

});

/* ================= MISSIONS ================= */

SCENE.register("missions",async()=>{

return `
<h2>🎯 Görevler</h2>
<div id="missionsArea"></div>
`;

});

/* ================= PVP ================= */

SCENE.register("pvp",async()=>{

return `
<h2>⚔ PvP Arena</h2>
<button onclick="EVENT.emit('pvp:queue')">
PvP Ara
</button>
`;

});

/* ================= HOSPITAL ================= */

SCENE.register("hospital",async()=>{

return `
<h2>🏥 Hastane</h2>
<button onclick="HOSPITAL.revive()">
💊 700 YTON ile çık
</button>
`;

});

console.log("📚 Scenes Registered");

})();
