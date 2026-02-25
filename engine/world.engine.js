/* ===================================================
   TONCRIME WORLD ENGINE
   Persistent City System
   =================================================== */

(function(){

if(!window.db || !window.EVENT){
  console.warn("World engine waiting...");
  return;
}

const WORLD = {

  size:1000,
  position:{x:500,y:500},

  /* ===========================================
     LOAD PLAYER POSITION
  =========================================== */

  async load(){

    if(!GAME.user) return;

    const {data,error}=await db
      .from("users")
      .select("pos_x,pos_y")
      .eq("id",GAME.user.id)
      .single();

    if(error) return;

    this.position.x=data.pos_x;
    this.position.y=data.pos_y;

    EVENT.emit("world:position",this.position);
  },

  /* ===========================================
     MOVE PLAYER
  =========================================== */

  async move(dx,dy){

    let nx=this.position.x+dx;
    let ny=this.position.y+dy;

    nx=Math.max(0,Math.min(this.size,nx));
    ny=Math.max(0,Math.min(this.size,ny));

    this.position={x:nx,y:ny};

    await db.from("users")
      .update({
        pos_x:nx,
        pos_y:ny
      })
      .eq("id",GAME.user.id);

    EVENT.emit("world:move",this.position);
  },

  /* ===========================================
     RANDOM WALK (idle movement)
  =========================================== */

  randomStep(){

    const dx=Math.floor(Math.random()*21)-10;
    const dy=Math.floor(Math.random()*21)-10;

    this.move(dx,dy);
  }

};

window.WORLD=WORLD;


/* ===========================================
   AUTO START
=========================================== */

setTimeout(()=>{
  WORLD.load();
},1500);


/* ===========================================
   WORLD LOOP (simulate city life)
=========================================== */

setInterval(()=>{

  if(!GAME.user) return;

  WORLD.randomStep();

},30000);

console.log("🗺️ World Engine Ready");

})();
