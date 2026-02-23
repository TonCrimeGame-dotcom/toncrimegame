/* ===================================================
   TONCRIME FX ENGINE
   Screen Effects + Sound + Shake
   =================================================== */

(function(){

const FX={};

/* ================= SCREEN DIM ================= */

FX.dim=function(on=true){

let el=document.getElementById("fx-dim");

if(!el){
el=document.createElement("div");
el.id="fx-dim";
document.body.appendChild(el);
}

el.style.opacity=on? "1":"0";
};

/* ================= SCREEN SHAKE ================= */

FX.shake=function(){

document.body.classList.add("shake");

setTimeout(()=>{
document.body.classList.remove("shake");
},400);

};

/* ================= SUCCESS FLASH ================= */

FX.success=function(){

let f=document.createElement("div");
f.className="fx-success";
document.body.appendChild(f);

setTimeout(()=>f.remove(),500);

};

/* ================= FAIL FLASH ================= */

FX.fail=function(){

let f=document.createElement("div");
f.className="fx-fail";
document.body.appendChild(f);

setTimeout(()=>f.remove(),500);

};

/* ================= VIBRATION ================= */

FX.vibrate=function(ms=120){
if(navigator.vibrate)
navigator.vibrate(ms);
};

window.FX=FX;

console.log("🎬 FX Engine Ready");

})();
