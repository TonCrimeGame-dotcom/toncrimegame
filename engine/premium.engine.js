/* ===================================================
   TONCRIME PREMIUM ENGINE (ECONOMY ACCESS MODEL)
=================================================== */

GAME.premium = {
  active:false
};

/* ================= LOAD PREMIUM ================= */

async function loadPremium(){

  const { data } = await db
    .from("users")
    .select("premium_until, level")
    .eq("id",CONFIG.USER_ID)
    .single();

  if(!data) return;

  if(!data.premium_until){
    GAME.premium.active=false;
    return;
  }

  const now = Date.now();
  const until =
    new Date(data.premium_until).getTime();

  GAME.premium.active = now < until;

  applyPremiumRules(data.level);
}

/* ================= RULES ================= */

function applyPremiumRules(level){

  /* withdraw erişimi */
  GAME.canWithdraw =
    GAME.premium.active || level >= 50;

  /* iş hayatı erişimi */
  GAME.canBusiness =
    GAME.premium.active || level >= 50;

}

/* ================= ENERGY SPEED ================= */

function getEnergyInterval(){

  if(GAME.premium.active)
    return CONFIG.ENERGY_INTERVAL * 0.7;

  return CONFIG.ENERGY_INTERVAL;
}

/* ================= CHECKERS ================= */

function canAccessBusiness(){
  return GAME.canBusiness === true;
}

function canWithdrawTON(){
  return GAME.canWithdraw === true;
}

/* ================= AUTO INIT ================= */

setTimeout(loadPremium,2000);
