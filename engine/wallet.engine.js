/* ===================================================
   TONCRIME WALLET + PAYMENT + WITHDRAW ENGINE
   =================================================== */

(function(){

const TON_RATE = 0.05; // 1 YTON = 0.05 TON
const MIN_WITHDRAW = 20;

let tonUI;

/* ================= INIT ================= */

async function initWallet(){

tonUI = new TON_CONNECT_UI.TonConnectUI({
manifestUrl: window.location.origin+"/tonconnect-manifest.json",
buttonRootId:"walletButton"
});

tonUI.onStatusChange(async wallet=>{
if(!wallet) return;

const address = wallet.account.address;

await db.from("users")
.update({wallet:address})
.eq("id",CONFIG.USER_ID);

EVENT.emit("notify","💰 Wallet bağlandı");

});

}

/* ================= PREMIUM BUY ================= */

async function buyPremium(){

await tonUI.sendTransaction({
validUntil: Math.floor(Date.now()/1000)+600,
messages:[{
address:"EQPREMIUMWALLETADDRESS", // kendi TON adresin
amount:(5 * 1e9).toString() // 5 TON
}]
});

/* kayıt oluştur */

await db.from("premium_orders").insert({
user_id:CONFIG.USER_ID,
ton_paid:5
});

EVENT.emit("notify","⭐ Premium ödeme gönderildi");

}

/* ================= WITHDRAW ================= */

async function withdrawYTON(amount){

const {data:user}=await db
.from("users")
.select("*")
.eq("id",CONFIG.USER_ID)
.single();

if(!user.wallet){
EVENT.emit("notify","Wallet bağlı değil");
return;
}

if(!user.premium && user.level<50){
EVENT.emit("notify","Level 50 gerekli");
return;
}

if(amount<MIN_WITHDRAW){
EVENT.emit("notify","Minimum 20 YTON");
return;
}

if(user.yton<amount){
EVENT.emit("notify","Yetersiz bakiye");
return;
}

const tonAmount = amount * TON_RATE;

await db.from("withdraw_requests").insert({
user_id:user.id,
amount:amount,
ton_amount:tonAmount
});

EVENT.emit("notify","💸 Çekim isteği gönderildi");

}

/* ================= UI ================= */

function renderWalletUI(){

const root=document.getElementById("tc-content");
if(!root) return;

root.innerHTML+=`

<div class="card">
<h3>💰 Cüzdan</h3>

<div id="walletButton"></div>

<button onclick="WALLET.buyPremium()">
⭐ Premium Satın Al (5 TON)
</button>

<button onclick="WALLET.withdrawPrompt()">
💸 TON Çek
</button>

</div>
`;
}

function withdrawPrompt(){

const amount=prompt("Çekilecek YTON:");

if(!amount) return;

withdrawYTON(Number(amount));
}

/* ================= EXPORT ================= */

window.WALLET={
buyPremium,
withdrawPrompt
};

document.addEventListener("DOMContentLoaded",()=>{
setTimeout(initWallet,500);
EVENT.on("page:enter",p=>{
if(p==="index") setTimeout(renderWalletUI,300);
});
});

})();
