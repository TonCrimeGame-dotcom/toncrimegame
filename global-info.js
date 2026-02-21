/* ========== GLOBAL INFO PANEL ========== */

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
  setInterval(updateGlobalInfo,10000);
  setInterval(updateClock,1000);
}

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

  document.getElementById("globalInfo").innerHTML =
  `
  📅 <span id="dateNow"></span><br>
  🟢 Online: ${online} / ${users.length}<br>
  💰 Toplam Ekonomi: ${totalYton.toFixed(2)} Yton
  `;
}

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

/* Kullanıcı aktiflik güncelle */
async function updateLastActive(){
  const user = await loadUser();
  if(!user) return;

  await db.from("users").update({
    last_active: new Date()
  }).eq("id", user.id);
}
