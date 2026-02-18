/* ========= TONCRIME ENGINE ========= */

const MAX_ENERGY = 100;
const ENERGY_REGEN_SECONDS = 60; // 1 enerji = 60 saniye

let player = JSON.parse(localStorage.getItem("player")) || {
  level: 1,
  xp: 0,
  xpNext: 100,
  energy: 80,
  yton: 120,
  premium: false,
  hospitalUntil: 0,
  lastEnergyTick: Date.now()
};

/* ===== SAVE ===== */
function savePlayer(){
  localStorage.setItem("player", JSON.stringify(player));
}

/* ===== XP ===== */
function addXP(amount){
  player.xp += amount;

  while(player.xp >= player.xpNext){
    player.xp -= player.xpNext;
    player.level++;
    player.xpNext = Math.floor(player.xpNext * 1.25);
  }

  savePlayer();
}

/* ===== YTON ===== */
function addYton(amount){
  player.yton += amount;
  savePlayer();
}

function removeYton(amount){
  player.yton = Math.max(0, player.yton - amount);
  savePlayer();
}

/* ===== ENERGY ===== */
function useEnergy(amount){
  if(player.energy < amount) return false;

  player.energy -= amount;
  player.lastEnergyTick = Date.now(); // regen başlangıcı
  savePlayer();
  return true;
}

/* ===== ENERGY REGEN SYSTEM ===== */
function regenerateEnergy(){

  if(player.energy >= MAX_ENERGY) return;

  const now = Date.now();
  const secondsPassed = Math.floor((now - player.lastEnergyTick) / 1000);

  if(secondsPassed >= ENERGY_REGEN_SECONDS){

    const energyToAdd = Math.floor(secondsPassed / ENERGY_REGEN_SECONDS);

    player.energy = Math.min(MAX_ENERGY, player.energy + energyToAdd);

    player.lastEnergyTick += energyToAdd * ENERGY_REGEN_SECONDS * 1000;

    savePlayer();
  }
}

/* ===== LOOP ===== */
setInterval(()=>{
  regenerateEnergy();
}, 1000);
