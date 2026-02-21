/* ===================================================
   TONCRIME RESOLVE ENGINE
   Match Result Authority
   =================================================== */

(function(){

const RESOLVE_TIMEOUT = 60; // saniye


/* ===================================================
   HASH VERIFY
   =================================================== */

function verifyHash(answer,time,hash){

  const raw = answer + "|" + time;

  let h=0;
  for(let i=0;i<raw.length;i++){
    h=((h<<5)-h)+raw.charCodeAt(i);
    h|=0;
  }

  return h.toString() === hash;
}


/* ===================================================
   FETCH MATCH ANSWERS
   =================================================== */

async function getAnswers(matchId){

  const { data, error } = await db
    .from("pvp_answers")
    .select("*")
    .eq("match_id",matchId);

  if(error){
    console.error(error);
    return [];
  }

  return data || [];
}


/* ===================================================
   DECIDE WINNER
   =================================================== */

function decideWinner(a,b){

  /* hash kontrol */
  if(!verifyHash(a.answer,a.time,a.hash)) return b.user_id;
  if(!verifyHash(b.answer,b.time,b.hash)) return a.user_id;

  /* doğru cevap kontrol */
  if(a.answer !== b.answer)
    return null; // soru motoru doğruyu kontrol eder

  /* süre kazanan */
  if(a.time < b.time) return a.user_id;
  if(b.time < a.time) return b.user_id;

  return null; // beraberlik
}


/* ===================================================
   UPDATE MATCH RESULT
   =================================================== */

async function finalize(matchId,winner){

  const payload = {
    status:"finished",
    winner_id:winner,
    finished_at:new Date().toISOString()
  };

  const { error } = await db
    .from("pvp_matches")
    .update(payload)
    .eq("id",matchId);

  if(error){
    console.error("Finalize error:",error);
    return;
  }

  console.log("🏆 Match finished:",winner);

  EVENT.emit("pvp:resolved",{matchId,winner});
}


/* ===================================================
   SOLO TIMEOUT CHECK
   =================================================== */

async function soloResolve(match){

  const created =
    new Date(match.created_at).getTime();

  const now = Date.now();

  if((now-created)/1000 < RESOLVE_TIMEOUT)
    return false;

  console.log("⌛ Solo timeout resolve");

  await finalize(match.id,match.player1_id);
  return true;
}


/* ===================================================
   MAIN RESOLVE
   =================================================== */

async function resolve(match){

  const answers = await getAnswers(match.id);

  /* SOLO */
  if(answers.length === 1){
    await soloResolve(match);
    return;
  }

  if(answers.length < 2) return;

  const winner =
    decideWinner(answers[0],answers[1]);

  await finalize(match.id,winner);
}


/* ===================================================
   REALTIME LISTENER
   =================================================== */

function subscribeResolve(){

  db.channel("resolve-engine")
    .on(
      "postgres_changes",
      {
        event:"INSERT",
        schema:"public",
        table:"pvp_answers"
      },
      async payload => {

        const matchId = payload.new.match_id;

        const { data } = await db
          .from("pvp_matches")
          .select("*")
          .eq("id",matchId)
          .single();

        if(!data) return;
        if(data.status==="finished") return;

        resolve(data);
      }
    )
    .subscribe();

  console.log("🧠 Resolve Engine Live");
}


/* ===================================================
   INIT
   =================================================== */

EVENT.on("engine:ready",subscribeResolve);

})();
