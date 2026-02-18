/* ========= TONCRIME ENGINE ========= */

const MAX_ENERGY = 100;
const ENERGY_REGEN_SECONDS = 60; // 1 enerji = 60 saniye

let player = JSON.parse(localStorage.getItem("player"));

if(!player){
  player = {
    level:1,
    xp:0,
    xpNext:100,
    energy:80,
    yton:120,
    premium:false,
    hospitalUntil:0,
    lastEnergyTick: Date.now()
  };
  savePlayer();
}

/* ===== SAVE ===== */
function savePlayer(){
  localStorage.setItem("player", JSON.stringify(player));
}

/* ===== ENERGY USE ===== */
function useEnergy(amount){
  if(player.energy < amount) return false;

  player.energy -= amount;
  player.lastEnergyTick = Date.now();
  savePlayer();
  return true;
}

/* ===== ENERGY REGEN ===== */
function regenerateEnergy(){

  const now = Date.now();

  if(player.energy >= MAX_ENERGY){
    player.lastEnergyTick = now;
    return;
  }

  const diff = Math.floor((now - player.lastEnergyTick) / 1000);

  if(diff >= ENERGY_REGEN_SECONDS){

    const gained = Math.floor(diff / ENERGY_REGEN_SECONDS);

    player.energy = Math.min(MAX_ENERGY, player.energy + gained);

    player.lastEnergyTick += gained * ENERGY_REGEN_SECONDS * 1000;

    savePlayer();
  }
}

/* ===== AUTO LOOP ===== */
setInterval(()=>{
  regenerateEnergy();
},1000);
