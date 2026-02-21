/* ===================================================
   TONCRIME EVENT ENGINE
   Global Event Bus System
   =================================================== */

(function(){

window.EVENT = {

  events:{},

  /* ===========================================
     EMIT EVENT
  =========================================== */

  emit(name,data=null){

    if(!this.events[name]) return;

    this.events[name].forEach(cb=>{
      try{
        cb(data);
      }catch(e){
        console.error("Event error:",name,e);
      }
    });
  },

  /* ===========================================
     LISTEN EVENT
  =========================================== */

  on(name,callback){

    if(!this.events[name])
      this.events[name]=[];

    this.events[name].push(callback);
  },

  /* ===========================================
     REMOVE LISTENER
  =========================================== */

  off(name,callback){

    if(!this.events[name]) return;

    this.events[name]=this.events[name]
      .filter(cb=>cb!==callback);
  }

};

console.log("⚡ Event Engine Ready");

})();
