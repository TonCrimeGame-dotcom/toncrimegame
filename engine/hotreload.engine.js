/* ===================================================
   TONCRIME HOT RELOAD ENGINE
   Live Patch System
=================================================== */

(function(){

const HotReload = {

  version:null,
  checking:false,
  interval:30000, // 30s

  /* ===============================
     CHECK VERSION
  =============================== */

  async check(){

    if(this.checking) return;
    this.checking=true;

    try{

      const res = await fetch("version.json?"+Date.now());
      const data = await res.json();

      if(!this.version){
        this.version=data.version;
      }
      else if(this.version !== data.version){

        console.log("🔥 NEW VERSION DETECTED");

        this.version=data.version;
        this.reloadEngines(data.changed || []);

      }

    }catch(e){
      console.warn("HotReload check failed");
    }

    this.checking=false;
  },

  /* ===============================
     RELOAD ENGINES
  =============================== */

  async reloadEngines(files){

    if(!files.length){
      location.reload();
      return;
    }

    console.log("♻ Reloading engines:",files);

    for(const file of files){

      const src=file+"?v="+Date.now();

      const script=document.createElement("script");
      script.src=src;
      script.async=false;

      document.head.appendChild(script);

      await new Promise(r=>script.onload=r);
    }

    if(window.EVENT)
      EVENT.emit("hotreload");

    console.log("✅ Hot reload complete");

  },

  /* ===============================
     START WATCHER
  =============================== */

  start(){

    console.log("👁 HotReload watching...");
    setInterval(()=>this.check(),this.interval);

  }

};

window.HOTRELOAD=HotReload;

console.log("♨ HotReload Engine Ready");

})();
