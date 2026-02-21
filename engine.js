/* ===================================================
   TONCRIME GLOBAL ENGINE v2
   FULL CORE SYSTEM
=================================================== */

/* ================= CONFIG ================= */

const CONFIG = {
  SUPABASE_URL:
    "https://hwhscuyudwphnsipibpy.supabase.co",

  SUPABASE_KEY:
    "sb_publishable_dItLcV8z83CvDWuR8nTabA_ImTHGETu",

  USER_ID: "591676206",

  MAX_ENERGY: 100,
  XP_LIMIT: 100,
  ENERGY_INTERVAL: 5 * 60 * 1000,

  MANIFEST:
  "https://toncrimegame-dotcom.github.io/toncrimegame/tonconnect-manifest.json"
};

/* ================= SUPABASE ================= */

const db = window.supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_KEY
);

/* ================= GLOBAL STATE ================= */

const GAME = {
  user: null,
  loading: false,
  pvpSubscribed: false,
  wallet: null
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

  GAME.loading = false;

  if (error) {
    console.error("User load error:", error);
    return null;
  }

  GAME.user = data;
  return data;
}

/* ===================================================
   ENERGY REGEN
=================================================== */

async function regenEnergy() {

  const u = GAME.user;
  if (!u) return;

  const now = Date.now();

  if (!u.last_energy_tick) {
    await db.from("users")
      .update({ last_energy_tick: now })
      .eq("id", u.id);

    u.last_energy_tick = now;
    return;
  }

  const diff = now - u.last_energy_tick;
  const gain = Math.floor(diff / CONFIG.ENERGY_INTERVAL);

  if (gain <= 0) return;
  if (u.energy >= CONFIG.MAX_ENERGY) return;

  const newEnergy = Math.min(
    CONFIG.MAX_ENERGY,
    u.energy + gain
  );

  const newTick =
    u.last_energy_tick +
    gain * CONFIG.ENERGY_INTERVAL;

  const { error } = await db
    .from("users")
    .update({
      energy: newEnergy,
      last_energy_tick: newTick
    })
    .eq("id", u.id);

  if (!error) {
    u.energy = newEnergy;
    u.last_energy_tick = newTick;
  }
}

/* ===================================================
   RENDER STATS (AUTO SAFE)
=================================================== */

function renderStats() {

  const u = GAME.user;
  if (!u) return;

  const stats = document.getElementById("stats");
  const xpBar = document.getElementById("xpBar");
  const energyBar = document.getElementById("energyBar");

  if (stats)
    stats.innerHTML =
      `Lv ${u.level} | XP ${u.xp}/${CONFIG.XP_LIMIT}
       | ⚡ ${u.energy} | 💰 ${Number(u.yton).toFixed(2)}`;

  if (xpBar)
    xpBar.style.width =
      (u.xp / CONFIG.XP_LIMIT * 100) + "%";

  if (energyBar)
    energyBar.style.width =
      (u.energy / CONFIG.MAX_ENERGY * 100) + "%";
}

/* ===================================================
   DAILY RESET
=================================================== */

function dailyReset() {

  const today = new Date().toDateString();
  const saved = localStorage.getItem("tc_daily");

  if (saved === today) return;

  localStorage.setItem("tc_daily", today);

  console.log("✔ Daily reset");
}

/* ===================================================
   TON WALLET ENGINE (AUTO UI)
=================================================== */

function initWallet() {

  if (!window.TON_CONNECT_UI) return;

  const btn = document.getElementById("walletBtn");
  if (!btn) return;

  const tonUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: CONFIG.MANIFEST,
    buttonRootId: "walletBtn"
  });

  tonUI.onStatusChange(async wallet => {

    if (!wallet) return;

    GAME.wallet = wallet.account.address;

    const user = await loadUser();
    if (!user) return;

    await db.from("users")
      .update({ ton_wallet: GAME.wallet })
      .eq("id", CONFIG.USER_ID);

    btn.innerText =
      GAME.wallet.slice(0,6) +
      "..." +
      GAME.wallet.slice(-4);

    console.log("Wallet linked");
  });
}

/* ===================================================
   PVP REALTIME
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
   GAME LOOP
=================================================== */

async function gameLoop() {
  await regenEnergy();
  renderStats();
}

/* ===================================================
   INIT ENGINE
=================================================== */

async function initEngine() {

  const user = await loadUser();
  if (!user) return;

  renderStats();
  dailyReset();
  subscribePvP();
  initWallet();

  /* SAFE LOOP */
  setInterval(gameLoop, 60000);
}

/* ===================================================
   START
=================================================== */

document.addEventListener(
  "DOMContentLoaded",
  initEngine
);
