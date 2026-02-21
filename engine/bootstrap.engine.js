/* ===================================================
   TONCRIME BOOTSTRAP ENGINE
   Master Engine Loader
   =================================================== */

(function(){

console.log("🚀 TONCRIME BOOT STARTING");

/* ===================================================
   SAFE LOAD CHECK
=================================================== */

function waitFor(condition, callback){

  const timer = setInterval(()=>{

    if(condition()){
      clearInterval(timer);
      callback();
    }

  },50);
}

/* ===================================================
   ENGINE READY CHECKS
=================================================== */

waitFor(()=>window.EVENT, ()=>{

  console.log("⚡ Event Engine Ready");

  waitFor(()=>window.STATE, ()=>{

    console.log("🧠 State Engine Ready");

    waitFor(()=>window.UI, ()=>{

      console.log("🎨 UI Engine Ready");

      waitFor(()=>window.WORLD, ()=>{

        console.log("🌍 World Engine Ready");

        startGame();

      });

    });

  });

});


/* ===================================================
   START GAME
=================================================== */

function startGame(){

  console.log("🔥 ALL ENGINES LOADED");

  /* UI INIT SAFE CALL */
  if(window.UI && typeof UI.init === "function"){
    UI.init();
  }

  /* WORLD INIT */
  if(window.WORLD && typeof WORLD.init === "function"){
    WORLD.init();
  }

  /* GAME LOOP EVENT */
  if(window.EVENT){
    EVENT.emit("game:ready");
  }

  /* ===========================
     HOT RELOAD START
  =========================== */

  if(window.HOTRELOAD &&
     typeof HOTRELOAD.start === "function"){
    HOTRELOAD.start();
  }

  console.log("❤️ Game Fully Started");
}

})();
