/* ===================================================
   TON WALLET CONNECT
   =================================================== */

let tonConnectUI;

/* LOAD SDK */
async function initTon(){

  const script=document.createElement("script");
  script.src="https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js";
  document.head.appendChild(script);

  script.onload=setupTon;
}

async function setupTon(){

  tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: window.location.origin + "/tonconnect-manifest.json",
    buttonRootId: "ton-connect"
  });

  tonConnectUI.onStatusChange(wallet=>{
    if(wallet){
      saveWallet(wallet.account.address);
    }
  });
}

/* SAVE WALLET */

async function saveWallet(address){

  await db.from("users")
    .update({ton_wallet:address})
    .eq("id",CONFIG.USER_ID);

  notify("TON Wallet bağlandı ✅","success");
}

document.addEventListener("DOMContentLoaded",initTon);
