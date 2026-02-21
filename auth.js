/* ===================================================
   TONCRIME AUTH LAYER
   =================================================== */

const AUTH = {
  token:null,
  deviceHash:null
};

/* ---------- DEVICE FINGERPRINT ---------- */

AUTH.createFingerprint = async function(){

  const raw =
    navigator.userAgent +
    screen.width +
    screen.height +
    navigator.language +
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw)
  );

  AUTH.deviceHash =
    Array.from(new Uint8Array(buffer))
    .map(b=>b.toString(16).padStart(2,"0"))
    .join("");

  return AUTH.deviceHash;
};

/* ---------- TOKEN GENERATE ---------- */

AUTH.generateToken = function(){

  return crypto.randomUUID() +
         "-" +
         Date.now();
};

/* ---------- REGISTER SESSION ---------- */

AUTH.registerSession = async function(){

  const hash = await AUTH.createFingerprint();

  const token = AUTH.generateToken();

  AUTH.token = token;

  await db.from("user_sessions")
    .insert({
      user_id:CONFIG.USER_ID,
      device_hash:hash,
      session_token:token
    });

  localStorage.setItem("tc_token",token);
};

/* ---------- VALIDATE ---------- */

AUTH.validate = async function(){

  let token = localStorage.getItem("tc_token");

  if(!token){
    await AUTH.registerSession();
    return true;
  }

  const {data} = await db
    .from("user_sessions")
    .select("*")
    .eq("session_token",token)
    .maybeSingle();

  if(!data){
    await AUTH.registerSession();
  }else{
    AUTH.token=token;

    await db.from("user_sessions")
      .update({last_seen:new Date()})
      .eq("id",data.id);
  }

  return true;
};
