/* ===================================================
   TONCRIME SCENE ENGINE
   Game Scene Manager
=================================================== */

(function(){

const SCENE = {

  current:null,
  scenes:{},

  containerId:"scene-root",

  /* ======================================
     INIT ROOT
  ====================================== */

  init(){

    let root=document.getElementById(this.containerId);

    if(!root){
      root=document.createElement("div");
      root.id=this.containerId;
      root.style.padding="20px";
      document.body.appendChild(root);
    }

    console.log("🎬 Scene Engine Ready");
  },

  /* ======================================
     REGISTER SCENE
  ====================================== */

  register(name,render){

    this.scenes[name]=render;
    console.log("📦 Scene:",name);
  },

  /* ======================================
     LOAD SCENE
  ====================================== */

  async load(name,data=null){

    if(!this.scenes[name]){
      console.warn("Scene not found:",name);
      return;
    }

    this.current=name;

    const root=document.getElementById(this.containerId);

    root.innerHTML=`
      <div style="opacity:.6">Yükleniyor...</div>
    `;

    try{
      await this.scenes[name](root,data);

      if(window.EVENT)
        EVENT.emit("scene:changed",name);

    }catch(e){
      console.error("Scene crash:",e);
      root.innerHTML="Scene error";
    }
  }

};

window.SCENE=SCENE;

document.addEventListener("DOMContentLoaded",()=>{
  SCENE.init();
});

console.log("🎮 Scene Engine Loaded");

})();
