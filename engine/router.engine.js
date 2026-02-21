/* ===================================================
   TONCRIME ROUTER ENGINE
   SPA Scene System
=================================================== */

(function(){

const ROUTER = {

  current:null,
  scenes:{},

  /* ================================
     REGISTER SCENE
  ================================= */

  register(name,renderFn){

    this.scenes[name]=renderFn;
    console.log("📦 Scene registered:",name);
  },

  /* ================================
     LOAD SCENE
  ================================= */

  async go(name,data=null){

    if(!this.scenes[name]){
      console.warn("Scene not found:",name);
      return;
    }

    this.current=name;

    const root=document.getElementById("app");

    if(!root){
      console.error("#app container missing");
      return;
    }

    root.innerHTML=`
      <div class="scene-loading">
        Yükleniyor...
      </div>
    `;

    try{
      await this.scenes[name](root,data);
      EVENT.emit("scene:changed",name);
    }catch(e){
      console.error("Scene error:",e);
      root.innerHTML="Scene load error";
    }
  }

};

window.ROUTER=ROUTER;

console.log("🧭 Router Engine Ready");

})();
