// engine/player.engine.js

const PlayerEngine = (function(){

  let player = JSON.parse(localStorage.getItem("player")) || {
    username: "Player01",
    energy: 60,
    maxEnergy: 100,
    xp: 0,
    xpMax: 1000,
    level: 1,
    yton: 1000
  };

  function save(){
    localStorage.setItem("player", JSON.stringify(player));
  }

  function addXP(amount){
    player.xp += amount;

    if(player.xp >= player.xpMax){
      player.xp = 0;
      player.level++;
      player.xpMax += 500; // her levelde xp artar
    }

    save();
  }

  function updateHUD(){

    // ENERJI
    document.getElementById("energyText").textContent =
      "⚡ " + player.energy + "/" + player.maxEnergy;

    document.getElementById("energyBar").style.width =
      (player.energy / player.maxEnergy * 100) + "%";

    // XP
    document.getElementById("xpText").textContent =
      "XP " + player.xp + "/" + player.xpMax + " (Lv " + player.level + ")";

    document.getElementById("xpBar").style.width =
      (player.xp / player.xpMax * 100) + "%";

    // YTON
    document.getElementById("ytonText").textContent = player.yton;
  }

  function getPlayer(){
    return player;
  }

  function init(){
    updateHUD();
  }

  return {
    init,
    addXP,
    getPlayer
  };

})();
