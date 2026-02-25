/* ===================================================
   COMBAT ENGINE
=================================================== */

function calculatePower(user) {

  let base =
    user.level * 10 +
    user.xp * 0.5;

  GAME.inventory.forEach(i => {
    base += i.quantity * 2;
  });

  return Math.floor(base);
}

function battle(playerA, playerB) {

  const powerA = calculatePower(playerA);
  const powerB = calculatePower(playerB);

  const rollA = powerA + Math.random() * 20;
  const rollB = powerB + Math.random() * 20;

  return rollA > rollB ? "A" : "B";
}
