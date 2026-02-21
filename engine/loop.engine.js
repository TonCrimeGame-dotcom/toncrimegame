/* ===================================================
   TONCRIME GAME LOOP ENGINE
   Heartbeat System
   =================================================== */

(function(){

/* ===============================================
   LOOP STATE
=============================================== */

window.LOOP = {

  started:false,
  lastFrame:0,
  seconds:0,

};


/* ===============================================
   MAIN FRAME LOOP (60 FPS SAFE)
=============================================== */

function frameLoop(timestamp){

  if(!LOOP.started) return;

  const delta = timestamp - LOOP.lastFrame;
  LOOP.lastFrame = timestamp;

  /* FRAME EVENT */
  EVENT.emit("FRAME_UPDATE",delta);

  requestAnimationFrame(frameLoop);
}


/* ===============================================
   SECOND LOOP (GAME LOGIC)
=============================================== */

setInterval(()=>{

  if(!LOOP.started) return;

  LOOP.seconds++;

  EVENT.emit("SECOND_TICK",LOOP.seconds);

},1000);


/* ===============================================
   MINUTE LOOP (SERVER SYNC)
=============================================== */

setInterval(()=>{

  if(!LOOP.started) return;

  EVENT.emit("MINUTE_TICK");

},60000);


/* ===============================================
   ENERGY TIMER UPDATE
=============================================== */

EVENT.on("SECOND_TICK",()=>{

  const user = GameState.getUser();
  if(!user) return;

  if(!user.last_energy_tick) return;

  const remain =
    CONFIG.ENERGY_INTERVAL -
    (Date.now() - user.last_energy_tick);

  if(remain <= 0){

    EVENT.emit("ENERGY_READY");
  }

});


/* ===============================================
   ONLINE HEARTBEAT
=============================================== */

EVENT.on("MINUTE_TICK",()=>{

  EVENT.emit("ONLINE_PULSE");

});


/* ===============================================
   START LOOP
=============================================== */

window.startGameLoop = function(){

  if(LOOP.started) return;

  LOOP.started = true;
  LOOP.lastFrame = performance.now();

  console.log("💓 Game Loop Started");

  requestAnimationFrame(frameLoop);
};


/* ===============================================
   AUTO START (ENGINE READY)
=============================================== */

document.addEventListener("DOMContentLoaded",()=>{

  setTimeout(()=>{
    startGameLoop();
  },500);

});

})();
