/* ===================================================
   TONCRIME TON WALLET ENGINE
   =================================================== */

(function(){

const WALLET={};

let tonUI;

/* ================= INIT ================= */

WALLET.init=function(){

tonUI = new TON_CONNECT_UI.TonConnectUI({
manifestUrl: window.location.origin + "/tonconnect-manifest.json",
buttonRootId:"walletButton"
});

tonUI.onStatusChange(wallet=>{
if(wallet){
WALLET.connected(wallet);
}
});

};

/* ================= CONNECTED ================= */

WALLET.connected=async function(wallet){

const address = wallet.account.address;

const userId = CONFIG.USER_ID;

await db.from("users")
.update({wallet:address})
.eq("id",userId);

EVENT.emit("notify","💰 Wallet bağlandı");

console.log("Wallet:",address);
};

/* ================= CHECK ================= */

WALLET.canWithdraw=function(user){

if(user.premium) return true;

return user.level>=50;
};

window.WALLET=WALLET;

/* AUTO START */

document.addEventListener("DOMContentLoaded",()=>{
setTimeout(()=>WALLET.init(),500);
});

})();
