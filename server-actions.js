/* ===================================================
   TONCRIME SERVER ACTION CLIENT
   =================================================== */

const SERVER = {};

SERVER.endpoint =
"https://hwhscuyudwphnsipibpy.supabase.co/functions/v1/resolve-action";

/* ---------- SEND ACTION ---------- */

SERVER.run = async function(action){

  const res = await fetch(SERVER.endpoint,{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      user_id:CONFIG.USER_ID,
      action
    })
  });

  if(!res.ok){
    notify("İşlem başarısız","error");
    return;
  }

  const data = await res.json();

  /* ENGINE SYNC */
  GAME.user.energy = data.energy;
  GAME.user.xp = data.xp;
  GAME.user.yton = data.yton;
  GAME.user.level = data.level;

  renderStats();

  notify("İşlem tamamlandı","success");
};
