/* ===================================================
   TONCRIME ASSET LOADER ENGINE
   Dynamic Engine Loader
=================================================== */

(function(){

const Loader = {

  loaded:{},
  queue:[],
  loading:false,

  /* ===============================
     LOAD SCRIPT
  =============================== */

  load(src){

    return new Promise((resolve,reject)=>{

      if(this.loaded[src]){
        resolve();
        return;
      }

      const script=document.createElement("script");
      script.src=src;
      script.async=false;

      script.onload=()=>{
        this.loaded[src]=true;
        console.log("✅ Loaded:",src);
        resolve();
      };

      script.onerror=()=>{
        console.error("❌ Load failed:",src);
        reject(src);
      };

      document.head.appendChild(script);

    });
  },

  /* ===============================
     LOAD LIST (ORDER SAFE)
  =============================== */

  async loadBatch(list){

    for(const file of list){
      await this.load(file);
    }

  }

};

window.LOADER=Loader;

console.log("📦 Loader Engine Ready");

})();
