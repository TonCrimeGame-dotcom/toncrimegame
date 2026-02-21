(function(){

const LOOP_INTERVAL=60000;

async function gameLoop(){

  if(window.BUSINESS)
    BUSINESS.produceDaily();

  if(window.MARKET)
    MARKET.load();

}

setInterval(gameLoop,LOOP_INTERVAL);

console.log("🔄 Game Loop Started");

})();
