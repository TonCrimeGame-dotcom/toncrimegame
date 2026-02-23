/* ===================================================
   TONCRIME TELEGRAM BRIDGE ENGINE
   Mini App Integration
   =================================================== */

(function(){

if(!window.Telegram){
console.warn("Telegram WebApp not detected");
return;
}

const tg = window.Telegram.WebApp;

/* ================= INIT ================= */

tg.ready();
tg.expand();

document.body.style.background = tg.themeParams.bg_color || "#0e0e0e";

/* ================= USER ================= */

function getTelegramUser(){

if(!tg.initDataUnsafe) return null;

return tg.initDataUnsafe.user || null;
}

/* ================= LOGIN ================= */

async function telegramLogin(){

const tgUser = getTelegramUser();

if(!tgUser){
console.warn("No Telegram user");
return;
}

const telegramId = String(tgUser.id);

/* local cache */
localStorage.setItem("tc_user", telegramId);

/* DB CHECK */

const { data } = await db
.from("users")
.select("*")
.eq("id", telegramId)
.maybeSingle();

/* NEW PLAYER */

if(!data){

await db.from("users").insert({
id: telegramId,
nickname: tgUser.username || tgUser.first_name,
level:1,
xp:0,
energy:100,
yton:5,
last_energy_tick: Date.now()
});

console.log("👤 New Telegram Player Created");

}else{
console.log("👤 Returning Player");
}

/* ENGINE READY */

CONFIG.USER_ID = telegramId;

EVENT.emit("telegram:ready",telegramId);
EVENT.emit("user:update");

}

/* ================= BACK BUTTON ================= */

tg.BackButton.onClick(()=>{
history.back();
});

/* ================= START ================= */

telegramLogin();

window.TELEGRAM = {
user:getTelegramUser(),
raw:tg
};

console.log("📱 Telegram Connected");

})();
