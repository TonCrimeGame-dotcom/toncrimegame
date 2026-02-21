/* ================= GAME CORE ================= */

const SUPABASE_URL="https://hwhscuyudwphnsipibpy.supabase.co";
const SUPABASE_KEY="sb_publishable_dItLcV8z83CvDWuR8nTabA_ImTHGETu";

const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const MAX_ENERGY=100;
const XP_LIMIT=100;
const ENERGY_INTERVAL=5*60*1000;

/* USER LOAD */
async function loadUser(){
  const id=localStorage.getItem("tc_user");
  if(!id){
    window.location.href="index.html";
    return null;
  }

  const {data}=await db.from("users")
  .select("*")
  .eq("id",id)
  .maybeSingle();

  if(!data){
    window.location.href="index.html";
    return null;
  }

  return data;
}

/* ENERGY REGEN */
async function regenEnergy(user){
  const now=Date.now();

  if(!user.last_energy_tick){
    await db.from("users")
    .update({last_energy_tick:now})
    .eq("id",user.id);
    user.last_energy_tick=now;
  }

  const diff=now-user.last_energy_tick;
  const add=Math.floor(diff/ENERGY_INTERVAL);

  if(add>0 && user.energy<MAX_ENERGY){

    let newEnergy=Math.min(MAX_ENERGY,user.energy+add);
    let newTick=user.last_energy_tick+(add*ENERGY_INTERVAL);

    await db.from("users").update({
      energy:newEnergy,
      last_energy_tick:newTick
    }).eq("id",user.id);

    user.energy=newEnergy;
    user.last_energy_tick=newTick;
  }

  return user;
}

/* UPDATE USER */
async function updateUser(change){

  const user=await loadUser();
  if(!user) return null;

  let newEnergy=user.energy+(change.energy||0);
  let newXp=user.xp+(change.xp||0);
  let newYton=user.yton+(change.yton||0);
  let newLevel=user.level;

  if(newEnergy>MAX_ENERGY) newEnergy=MAX_ENERGY;
  if(newEnergy<0) newEnergy=0;

  if(newXp>=XP_LIMIT){
    newXp=newXp-XP_LIMIT;
    newLevel=newLevel+1;
  }

  await db.from("users").update({
    energy:newEnergy,
    xp:newXp,
    yton:newYton,
    level:newLevel
  }).eq("id",user.id);

  return {
    ...user,
    energy:newEnergy,
    xp:newXp,
    yton:newYton,
    level:newLevel
  };
}

/* RENDER STATS */
function renderStats(user){

  if(document.getElementById("stats")){
    document.getElementById("stats").innerHTML=
    `Lv ${user.level} | XP ${user.xp}/${XP_LIMIT} | ⚡ ${user.energy} | 💰 ${user.yton}`;
  }

  if(document.getElementById("xpBar")){
    document.getElementById("xpBar").style.width=
    (user.xp/XP_LIMIT*100)+"%";
  }

  if(document.getElementById("energyBar")){
    document.getElementById("energyBar").style.width=
    (user.energy/MAX_ENERGY*100)+"%";
  }
}

/* AUTO INIT */
async function initCore(){
  let user=await loadUser();
  if(!user) return;
  user=await regenEnergy(user);
  renderStats(user);
}
