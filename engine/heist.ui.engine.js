/* ===================================================
   TONCRIME HEIST UI ENGINE (FULL)
   =================================================== */

(function(){

if(!window.HEIST_UI) window.HEIST_UI = {};
const UI = window.HEIST_UI;

/* ===================================================
   RENDER
   =================================================== */

UI.render = function(containerId, params){

  const container = document.getElementById(containerId);
  container.innerHTML = "";
  container.style.position = "relative";
  container.style.background = "#000";
  container.style.height = "450px";
  container.style.overflow = "hidden";

  const scene = HEIST.generateScene(params);

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(3,1fr)";
  grid.style.gridTemplateRows = "repeat(3,1fr)";
  grid.style.width = "100%";
  grid.style.height = "100%";

  container.appendChild(grid);

  for(let r=0;r<3;r++){
    for(let c=0;c<3;c++){

      const cell = document.createElement("div");
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.style.position = "relative";
      cell.style.border = "1px solid rgba(255,255,255,0.05)";
      grid.appendChild(cell);
    }
  }

  scene.objects.forEach(obj=>{

    const cell = [...grid.children].find(c =>
      c.dataset.row == obj.grid.row &&
      c.dataset.col == obj.grid.col
    );

    const el = document.createElement("div");
    el.innerText = obj.type.toUpperCase();
    el.style.color = "white";
    el.style.textAlign = "center";
    el.style.paddingTop = "40px";
    el.style.cursor = "pointer";

    el.onclick = function(){

      const result = HEIST.clickObject(obj.id);

      if(result.result === "win"){
        alert("KASA AÇILDI! +1200 YTON");
      }

      if(result.result === "wrong"){
        UI.updateRisk();
      }
    };

    cell.appendChild(el);
  });

  UI.startTimer();
};

/* ===================================================
   RISK BAR
   =================================================== */

UI.updateRisk = function(){

  const risk = HEIST.state.risk;
  const bar = document.getElementById("riskBarFill");

  if(bar){
    bar.style.width = risk + "%";
  }

  if(risk > 80){
    document.body.style.animation = "shake 0.2s infinite";
  }

  if(HEIST.isFailed()){
    alert("ALARM! GÖREV BAŞARISIZ");
  }
};

/* ===================================================
   TIMER
   =================================================== */

UI.startTimer = function(){

  const interval = setInterval(()=>{

    const tick = HEIST.tick(1000);

    const el = document.getElementById("timer");
    if(el){
      el.innerText = Math.floor(HEIST.state.timeLeft / 1000);
    }

    if(tick.result === "timeout"){
      clearInterval(interval);
      alert("SÜRE BİTTİ");
    }

  },1000);
};

console.log("🎨 Heist UI Ready");

})();
