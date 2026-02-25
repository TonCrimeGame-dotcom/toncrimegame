/* ===================================================
   TONCRIME INVENTORY + EQUIPMENT ENGINE
=================================================== */

(function(){

const INVENTORY = {

  items:{},
  equipped:{
    weapon:null
  },

  /* =========================================
     LOAD PLAYER INVENTORY
  ========================================= */

  async load(){

    if(!GAME.user) return;

    const {data,error} = await db
      .from("inventory")
      .select("*")
      .eq("user_id",GAME.user.id);

    if(error){
      console.warn("Inventory load failed");
      return;
    }

    this.items={};

    data.forEach(i=>{
      this.items[i.item_id]=i;
    });

    console.log("🎒 Inventory Loaded");

  },

  /* =========================================
     EQUIP ITEM
  ========================================= */

  equipWeapon(itemId){

    if(!this.items[itemId]) return;

    this.equipped.weapon=this.items[itemId];

    EVENT.emit("weapon:equipped",this.equipped.weapon);

    console.log("⚔ Weapon Equipped:",itemId);
  },

  /* =========================================
     GET PVP SPEED BONUS
  ========================================= */

  getWeaponSpeedBonus(){

    if(!this.equipped.weapon) return 0;

    return this.equipped.weapon.speed_bonus || 0;
  },

  /* =========================================
     APPLY PVP TIME MODIFIER
  ========================================= */

  applyPvPTime(baseTime){

    const bonus=this.getWeaponSpeedBonus();

    const modified =
      baseTime * (1 - bonus/100);

    return Math.max(0.1,modified);
  },

  /* =========================================
     CAN USE BUSINESS
  ========================================= */

  canUseBusiness(){

    const u=GAME.user;

    if(!u) return false;

    return (
      u.level >= 50 ||
      u.premium === true
    );
  }

};

window.INVENTORY=INVENTORY;

console.log("🎒 Inventory Engine Ready");

})();
