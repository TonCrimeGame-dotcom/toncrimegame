function injectMenu(){

document.body.insertAdjacentHTML("afterbegin",`
<div class="sidebar" id="sidebar">
  <h3 style="color:gold">Menü</h3>
  <p onclick="go('index.html')">🏠 Ana Sayfa</p>
  <p onclick="go('missions.html')">🎯 Görevler</p>
  <p onclick="go('nightclub.html')">🎵 Gece Kulübü</p>
  <p onclick="go('coffeeshop.html')">☕ Coffee Shop</p>
  <p onclick="go('mekan.html')">🏢 Mekan</p>
  <p onclick="go('weapons.html')">🔫 Silah Kaçakçısı</p>
  <p onclick="go('hospital.html')">🏥 Hastane</p>
</div>

<div class="overlay" id="overlay"></div>
`);

}

function openMenu(){
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("overlay").classList.add("show");
}

document.addEventListener("click",function(e){
  if(e.target.id==="overlay"){
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("overlay").classList.remove("show");
  }
});

function go(p){
  window.location.href=p;
}
