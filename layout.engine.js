/* =====================================
   TONCRIME GLOBAL PAGE LAYOUT ENGINE
===================================== */

function buildLayout(pageContent){

document.body.innerHTML = `
<div class="sidebar" id="sidebar">
<h3 style="color:gold">Menü</h3>

<p onclick="go('index.html')">🏠 Ana Sayfa</p>
<p onclick="go('missions.html')">🎯 Görevler</p>
<p onclick="go('coffeeshop.html')">☕ Coffee</p>
<p onclick="go('nightclub.html')">🍾 Gece Kulübü</p>
<p onclick="go('pvp.html')">⚔ PvP</p>

</div>

<div class="overlay" id="overlay"></div>

<div class="topbar">
<div>
<span class="menuBtn" onclick="openMenu()">☰</span>
<span class="logo">TonCrime</span>
</div>

<div id="stats">...</div>
</div>

<div class="page">

<div class="leftArea">
${pageContent}
</div>

<div class="rightArea">

<div class="card">
<h3>👤 Oyuncu</h3>
<div id="userInfo"></div>
</div>

<div class="card">
<h3>🌐 Online</h3>
<div id="onlineCount">0</div>
</div>

</div>

</div>
`;

bindMenu();
}

/* MENU */

function bindMenu(){

window.openMenu=()=>{
sidebar.classList.add("open");
overlay.classList.add("show");
};

overlay.onclick=()=>{
sidebar.classList.remove("open");
overlay.classList.remove("show");
};

window.go=(p)=>location.href=p;
}
