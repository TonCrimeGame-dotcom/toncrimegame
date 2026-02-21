/* ===================================================
   TONCRIME STATE ENGINE
   Global Game Memory System
   =================================================== */

(function(){

/* ===============================================
   GLOBAL STATE OBJECT
=============================================== */

window.STATE = {

  data:{},
  listeners:{},

  /* ---------- SET ---------- */

  set(key,value){

    this.data[key]=value;

    /* notify listeners */
    if(this.listeners[key]){
      this.listeners[key].forEach(cb=>cb(value));
    }
  },

  /* ---------- GET ---------- */

  get(key){
    return this.data[key];
  },

  /* ---------- SUBSCRIBE ---------- */

  subscribe(key,callback){

    if(!this.listeners[key])
      this.listeners[key]=[];

    this.listeners[key].push(callback);
  },

  /* ---------- MERGE OBJECT ---------- */

  merge(key,obj){

    if(!this.data[key])
      this.data[key]={};

    Object.assign(this.data[key],obj);

    this.set(key,this.data[key]);
  }

};


/* ===============================================
   GAME STATE HELPERS
=============================================== */

window.GameState = {

  /* USER */

  setUser(user){
    STATE.set("user",user);
  },

  getUser(){
    return STATE.get("user");
  },

  updateUser(partial){

    const u = STATE.get("user") || {};
    Object.assign(u,partial);

    STATE.set("user",u);
  },

  /* ONLINE COUNT */

  setOnline(count){
    STATE.set("online",count);
  },

  /* TOURNAMENT */

  setTournament(data){
    STATE.set("tournament",data);
  }

};


/* ===============================================
   AUTO UI BINDINGS
=============================================== */

STATE.subscribe("user",(user)=>{

  if(window.UI){
    UI.updateStats(user);
    UI.renderPlayerCard(user);
  }

  if(window.renderTopStats)
    renderTopStats(user);
});

STATE.subscribe("online",(count)=>{
  if(window.UI)
    UI.setOnline(count);
});

STATE.subscribe("tournament",(t)=>{
  if(window.UI)
    UI.renderTournament(t);
});


console.log("✅ State Engine Ready");

})();
