/* ===================================================
   TONCRIME POLICE AI ENGINE
   City Patrol System
   =================================================== */

(function(){

if(!window.db || !window.EVENT){
  console.warn("Police engine waiting...");
  return;
}

const POLICE = {

  units:[],
  worldSize:1000,

  /* ===========================================
     LOAD UNITS
  =========================================== */

  async load(){

    const {data,error}=await db
      .from("police_units")
      .select("*");

    if(error) return;

    this.units=data || [];
  },

  /* ===========================================
     RANDOM MOVE
  =========================================== */

  randomMove(unit){

    const dx=Math.floor(Math.random()*41)-20;
    const dy=Math.floor(Math.random()*41)-20;

    unit.pos_x=Math.max(0,
      Math.min(this.worldSize,unit.pos_x+dx));

    unit.pos_y=Math.max(0,
      Math.min(this.worldSize,unit.pos_y+dy));
  },

  /* ===========================================
     DISTANCE CHECK
  =========================================== */

  distance(a,b){

    const dx=a.x-b.x;
    const dy=a.y-b.y;

    return Math.sqrt(dx*dx+dy*dy);
  },

  /* ===========================================
     FIND TARGET
  =========================================== */

  async scanForCriminals(unit){

    const {data}=await db
      .from("users")
      .select("id,pos_x,pos_y,heat")
      .gte("heat",70);

    if(!data) return;

    data.forEach(player=>{

      const dist=this.distance(
        {x:unit.pos_x,y:unit.pos_y},
        {x:player.pos_x,y:player.pos_y}
      );

      if(dist < 80){
        unit.state="chase";
        unit.target_id=player.id;

        EVENT.emit("police:chase",player);
      }

    });
  },

  /* ===========================================
     UPDATE UNIT
  =========================================== */

  async updateUnit(unit){

    if(unit.state==="patrol"){
      this.randomMove(unit);
      await this.scanForCriminals(unit);
    }

    if(unit.state==="chase" && unit.target_id){

      const {data:target}=await db
        .from("users")
        .select("pos_x,pos_y")
        .eq("id",unit.target_id)
        .single();

      if(target){

        unit.pos_x += (target.pos_x-unit.pos_x)*0.2;
        unit.pos_y += (target.pos_y-unit.pos_y)*0.2;

        const dist=this.distance(
          {x:unit.pos_x,y:unit.pos_y},
          {x:target.pos_x,y:target.pos_y}
        );

        if(dist<15){

          EVENT.emit("police:raid",{
            target:unit.target_id
          });

          unit.state="patrol";
          unit.target_id=null;
        }
      }
    }

    await db.from("police_units")
      .update({
        pos_x:Math.floor(unit.pos_x),
        pos_y:Math.floor(unit.pos_y),
        state:unit.state,
        target_id:unit.target_id
      })
      .eq("id",unit.id);
  },

  /* ===========================================
     LOOP
  =========================================== */

  async loop(){

    for(const unit of this.units){
      await this.updateUnit(unit);
    }
  }

};

window.POLICE=POLICE;


/* ===========================================
   AUTO START
=========================================== */

(async()=>{

  await POLICE.load();

  setInterval(()=>{
    POLICE.loop();
  },8000);

})();

console.log("🚓 Police AI Ready");

})();
