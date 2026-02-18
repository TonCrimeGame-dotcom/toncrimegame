/* ===============================
        TONCRIME ENGINE v1
================================= */

const MAX_ENERGY = 100;
const ENERGY_REGEN_SECONDS = 60; // 1 enerji = 60 saniye

// Player yükle
let player = JSON.parse(localStorage.getItem("player"));

if (!player) {
  player = {
    level: 1,
    xp: 0,
    xpNext: 100,
    energy: 80,
    yton: 120,
    lastEnergyUpdate: Date.now()
  };
  savePlayer();
}

// Kaydet
function savePlayer() {
  localStorage.setItem("player", JSON.stringify(player));
}

// Enerji yenileme sistemi
function regenEnergy() {
  const now = Date.now();
  const diff = Math.floor((now - player.lastEnergyUpdate) / 1000);

  if (diff >= ENERGY_REGEN_SECONDS) {
    const gained = Math.floor(diff / ENERGY_REGEN_SECONDS);

    if (player.energy < MAX_ENERGY) {
      player.energy = Math.min(MAX_ENERGY, player.energy + gained);
      player.lastEnergyUpdate = now;
      savePlayer();
    }
  }
}

// XP sistemi
function addXP(amount) {
  player.xp += amount;

  while (player.xp >= player.xpNext) {
    player.xp -= player.xpNext;
    player.level++;
    player.xpNext = Math.floor(player.xpNext * 1.2);
  }

  savePlayer();
}

// YTon ekleme
function addYton(amount) {
  player.yton += amount;
  savePlayer();
}

// YTon azaltma
function removeYton(amount) {
  player.yton = Math.max(0, player.yton - amount);
  savePlayer();
}

// Enerji azaltma
function useEnergy(amount) {
  if (player.energy >= amount) {
    player.energy -= amount;
    savePlayer();
    return true;
  }
  return false;
}

// UI Güncelle
function updateUI() {
  regenEnergy();

  if (document.getElementById("lvl"))
    document.getElementById("lvl").innerText = player.level;

  if (document.getElementById("yton"))
    document.getElementById("yton").innerText = player.yton;

  if (document.getElementById("energy"))
    document.getElementById("energy").innerText = player.energy;

  if (document.getElementById("xpFill"))
    document.getElementById("xpFill").style.width =
      (player.xp / player.xpNext) * 100 + "%";

  if (document.getElementById("energyFill"))
    document.getElementById("energyFill").style.width =
      (player.energy / MAX_ENERGY) * 100 + "%";
}

// Otomatik UI güncelleme
setInterval(updateUI, 1000);
updateUI();
