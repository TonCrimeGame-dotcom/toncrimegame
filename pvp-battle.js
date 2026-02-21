/* ===== TIME BASED PVP SYSTEM ===== */

let currentMatch = null;
let questionIndex = 0;
let totalTime = 0;
let questionStart = 0;

const questions = [
  {
    q: "Türkiye'nin başkenti?",
    a: "Ankara",
    options: ["Ankara","İstanbul","İzmir","Bursa"]
  },
  {
    q: "5 x 6 kaçtır?",
    a: "30",
    options: ["25","30","35","40"]
  },
  {
    q: "Dünyanın en büyük okyanusu?",
    a: "Pasifik",
    options: ["Atlas","Hint","Pasifik","Arktik"]
  },
  {
    q: "HTML ne için kullanılır?",
    a: "Web yapımı",
    options: ["Oyun motoru","Web yapımı","Veritabanı","Antivirüs"]
  },
  {
    q: "2 üzeri 5 kaçtır?",
    a: "32",
    options: ["16","32","64","24"]
  }
];

async function startMatch(matchId){

  const {data} = await db.from("pvp_matches")
  .select("*")
  .eq("id",matchId)
  .single();

  currentMatch = data;
  questionIndex = 0;
  totalTime = 0;

  showQuestion();
}

function showQuestion(){

  if(questionIndex >= 5){
    finishMatch();
    return;
  }

  const question = questions[questionIndex];

  let shuffled = [...question.options].sort(()=>Math.random()-0.5);

  document.getElementById("pvpArea").innerHTML = `
    <h2>Soru ${questionIndex+1}/5</h2>
    <p>${question.q}</p>
    ${shuffled.map(opt =>
      `<button onclick="answer('${opt}')">${opt}</button>`
    ).join("<br><br>")}
  `;

  questionStart = performance.now();
}

function answer(option){

  const question = questions[questionIndex];

  const timeSpent = performance.now() - questionStart;
  totalTime += timeSpent;

  if(option === question.a){
    currentMatch.player1_score++;
  }

  questionIndex++;
  showQuestion();
}

async function finishMatch(){

  const user = await loadUser();

  await db.from("pvp_matches").update({
    player1_time: totalTime,
    player1_score: currentMatch.player1_score,
    status:"finished"
  }).eq("id", currentMatch.id);

  document.getElementById("pvpArea").innerHTML =
    `<h2>Maç Bitti</h2>
     Toplam Süre: ${(totalTime/1000).toFixed(2)} saniye
     <br><br>Rakip sonucu bekleniyor...`;
}
