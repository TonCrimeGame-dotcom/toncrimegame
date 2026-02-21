/* ===================================================
   TONCRIME NOTIFICATION ENGINE (SAFE)
=================================================== */

(function(){

let container=null;

/* SAFE CREATE */
function createContainer(){

  container=document.getElementById("notify-container");

  if(container) return;

  container=document.createElement("div");
  container.id="notify-container";

  container.style.position="fixed";
  container.style.top="20px";
  container.style.right="20px";
  container.style.zIndex="9999";

  document.body.appendChild(container);
}

/* SHOW NOTIFICATION */
window.NOTIFY={

  show(text){

    if(!container) createContainer();

    const box=document.createElement("div");

    box.style.background="#222";
    box.style.color="#fff";
    box.style.padding="10px";
    box.style.marginTop="10px";
    box.style.borderRadius="8px";

    box.innerText=text;

    container.appendChild(box);

    setTimeout(()=>box.remove(),4000);
  }

};

console.log("🔔 Notification Engine Ready");

})();
