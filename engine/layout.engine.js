/* ===================================================
   TONCRIME LAYOUT ENGINE
   Global Game Shell
   =================================================== */

(function(){

const Layout = {

init(){

document.body.insertAdjacentHTML("afterbegin",`

<div id="tc-sidebar" class="tc-sidebar">
  <h3>TonCrime</h3>

  <p onclick="PAGE.go('index')">🏠 Ana Sayfa</p>
  <p onclick="PAGE.go('missions')">🎯 Görevler</p>
  <p onclick="PAGE.go('pvp')">⚔ PvP</p>
  <p onclick="PAGE.go('coffee')">☕ Coffee Shop</p>
  <p onclick="PAGE.go('club')">🍾 Gece Kulübü</p>
  <p onclick="PAGE.go('brothel')">❤️ Genel Ev</p>
  <p onclick="PAGE.go('market')">💰 Market</p>
</div>

<div id="tc-overlay"></div>

<div class="tc-topbar">
  <div class="menu-btn" onclick="Layout.toggle()">☰</div>
  <div class="logo">TonCrime</div>

  <div class="stats">
    <div id="stats"></div>

    <div class="bar">
      <div id="xpBar" class="xp"></div>
    </div>

    <div class="bar">
      <div id="energyBar" class="energy"></div>
    </div>
  </div>
</div>

<div class="tc-main">
  <div id="tc-content"></div>

  <div class="tc-userpanel" id="playerCard"></div>
</div>

<div id="crimeFeed" class="tc-feed"></div>

`);

this.injectCSS();

console.log("🧱 Layout Ready");
},

toggle(){
document.getElementById("tc-sidebar")
.classList.toggle("open");
}

};

/* ================= CSS ================= */

Layout.injectCSS=function(){

const style=document.createElement("style");

style.innerHTML=`

body{
margin:0;
background:#0e0e0e;
color:white;
font-family:Arial;
}

.tc-topbar{
position:fixed;
top:0;
left:0;
width:100%;
height:70px;
background:#111;
display:flex;
align-items:center;
justify-content:space-between;
padding:0 20px;
z-index:999;
border-bottom:1px solid #222;
}

.logo{
color:gold;
font-weight:bold;
font-size:22px;
}

.menu-btn{
cursor:pointer;
font-size:22px;
margin-right:10px;
}

.stats{
width:420px;
}

.bar{
height:6px;
background:#333;
margin-top:5px;
border-radius:4px;
overflow:hidden;
}

.xp{background:limegreen;height:100%;}
.energy{background:gold;height:100%;}

.tc-sidebar{
position:fixed;
left:-260px;
top:0;
width:260px;
height:100%;
background:#151515;
padding:20px;
transition:.3s;
z-index:1000;
}

.tc-sidebar.open{left:0;}

.tc-sidebar p{
cursor:pointer;
margin:10px 0;
}

.tc-main{
margin-top:80px;
display:flex;
gap:30px;
padding:20px;
}

#tc-content{
width:65%;
}

.tc-userpanel{
width:25%;
background:#1b1b1b;
padding:15px;
border-radius:10px;
}

.tc-feed{
position:fixed;
bottom:0;
left:0;
width:100%;
background:#111;
padding:8px;
font-size:13px;
border-top:1px solid #222;
}

`;

document.head.appendChild(style);
};

window.Layout=Layout;

/* AUTO START */
document.addEventListener("DOMContentLoaded",()=>{
Layout.init();
});

})();
