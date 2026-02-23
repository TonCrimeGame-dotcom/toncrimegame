/* ===================================================
   TONCRIME SCENE ENGINE
   SPA Game Navigation System
   =================================================== */

(function(){

if(!window.TEMPLATE || !window.EVENT){
  console.warn("Scene engine waiting...");
  return;
}

const SCENE = {

  current:null,
  scenes:{},

  /* ======================================
     REGISTER SCENE
  ====================================== */

  register(name,loader){
    this.scenes[name]=loader;
  },

  /* ======================================
     LOAD SCENE
  ====================================== */

  async load(name){

    if(!this.scenes[name]){
      console.warn("Scene not found:",name);
      return;
    }

    console.log("🎬 Loading scene:",name);

    this.current=name;

    EVENT.emit("scene:change",name);

    const html = await this.scenes[name]();

    TEMPLATE.load(html);

    EVENT.emit("scene:loaded",name);
  }

};

window.SCENE=SCENE;


/* ======================================
   MENU HOOK (AUTO SPA)
====================================== */

document.addEventListener("click",(e)=>{

  const btn=e.target.closest("[data-page]");
  if(!btn) return;

  e.preventDefault();

  const page=btn.dataset.page;

  SCENE.load(page);

});


console.log("🎬 Scene Engine Ready");

})();
