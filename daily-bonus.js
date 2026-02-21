/* ===== DAILY LOGIN BONUS ===== */

async function checkDailyBonus(){

  const user = await loadUser();
  if(!user) return;

  const today = new Date().toISOString().split("T")[0];

  if(user.last_login_date === today){
    return; // bugün zaten almış
  }

  // streak kontrol
  let streak = user.login_streak || 0;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate()-1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if(user.last_login_date === yesterdayStr){
    streak += 1;
  }else{
    streak = 1;
  }

  let bonusYton = 20;
  let bonusXp = 10;

  if(streak >= 7){
    bonusYton += 50;
  }

  await updateUser({
    yton: bonusYton,
    xp: bonusXp
  });

  await db.from("users").update({
    login_streak: streak,
    last_login_date: today,
    daily_bonus_claimed: true
  }).eq("id", user.id);

  showDailyBonusPopup(bonusYton, bonusXp, streak);
}

/* ===== BONUS POPUP ===== */
function showDailyBonusPopup(yton, xp, streak){

  const box = document.createElement("div");
  box.style.position="fixed";
  box.style.top="50%";
  box.style.left="50%";
  box.style.transform="translate(-50%,-50%)";
  box.style.background="#111";
  box.style.padding="30px";
  box.style.borderRadius="12px";
  box.style.border="2px solid gold";
  box.style.zIndex="9999";
  box.style.textAlign="center";

  box.innerHTML = `
    <h2>🎁 Günlük Bonus</h2>
    +${yton} Yton<br>
    +${xp} XP<br><br>
    🔥 Streak: ${streak} Gün
    <br><br>
    <button onclick="this.parentElement.remove()">Tamam</button>
  `;

  document.body.appendChild(box);
}
