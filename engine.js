/* ========= TONCRIME CORE ========= */

const MAX_ENERGY = 100;
const ENERGY_REGEN_SECONDS = 60;

function getPlayer() {
  return JSON.parse(localStorage.getItem("player"));
}

function setPlayer(p) {
  localStorage.setItem("player", JSON.stringify(p));
}

let player = getPlayer();

if (!player) {
  player = {
    level: 1,
    xp: 0,
    xpNext: 100,
    energy: 80,
    yton: 120,
    premium: false,
    hospitalUntil: 0,
    lastEnergyTick: Date.now()
  };
  setPlayer(player);
}

/* ===== ENERGY REGEN ===== */
function regenerateEnergy() {

  let p = getPlayer();
  const now = Date.now();

  if (!p.lastEnergyTick) {
    p.lastEnergyTick = now;
    setPlayer(p);
    return;
  }

  if (p.energy >= MAX_ENERGY) return;

  const secondsPassed = Math.floor((now - p.lastEnergyTick) / 1000);

  if (secondsPassed >= ENERGY_REGEN_SECONDS) {

    const gained = Math.floor(secondsPassed / ENERGY_REGEN_SECONDS);

    p.energy = Math.min(MAX_ENERGY, p.energy + gained);

    p.lastEnergyTick += gained * ENERGY_REGEN_SECONDS * 1000;

    setPlayer(p);
  }
}

function useEnergy(amount) {

  let p = getPlayer();

  if (p.energy < amount) return false;

  p.energy -= amount;
  p.lastEnergyTick = Date.now();

  setPlayer(p);
  return true;
}

/* ===== GLOBAL LOOP ===== */
setInterval(regenerateEnergy, 1000);
