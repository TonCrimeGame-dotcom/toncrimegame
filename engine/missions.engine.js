/* ===================================================
   TONCRIME MISSIONS ENGINE
   =================================================== */

(function(){

const MISSIONS = {

  list:{},

  progress:{},

  /* ===========================================
     REGISTER
  =========================================== */

  register(id,data){
    this.list[id]=data;
    this.progress[id]=0;
  },

  /* ===========================================
     ADD PROGRESS
  =========================================== */

  add(id,amount=1){

    if(!this.list[id]) return;

    this.progress[id]+=amount;

    if(this.progress[id] >= this.list[id].target){
      this.complete(id);
    }
  },

  /* ===========================================
     COMPLETE
  =========================================== */

  complete(id){

    console.log("✅ Mission Completed:",id);

    if(window.REWARD){
      REWARD.give(this.list[id].reward);
    }

    /* ===== ACHIEVEMENT HOOK ===== */
    if(window.ACHIEVEMENT){
      ACHIEVEMENT.progress("missions_50");
    }

    if(window.EVENT){
      EVENT.emit("mission:completed",id);
    }

  }

};

window.MISSIONS = MISSIONS;

console.log("📜 Missions Engine Ready");

})();
