/* =========================
   TONCRIME PLAYER ENGINE
========================= */

const PlayerEngine = (function(){

let player = JSON.parse(localStorage.getItem("player")) || {
  username: "Player01",
  energy: 30,
  maxEnergy: 100,
  xp: 120,
  maxXP: 1000,
  level: 1,
  yton: 1000,
  lastEnergyTime: Date.now()
};

function save(){
  localStorage.setItem("player", JSON.stringify(player));
}

/* =========================
   ENERJI REGEN (5 DK)
========================= */
function regenEnergy(){
  const now = Date.now();
  const diff = now - player.lastEnergyTime;

  if(diff >= 300000){ // 5 dakika
    if(player.energy < player.maxEnergy){
      player.energy += 1;
      player.lastEnergyTime = now;
      save();
    }
  }
}

/* =========================
   XP EKLEME
========================= */
function addXP(amount){
  player.xp += amount;

  if(player.xp >= player.maxXP){
    player.level++;
    player.xp = player.xp - player.maxXP;
  }

  save();
}

/* =========================
   UI UPDATE
========================= */
function updateUI(){

  // Enerji
  const energyText = document.getElementById("energyText");
  const energyBar = document.getElementById("energyBar");

  if(energyText){
    energyText.textContent = "⚡ " + player.energy + "/" + player.maxEnergy;
  }

  if(energyBar){
    energyBar.style.width =
      (player.energy / player.maxEnergy * 100) + "%";
  }

  // XP
  const xpText = document.getElementById("xpText");
  const xpBar = document.getElementById("xpBar");

  if(xpText){
    xpText.textContent = 
      "XP " + player.xp + "/" + player.maxXP + " (Lv " + player.level + ")";
  }

  if(xpBar){
    xpBar.style.width =
      (player.xp / player.maxXP * 100) + "%";
  }

  // YTON
  const ytonText = document.getElementById("ytonText");
  if(ytonText){
    ytonText.textContent = player.yton;
  }
}

/* =========================
   AUTO LOOP
========================= */
setInterval(function(){
  regenEnergy();
  updateUI();
}, 1000);

return {
  getPlayer: () => player,
  addXP: addXP,
  save: save,
  updateUI: updateUI
};

})();
