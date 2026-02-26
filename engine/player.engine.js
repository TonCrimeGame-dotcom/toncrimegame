/* =========================
   GLOBAL PLAYER ENGINE
========================= */

(function(){

  function createDefaultPlayer(){
    return {
      energy: 60,
      maxEnergy: 100,
      xp: 0,
      xpMax: 1000,
      level: 1,
      yton: 1000,
      weapon: {
        name: "Tabanca",
        bonus: 0.10
      }
    };
  }

  function loadPlayer(){
    let data = JSON.parse(localStorage.getItem("player"));

    if(!data) data = createDefaultPlayer();

    data.energy = Number(data.energy ?? 60);
    data.maxEnergy = 100;
    data.xp = Number(data.xp ?? 0);
    data.xpMax = Number(data.xpMax ?? 1000);
    data.level = Number(data.level ?? 1);
    data.yton = Number(data.yton ?? 1000);
    data.weapon = data.weapon ?? { name:"Tabanca", bonus:0.10 };

    return data;
  }

  function savePlayer(){
    localStorage.setItem("player", JSON.stringify(window.player));
  }

  function updateHUD(){

    const energyText = document.getElementById("energyText");
    const xpText = document.getElementById("xpText");
    const ytonText = document.getElementById("ytonText");

    if(energyText)
      energyText.innerText = `⚡ ${player.energy}/${player.maxEnergy}`;

    if(xpText)
      xpText.innerText = `XP ${player.xp}/${player.xpMax} (Lv ${player.level})`;

    if(ytonText)
      ytonText.innerText = player.yton;

    const energyBar = document.getElementById("energyBar");
    const xpBar = document.getElementById("xpBar");

    if(energyBar)
      energyBar.style.width = (player.energy/player.maxEnergy*100)+"%";

    if(xpBar)
      xpBar.style.width = (player.xp/player.xpMax*100)+"%";
  }

  /* ENERGY TIMER */
  setInterval(()=>{
    if(window.player.energy < window.player.maxEnergy){
      window.player.energy++;
      savePlayer();
      updateHUD();
    }
  },300000);

  /* INIT */
  window.player = loadPlayer();
  window.savePlayer = savePlayer;
  window.updateHUD = updateHUD;

})();
