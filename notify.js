/* ===================================================
   TONCRIME NOTIFICATION SYSTEM
   =================================================== */

function notify(text,type="info"){

  let box=document.getElementById("notifyBox");

  if(!box){
    box=document.createElement("div");
    box.id="notifyBox";
    box.style.position="fixed";
    box.style.bottom="25px";
    box.style.right="25px";
    box.style.padding="15px 20px";
    box.style.background="#1b1b1b";
    box.style.color="white";
    box.style.borderRadius="8px";
    box.style.zIndex="9999";
    document.body.appendChild(box);
  }

  let color="#888";

  if(type==="success") color="limegreen";
  if(type==="error") color="red";
  if(type==="info") color="gold";

  box.style.borderLeft="5px solid "+color;
  box.innerHTML=text;
  box.style.display="block";

  setTimeout(()=>{
    box.style.display="none";
  },2500);
}
