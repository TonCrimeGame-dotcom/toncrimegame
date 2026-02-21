/* ===================================================
   TONCRIME GLOBAL ENGINE
   =================================================== */

/* ---------- SUPABASE ---------- */

const db = window.supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_KEY
);

/* ---------- GLOBAL STATE ---------- */

const GAME = {
  user: null,
  pvpSubscribed: false,
  loading: false
};

/* ===================================================
   USER LOAD
   =================================================== */

async function loadUser() {

  if (GAME.loading) return GAME.user;
  GAME.loading = true;

  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("id", CONFIG.USER_ID)
    .single();

  if (error) {
    console.error("User load error:", error);
    GAME.loading = false;
    return null;
  }

  GAME.user = data;
  GAME.loading = false;
  return data;
}

/* ===================================================
   ENERGY REGEN SYSTEM
   =================================================== */

async function regenEnergy() {

  const user = GAME.user;
  if (!user) return;

  const now = Date.now();

  /* first login fix */
  if (!user.last_energy_tick) {

    await db.from("users")
      .update({ last_energy_tick: now })
      .eq("id", user.id);

    user.last_energy_tick = now;
    return;
  }

  const diff = now - user.last_energy_tick;
  const gain = Math.floor(diff / CONFIG.ENERGY_INTERVAL);

  if (gain <= 0) return;
  if (user.energy >= CONFIG.MAX_ENERGY) return;

  const newEnergy = Math.min(
    CONFIG.MAX_ENERGY,
    user.energy + gain
  );

  const newTick =
    user.last_energy_tick +
    gain * CONFIG.ENERGY_INTERVAL;

  const { error } = await db
    .from("users")
    .update({
      energy: newEnergy,
      last_energy_tick: newTick
    })
    .eq("id", user.id);

  if (!error) {
    user.energy = newEnergy;
    user.last_energy_tick = newTick;
  }
}

/* ===================================================
   UI RENDER
   =================================================== */

function renderStats() {

  const u = GAME.user;
  if (!u) return;

  const statsEl = document.getElementById("stats");
  const xpBar = document.getElementById("xpBar");
  const energyBar = document.getElementById("energyBar");

  if (statsEl) {
    statsEl.innerHTML =
      `Lv ${u.level} | XP ${u.xp}/${CONFIG.XP_LIMIT}
       | ⚡ ${u.energy} | 💰 ${Number(u.yton).toFixed(2)}`;
  }

  if (xpBar)
    xpBar.style.width =
      (u.xp / CONFIG.XP_LIMIT * 100) + "%";

  if (energyBar)
    energyBar.style.width =
      (u.energy / CONFIG.MAX_ENERGY * 100) + "%";
}

/* ===================================================
   DAILY RESET SYSTEM
   =================================================== */

function dailyReset() {

  const today = new Date().toDateString();
  const saved = localStorage.getItem("tc_daily_reset");

  if (saved === today) return;

  localStorage.setItem("tc_daily_reset", today);

  console.log("✔ Daily reset executed");
}

/* ===================================================
   PVP REALTIME SUBSCRIBE
   =================================================== */

function subscribePvP() {

  if (GAME.pvpSubscribed) return;

  GAME.pvpSubscribed = true;

  db.channel("pvp-live")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "pvp_matches"
      },
      payload => {
        console.log("PvP Update:", payload.new);
      }
    )
    .subscribe();
}

/* ===================================================
   GAME LOOP (SAFE LOOP)
   =================================================== */

async function gameLoop() {

  await regenEnergy();
  renderStats();
}

/* ===================================================
   INIT GAME
   =================================================== */

async function initGame() {

  const user = await loadUser();
  if (!user) return;

  renderStats();
  dailyReset();
  subscribePvP();

  /* MAIN LOOP — 60s */
  setInterval(gameLoop, 60000);
}

/* ===================================================
   START ENGINE
   =================================================== */

document.addEventListener(
  "DOMContentLoaded",
  initGame
);
