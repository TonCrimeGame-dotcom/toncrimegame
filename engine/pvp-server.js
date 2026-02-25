/* ===================================================
   SERVER PVP CLIENT
   =================================================== */

const PVP_SERVER = {};

PVP_SERVER.endpoint =
"https://hwhscuyudwphnsipibpy.supabase.co/functions/v1/resolve-pvp";

/* SEND RESULT */

PVP_SERVER.finish = async function(matchId,time){

  await fetch(PVP_SERVER.endpoint,{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      match_id:matchId,
      user_id:CONFIG.USER_ID,
      time:time
    })
  });

  notify("Sonuç gönderildi ⚔️");
};
