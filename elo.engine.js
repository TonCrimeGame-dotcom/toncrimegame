/* ===================================================
   TONCRIME ELO / RANK SYSTEM
=================================================== */

GAME.rank = {
  K_FACTOR: 32
};

/* ================= LEAGUES ================= */

const LEAGUES = [
  { name:"Bronze", min:0 },
  { name:"Silver", min:800 },
  { name:"Gold", min:1200 },
  { name:"Platinum", min:1600 },
  { name:"Diamond", min:2000 },
  { name:"Master", min:2500 }
];

/* ================= GET LEAGUE ================= */

function getLeague(score){

  let league = LEAGUES[0];

  for(const l of LEAGUES){
    if(score >= l.min)
      league = l;
  }

  return league.name;
}

/* ================= EXPECTED WIN ================= */

function expectedScore(player, opponent){

  return 1 / (
    1 + Math.pow(
      10,
      (opponent - player) / 400
    )
  );
}

/* ================= CALCULATE ELO ================= */

function calculateElo(playerScore, opponentScore, win){

  const expected =
    expectedScore(playerScore, opponentScore);

  const result = win ? 1 : 0;

  const newScore =
    playerScore +
    GAME.rank.K_FACTOR *
    (result - expected);

  return Math.round(newScore);
}

/* ================= APPLY RESULT ================= */

async function applyMatchResult({
  playerId,
  opponentScore,
  win
}){

  secureAction(); // anti cheat hook

  const { data:user } = await db
    .from("users")
    .select("*")
    .eq("id", playerId)
    .single();

  if(!user) return;

  const current = user.rank_score || 1000;

  const newScore =
    calculateElo(
      current,
      opponentScore,
      win
    );

  const newLeague =
    getLeague(newScore);

  await db.from("users")
    .update({
      rank_score:newScore,
      league:newLeague
    })
    .eq("id",playerId);

  GAME.user.rank_score = newScore;
  GAME.user.league = newLeague;

  console.log(
    "Rank Updated:",
    newScore,
    newLeague
  );
}
