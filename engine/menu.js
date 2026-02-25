/* ================= SLIDE MENU ================= */

function buildMenu(){

document.body.insertAdjacentHTML("afterbegin",`

<div class="menu-container">

<div class="menu-slider" id="menuSlider">

<div class="menu-card" onclick="go('missions.html')">
<img src="missions.jpg">
<span>Görevler</span>
</div>

<div class="menu-card" onclick="go('pvp.html')">
<img src="pvp.jpg">
<span>PvP Arena</span>
</div>

<div class="menu-card" onclick="go('nightclub.html')">
<img src="nightclub.jpg">
<span>Gece Kulübü</span>
</div>

<div class="menu-card" onclick="go('coffeeshop.html')">
<img src="coffeeshop.jpg">
<span>Coffee Shop</span>
</div>

<div class="menu-card" onclick="go('xxx.html')">
<img src="xxx.jpg">
<span>Genel Ev</span>
</div>

<div class="menu-card" onclick="go('weapons.html')">
<img src="weapons.jpg">
<span>Silah Tüccarı</span>
</div>

</div>

<div class="menu-arrow left" onclick="slideMenu(-1)">‹</div>
<div class="menu-arrow right" onclick="slideMenu(1)">›</div>

</div>

`);

}

/* SLIDE FUNCTION */

let menuIndex = 0;

function slideMenu(dir){

const slider = document.getElementById("menuSlider");
const total = slider.children.length;

menuIndex += dir;

if(menuIndex < 0) menuIndex = 0;
if(menuIndex > total-1) menuIndex = total-1;

slider.style.transform =
"translateX(-" + (menuIndex * 220) + "px)";

}

function go(page){
 window.location.href = page;
}

/* INIT */

document.addEventListener("DOMContentLoaded",()=>{
 buildMenu();
});
