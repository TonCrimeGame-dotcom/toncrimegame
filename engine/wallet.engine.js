/* ===================================================
   TONCRIME TON WALLET ENGINE (UPDATED)
   Withdrawal Rules Fixed
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Wallet engine waiting EVENT...");
  return;
}

/* ===========================================
   CONFIG
=========================================== */

const YTON_RATE = 0.05;      // 1 YTON = 0.05 TON
const MIN_WITHDRAW = 20;     // minimum çekim
const REQUIRED_LEVEL = 50;   // çekim level

/* ===========================================
   ENGINE
=========================================== */

const WALLET={

  address:null,

  /* ===================================== */
  connect(address){

    if(!address){
      NOTIFY.push("Geçersiz adres");
      return;
    }

    this.address=address;
    localStorage.setItem("tc_wallet",address);

    NOTIFY.push("💎 TON cüzdan bağlandı");
  },

  load(){
    this.address =
      localStorage.getItem("tc_wallet");
  },

  /* ===================================== */
  WITHDRAW PERMISSION
  ===================================== */

  canWithdraw(){

    const u = GAME.user;
    if(!u) return false;

    /* ✅ SENİN KURALIN */
    if(u.level >= REQUIRED_LEVEL) return true;
    if(u.premium === true) return true;

    NOTIFY.push(
      "🔒 Çekim için Level 50 olmalısın"
    );

    return false;
  },

  /* ===================================== */
  CONVERT
  ===================================== */

  toTON(yton){
    return Number(yton * YTON_RATE).toFixed(2);
  },

  /* ===================================== */
  WITHDRAW REQUEST
  ===================================== */

  withdraw(yton){

    const u = GAME.user;

    if(!this.canWithdraw()) return;

    if(yton < MIN_WITHDRAW){
      NOTIFY.push("Minimum 20 YTON çekilebilir");
      return;
    }

    if(u.yton < yton){
      NOTIFY.push("Yetersiz bakiye");
      return;
    }

    if(!this.address){
      NOTIFY.push("Önce TON cüzdan bağla");
      return;
    }

    const ton = this.toTON(yton);

    /* bakiye düş */
    u.yton -= yton;

    EVENT.emit("wallet:withdrawRequest",{
      user:u.id,
      yton,
      ton,
      address:this.address,
      created_at:Date.now()
    });

    NOTIFY.push(
      "⏳ Çekim isteği gönderildi: "+ton+" TON"
    );
  },

  /* ===================================== */
  SERVER DEPOSIT
  ===================================== */

  deposit(amount){

    GAME.user.yton += amount;

    NOTIFY.push("💰 "+amount+" YTON yatırıldı");
  }

};

window.WALLET=WALLET;

/* ===========================================
   START
=========================================== */

EVENT.on("game:ready",()=>{
  WALLET.load();
});

/* ===========================================
   CORE REGISTER
=========================================== */

if(window.CORE){
  CORE.register(
    "Wallet Engine",
    ()=>!!window.WALLET
  );
}

console.log("💎 Wallet Engine Ready");

})();
