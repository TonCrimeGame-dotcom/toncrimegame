/* ===================================================
   TONCRIME ELO ENGINE
   Ranking & League System
   =================================================== */

(function(){

const K_FACTOR = 32;


/* ===================================================
   EXPECTED SCORE
   =================================================== */

function expected(rA,rB){
  return 1/(1+Math.pow(10,(rB-rA)/400));
}


/* ===================================================
   CALCULATE NEW ELO
   =================================================== */

function calcElo(rating,expectedScore,score){
  return Math.round(
    rating + K_FACTOR * (score-expectedScore)
  );
}


/* ===================================================
   LEAGUE SYSTEM
   =================================================== */

function getLeague(elo){

  if(elo < 800) return "Bronze";
  if(elo < 1200) return "Silver";
  if(elo < 1600) return "Gold";
  if(elo < 2000) return "Platinum";
  if(elo < 2400) return "Diamond";

  return "Legend";
}


/* ===================================================
   LOAD USERS
   =================================================== */

async function getUsers(a,b){

  const { data } = await db
    .from("users")
    .select("*")
    .in("id",[a,b]);

  if(!data || data.length<2) return null;

  return {
    A:data.find(u=>u.id===a),
    B:data.find(u=>u.id===b)
  };
}


/* ===================================================
   SAVE USERS
   =================================================== */

async function saveUser(user){

  await db
    .from("users")
    .update({
      elo:user.elo,
      league:user.league
    })
    .eq("id",user.id);
}


/* ===================================================
   APPLY ELO RESULT
   =================================================== */

async function applyElo(matchId,winnerId){

  const { data:match } = await db
    .from("pvp_matches")
    .select("*")
    .eq("id",matchId)
    .single();

  if(!match) return;

  const users =
    await getUsers(match.player1_id,
                   match.player2_id);

  if(!users) return;

  const A = users.A;
  const B = users.B;

  const rA = A.elo || 1000;
  const rB = B.elo || 1000;

  const eA = expected(rA,rB);
  const eB = expected(rB,rA);

  let sA=0.5, sB=0.5;

  if(winnerId===A.id){
    sA=1; sB=0;
  }
  else if(winnerId===B.id){
    sA=0; sB=1;
  }

  A.elo = calcElo(rA,eA,sA);
  B.elo = calcElo(rB,eB,sB);

  A.league = getLeague(A.elo);
  B.league = getLeague(B.elo);

  await saveUser(A);
  await saveUser(B);

  console.log("🏆 ELO Updated",A.elo,B.elo);

  EVENT.emit("elo:updated",{
    A,B,matchId
  });
}


/* ===================================================
   EVENT LISTENER
   =================================================== */

EVENT.on("pvp:resolved",async payload=>{

  if(!payload) return;

  await applyElo(
    payload.matchId,
    payload.winner
  );

});


console.log("🏆 ELO Engine Ready");

})();
