/* ===================================================
   TONCRIME NOTIFY ENGINE (SAFE VERSION)
=================================================== */

(function(){

let container=null;

/* --------------------------------------- */
/* CREATE CONTAINER SAFE */
/* --------------------------------------- */

function createContainer(){

  if(container) return;

  // body hazır değilse bekle
  if(!document.body){
    setTimeout(createContainer,50);
    return;
  }

  container=document.createElement("div");
  container.id="notify-container";

  container.style.position="fixed";
  container.style.top="20px";
  container.style.right="20px";
  container.style.zIndex="9999";

  document.body.appendChild(container);
}

/* --------------------------------------- */
/* SHOW NOTIFY */
/* --------------------------------------- */

function show(text,color="#f1c40f"){

  createContainer();

  const box=document.createElement("div");

  box.innerText=text;
  box.style.background=color;
  box.style.color="#000";
  box.style.padding="10px 14px";
  box.style.marginBottom="10px";
  box.style.borderRadius="8px";
  box.style.fontWeight="bold";

  container.appendChild(box);

  setTimeout(()=>{
    box.remove();
  },3000);
}

/* --------------------------------------- */

window.Notify={ show };

console.log("🔔 Notification Engine Ready");

})();
