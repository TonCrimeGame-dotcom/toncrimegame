/* ===================================================
   TONCRIME NOTIFICATION ENGINE
   Global Toast + Game Alerts
   =================================================== */

(function(){

const QUEUE = [];
let showing = false;


/* ===================================================
   CREATE CONTAINER
   =================================================== */

function createContainer(){

  if(document.getElementById("tc-notify")) return;

  const box=document.createElement("div");

  box.id="tc-notify";

  box.style.position="fixed";
  box.style.bottom="25px";
  box.style.right="25px";
  box.style.zIndex="9999";
  box.style.display="flex";
  box.style.flexDirection="column";
  box.style.gap="10px";

  document.body.appendChild(box);
}


/* ===================================================
   SHOW NEXT
   =================================================== */

function showNext(){

  if(showing) return;
  if(!QUEUE.length) return;

  showing=true;

  const n=QUEUE.shift();

  const el=document.createElement("div");

  el.style.background="#151515";
  el.style.borderLeft=`4px solid ${n.color}`;
  el.style.padding="12px 16px";
  el.style.borderRadius="8px";
  el.style.color="white";
  el.style.minWidth="220px";
  el.style.fontSize="14px";
  el.style.boxShadow="0 0 15px rgba(0,0,0,.5)";
  el.style.opacity="0";
  el.style.transform="translateY(15px)";
  el.style.transition="0.3s";

  el.innerHTML=n.text;

  document.getElementById("tc-notify")
    .appendChild(el);

  setTimeout(()=>{
    el.style.opacity="1";
    el.style.transform="translateY(0)";
  },50);

  setTimeout(()=>{

    el.style.opacity="0";
    el.style.transform="translateY(15px)";

    setTimeout(()=>{
      el.remove();
      showing=false;
      showNext();
    },300);

  },n.duration||3000);
}


/* ===================================================
   PUSH NOTIFICATION
   =================================================== */

function notify(text,color="#f5b041",duration=3000){

  QUEUE.push({text,color,duration});
  showNext();
}


/* ===================================================
   PUBLIC API
   =================================================== */

window.Notify={
  show:notify
};


/* ===================================================
   AUTO EVENTS
   =================================================== */

EVENT.on("reward:given",(d)=>{
  notify(`💰 +${d.reward.yton} YTON<br>⭐ +${d.reward.xp} XP`,"#2ecc71");
});

EVENT.on("elo:updated",(d)=>{
  notify(`🏆 Rank Güncellendi<br>ELO: ${d.A.elo}`,"#3498db");
});

EVENT.on("pvp:resolved",(d)=>{
  notify("⚔ PvP Maçı Bitti","#e74c3c");
});

EVENT.on("question:new",()=>{
  notify("🧠 Yeni Soru!","#9b59b6",1500);
});

console.log("🔔 Notification Engine Ready");

createContainer();

})();
