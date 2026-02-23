/* ===================================================
   TONCRIME LEADERBOARD ENGINE
   Live Top Players
   =================================================== */

(function(){

if(!window.RANK || !window.TEMPLATE){
  console.warn("Leaderboard waiting...");
  return;
}

const LEADERBOARD = {

async render(){

  const top=await RANK.top(10);

  let html="<h3>🏆 En İyiler</h3>";

  top.forEach((p,i)=>{
    html+=`
      <div>
        ${i+1}. ${p.nickname}
        — ${p.elo} ELO
      </div>
    `;
  });

  const box=document.getElementById("leaderboard");

  if(box) box.innerHTML=html;
}

};

window.LEADERBOARD=LEADERBOARD;


/* AUTO UPDATE */

EVENT.on("scene:loaded",(scene)=>{

  if(scene==="index"){
    setTimeout(()=>LEADERBOARD.render(),500);
  }

});

console.log("📊 Leaderboard Engine Ready");

})();
