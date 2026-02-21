/* ========== GLOBAL SYSTEM ========== */

function injectGlobalInfo(){

  const topbar = document.querySelector(".topbar");
  if(!topbar) return;

  const infoDiv = document.createElement("div");
  infoDiv.id = "globalInfo";
  infoDiv.style.fontSize = "12px";
  infoDiv.style.textAlign = "right";
  infoDiv.style.marginLeft = "20px";

  topbar.appendChild(infoDiv);

  updateGlobalInfo();
  updateClock();
  updateResetTimer();
  checkDailyReset();

  setInterval(updateGlobalInfo,10000);
  setInterval(updateClock,1000);
  setInterval(updateResetTimer,1000);
  setInterval(checkDailyReset,60000);
}

/* ===== RESET KONTROL ===== */
async function checkDailyReset(){

  const user = await loadUser();
  if(!user) return;

  const today = new Date().toISOString().split("T")[0];

  if(user.last_daily_reset !== today){

    await db.from("users").update({
      last_daily_reset: today,
      daily_missions: 0,
      daily_pvp: 0,
      daily_bonus_claimed: false,
      stock: 0   // mekan reset
    }).eq("id", user.id);

    console.log("Günlük reset yapıldı");
  }
}

/* ===== GLOBAL STATS ===== */
async function updateGlobalInfo(){

  if(typeof db === "undefined") return;

  const {data:users} = await db.from("users").select("yton,last_active");

  if(!users) return;

  const now = Date.now();
  let online = 0;
  let totalYton = 0;

  users.forEach(u=>{
    totalYton += Number(u.yton || 0);
    if(u.last_active && (now - new Date(u.last_active).getTime()) < 5*60*1000){
      online++;
    }
  });

  const el = document.getElementById("globalInfo");
  if(!el) return;

  el.innerHTML =
  `
  📅 <span id="dateNow"></span><br>
  🟢 Online: ${online} / ${users.length}<br>
  💰 Ekonomi: ${totalYton.toFixed(2)} Yton<br>
  ⏳ Reset: <span id="resetTimer"></span>
  `;
}

/* ===== SAAT ===== */
function updateClock(){

  const now = new Date();

  const dateStr =
    now.getDate().toString().padStart(2,"0") + "." +
    (now.getMonth()+1).toString().padStart(2,"0") + "." +
    now.getFullYear() + " " +
    now.getHours().toString().padStart(2,"0") + ":" +
    now.getMinutes().toString().padStart(2,"0") + ":" +
    now.getSeconds().toString().padStart(2,"0");

  const el = document.getElementById("dateNow");
  if(el) el.innerText = dateStr;
}

/* ===== RESET SAYACI ===== */
function updateResetTimer(){

  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setHours(24,0,0,0);

  const diff = tomorrow - now;

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const el = document.getElementById("resetTimer");
  if(el){
    el.innerText =
      hours.toString().padStart(2,"0") + ":" +
      minutes.toString().padStart(2,"0") + ":" +
      seconds.toString().padStart(2,"0");
  }
}

/* ===== AKTİFLİK ===== */
async function updateLastActive(){
  const user = await loadUser();
  if(!user) return;

  await db.from("users").update({
    last_active: new Date()
  }).eq("id", user.id);
}
