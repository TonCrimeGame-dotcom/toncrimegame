/* ===== ADVANCED REALTIME PVP SYSTEM ===== */

let currentMatch = null;
let myRole = null;
let questionIndex = 0;
let totalTime = 0;
let questionStart = 0;
let matchTimeout = null;

const questions = [
  {q:"5x5?",a:"25",options:["20","25","30","15"]},
  {q:"HTML ne?",a:"Web",options:["Web","Oyun","Virüs","Telefon"]},
  {q:"3^3?",a:"27",options:["9","27","18","81"]},
  {q:"Başkent?",a:"Ankara",options:["İzmir","Bursa","Ankara","Van"]},
  {q:"10/2?",a:"5",options:["2","5","8","6"]}
];

/* ===== MATCH ARAMA ===== */
async function findRealtimeMatch(){

  const user = await loadUser();

  const {data:waiting} = await db
    .from("pvp_matches")
    .select("*")
    .eq("status","waiting")
    .limit(1);

  if(waiting.length > 0){

    currentMatch = waiting[0];
    myRole = "player2";

    await db.from("pvp_matches")
      .update({
        player2:user.id,
        status:"active"
      })
      .eq("id",currentMatch.id);

    listenMatch();

  }else{

    const {data:newMatch} = await db.from("pvp_matches")
      .insert({
        player1:user.id,
        status:"waiting"
      })
      .select()
      .single();

    currentMatch = newMatch;
    myRole = "player1";

    listenMatch();

    // 10 saniye bekleme
    matchTimeout = setTimeout(()=>{
      startSoloMode();
    },10000);
  }
}

/* ===== REALTIME DINLEME ===== */
function listenMatch(){

  db.channel("match_"+currentMatch.id)
  .on("postgres_changes",{
      event:"UPDATE",
      schema:"public",
      table:"pvp_matches",
      filter:"id=eq."+currentMatch.id
  }, payload => {

      if(payload.new.status === "active"){
        clearTimeout(matchTimeout);
        startBattle();
      }

      if(payload.new.status === "solo_finished"){
        if(myRole === "player2"){
          startBattle();
        }
      }

      if(payload.new.status === "finished"){
        showResult(payload.new);
      }

  }).subscribe();
}

/* ===== SOLO MOD ===== */
async function startSoloMode(){

  await db.from("pvp_matches")
    .update({status:"solo"})
    .eq("id",currentMatch.id);

  startBattle();
}

/* ===== SORU SISTEMI ===== */
function startBattle(){
  questionIndex = 0;
  totalTime = 0;
  showQuestion();
}

function showQuestion(){

  if(questionIndex >= 5){
    finishBattle();
    return;
  }

  const q = questions[questionIndex];
  const shuffled = [...q.options].sort(()=>Math.random()-0.5);

  document.getElementById("pvpArea").innerHTML =
    `<h2>${q.q}</h2>` +
    shuffled.map(o =>
      `<button onclick="answer('${o}')">${o}</button>`
    ).join("<br><br>");

  questionStart = performance.now();
}

function answer(option){

  const q = questions[questionIndex];
  const timeSpent = performance.now() - questionStart;
  totalTime += timeSpent;

  if(option === q.a){
    currentMatch[myRole+"_score"] =
      (currentMatch[myRole+"_score"] || 0) + 1;
  }

  questionIndex++;
  showQuestion();
}

/* ===== MAÇ BİTİR ===== */
async function finishBattle(){

  const updateData = {};
  updateData[myRole+"_time"] = totalTime;
  updateData[myRole+"_score"] =
    currentMatch[myRole+"_score"] || 0;

  await db.from("pvp_matches")
    .update(updateData)
    .eq("id",currentMatch.id);

  await checkFinish();
}

async function checkFinish(){

  const {data} = await db.from("pvp_matches")
    .select("*")
    .eq("id",currentMatch.id)
    .single();

  // Solo durum
  if(data.status === "solo" && myRole === "player1"){

    await db.from("pvp_matches")
      .update({status:"solo_finished"})
      .eq("id",currentMatch.id);

    document.getElementById("pvpArea").innerHTML =
      "<h2>Süre Kaydedildi. Rakip bekleniyor...</h2>";
    return;
  }

  if(data.player1_time && data.player2_time){

    await db.from("pvp_matches")
      .update({status:"finished"})
      .eq("id",currentMatch.id);
  }
}

/* ===== SONUÇ ===== */
async function showResult(match){

  let winner;

  if(match.player1_score > match.player2_score){
    winner="player1";
  }else if(match.player2_score > match.player1_score){
    winner="player2";
  }else{
    winner =
      match.player1_time < match.player2_time
      ? "player1"
      : "player2";
  }

  const user = await loadUser();
  const myWin =
    (winner==="player1" && myRole==="player1") ||
    (winner==="player2" && myRole==="player2");

  processPvpResult(1000,myWin);

  document.getElementById("pvpArea").innerHTML =
    `<h2>Maç Bitti</h2>
     Kazanan: ${winner}<br>
     ${myWin ? "🎉 Kazandın!" : "💀 Kaybettin!"}`;
}
