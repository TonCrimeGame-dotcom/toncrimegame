/* ===================================================
   TONCRIME MASTER CORE ENGINE
   Global Engine Controller
   =================================================== */

(function(){

/* ===========================================
   CORE OBJECT
=========================================== */

const CORE = {

  started:false,
  engines:[],
  ready:false,

  /* ===================================== */
  register(name,check){

    this.engines.push({
      name,
      check
    });

  },

  /* ===================================== */
  async boot(){

    if(this.started) return;
    this.started=true;

    console.log("🚀 CORE BOOT START");

    await this.waitForDependencies();

    this.checkEngines();

    this.ready=true;

    console.log("✅ CORE READY");

    if(window.EVENT)
      EVENT.emit("game:ready");

  },

  /* ===================================== */
  WAIT GLOBALS
  ===================================== */

  waitForDependencies(){

    return new Promise(resolve=>{

      const wait=()=>{

        if(window.EVENT &&
           window.GAME &&
           window.CONFIG){

          resolve();
        }else{
          setTimeout(wait,100);
        }
      };

      wait();
    });

  },

  /* ===================================== */
  ENGINE CHECK
  ===================================== */

  checkEngines(){

    console.log("🔎 Engine Health Check");

    this.engines.forEach(e=>{

      try{

        const ok = e.check();

        if(ok)
          console.log("✅",e.name);
        else
          console.warn("⚠️",e.name,"not ready");

      }catch(err){
        console.error("❌ Engine crash:",e.name,err);
      }

    });

  }

};

window.CORE = CORE;

/* ===========================================
   AUTO START
=========================================== */

document.addEventListener("DOMContentLoaded",()=>{
  CORE.boot();
});

})();
