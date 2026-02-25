/* ===================================================
   TONCRIME GAME CORE
   Economy + XP + Energy Controller
   =================================================== */

const CORE = {};

/* ================= UPDATE PLAYER ================= */

CORE.updatePlayer = async function(change){

  const user = GAME.user;
  if(!user) return;

  let energy = user.energy + (change.energy || 0);
  let xp     = user.xp + (change.xp || 0);
  let yton   = Number(user.yton) + (change.yton || 0);
  let level  = user.level;

  /* ENERGY LIMIT */
  energy = Math.max(0, Math.min(CONFIG.MAX_ENERGY, energy));

  /* LEVEL SYSTEM */
  while(xp >= CONFIG.XP_LIMIT){
    xp -= CONFIG.XP_LIMIT;
    level++;
  }

  const {error} = await db
    .from("users")
    .update({
      energy,
      xp,
      yton,
      level
    })
    .eq("id", user.id);

  if(error){
    console.error("Player update error",error);
    return;
  }

  /* LOCAL UPDATE */
  user.energy = energy;
  user.xp = xp;
  user.yton = yton;
  user.level = level;

  renderStats();
};

/* ================= HELPERS ================= */

CORE.addXP = xp =>
  CORE.updatePlayer({xp});

CORE.addYton = yton =>
  CORE.updatePlayer({yton});

CORE.useEnergy = energy =>
  CORE.updatePlayer({energy:-energy});

/* ================= REWARD ================= */

CORE.reward = function({xp=0,yton=0,energy=0}){

  CORE.updatePlayer({
    xp,
    yton,
    energy
  });
};
