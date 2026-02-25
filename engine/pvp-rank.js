/* ===== PvP RANK SYSTEM ===== */

function calculateRankChange(playerRank, opponentRank, won){

  const K = 32;

  const expected = 1 / (1 + Math.pow(10, (opponentRank - playerRank) / 400));

  const score = won ? 1 : 0;

  return Math.round(K * (score - expected));
}

async function processPvpResult(opponentRank, won){

  const user = await loadUser();
  if(!user) return;

  const change = calculateRankChange(user.pvp_rank, opponentRank, won);

  let newRank = user.pvp_rank + change;
  if(newRank < 0) newRank = 0;

  let wins = user.pvp_wins || 0;
  let losses = user.pvp_losses || 0;

  if(won) wins++;
  else losses++;

  await db.from("users").update({
    pvp_rank: newRank,
    pvp_wins: wins,
    pvp_losses: losses
  }).eq("id", user.id);

  showRankPopup(change, newRank);
}

function getRankTitle(rank){

  if(rank < 1000) return "🥉 Sokak";
  if(rank < 1500) return "🥈 Çete";
  if(rank < 2000) return "🥇 Mafya";
  return "👑 Baba";
}

function showRankPopup(change, newRank){

  const box = document.createElement("div");
  box.style.position="fixed";
  box.style.top="50%";
  box.style.left="50%";
  box.style.transform="translate(-50%,-50%)";
  box.style.background="#111";
  box.style.padding="30px";
  box.style.borderRadius="12px";
  box.style.border="2px solid red";
  box.style.zIndex="9999";
  box.style.textAlign="center";

  const sign = change >= 0 ? "+" : "";

  box.innerHTML = `
    <h2>⚔ PvP Sonuç</h2>
    Rank Değişimi: ${sign}${change}<br>
    Yeni Rank: ${newRank}<br>
    Lig: ${getRankTitle(newRank)}
    <br><br>
    <button onclick="this.parentElement.remove()">Tamam</button>
  `;

  document.body.appendChild(box);
    }
