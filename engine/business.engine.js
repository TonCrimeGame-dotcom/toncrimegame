/* ===================================================
   TONCRIME BUSINESS ENGINE
   GLOBAL + PLAYER ECONOMY CORE
=================================================== */

GAME.business = {
  initialized:false
};

/* ===================================================
   BUILDING TYPES
=================================================== */

const BUILDINGS = {
  COFFEE:"coffee",
  NIGHTCLUB:"nightclub",
  BROTHEL:"brothel",
  WEAPON:"weapon"
};

/* ===================================================
   SERVER DAILY PRODUCTION
   (coffee + nightclub only)
=================================================== */

async function serverProductionReset(){

  const today =
    new Date().toISOString().slice(0,10);

  const { data:markets } = await db
    .from("server_market")
    .select("*");

  for(const m of markets){

    if(
      m.building_type !== BUILDINGS.COFFEE &&
      m.building_type !== BUILDINGS.NIGHTCLUB
    ) continue;

    if(m.last_reset === today) continue;

    await db.from("server_market")
      .update({
        stock:1000000,
        last_reset:today
      })
      .eq("id",m.id);
  }

  console.log("Server production reset");
}

/* ===================================================
   PLAYER BUSINESS ACCESS
=================================================== */

function canOwnBusiness(){

  return GAME.canBusiness === true;
}

/* ===================================================
   BUY STOCK FROM SERVER
=================================================== */

async function buyServerStock(productId,qty){

  if(!canOwnBusiness()) return;

  const { data:product } = await db
    .from("server_market")
    .select("*")
    .eq("id",productId)
    .single();

  if(!product) return;

  if(product.stock < qty){
    console.log("Server stock empty");
    return;
  }

  const cost = product.price * qty;

  const paid = await spendYton(cost);
  if(!paid) return;

  await db.from("server_market")
    .update({
      stock:product.stock - qty
    })
    .eq("id",productId);

  /* add to player inventory */
  await db.from("player_business_stock")
    .insert({
      owner_id:CONFIG.USER_ID,
      product_id:productId,
      quantity:qty,
      sell_price:product.price
    });

  console.log("Stock purchased");
}

/* ===================================================
   PLAYER SELL ITEM
=================================================== */

async function buyFromMarket(stockId,qty){

  const { data:item } = await db
    .from("player_business_stock")
    .select("*")
    .eq("id",stockId)
    .single();

  if(!item) return;

  if(item.quantity < qty) return;

  const cost = item.sell_price * qty;

  const paid = await spendYton(cost);
  if(!paid) return;

  await db.from("player_business_stock")
    .update({
      quantity:item.quantity - qty
    })
    .eq("id",stockId);

  /* seller earns */
  await db.rpc("add_yton_to_user",{
    uid:item.owner_id,
    amount:cost
  });

  console.log("Market purchase complete");
}

/* ===================================================
   ADDICTION SYSTEM
   (coffee & nightclub only)
=================================================== */

function applyAddiction(product){

  if(
    product.building_type !== BUILDINGS.COFFEE &&
    product.building_type !== BUILDINGS.NIGHTCLUB
  ) return product.energy_gain;

  const key =
    "addiction_"+product.id;

  let count =
    Number(localStorage.getItem(key)||0);

  count++;

  localStorage.setItem(key,count);

  const modifier =
    Math.pow(0.98,count);

  return Math.floor(
    product.energy_gain * modifier
  );
}

/* ===================================================
   CONSUME PRODUCT
=================================================== */

async function consumeProduct(product){

  let energyGain =
    applyAddiction(product);

  GAME.user.energy =
    Math.min(
      CONFIG.MAX_ENERGY,
      GAME.user.energy + energyGain
    );

  await db.from("users")
    .update({
      energy:GAME.user.energy
    })
    .eq("id",CONFIG.USER_ID);

  renderStats();
}

/* ===================================================
   BROTHEL SERVICE (NO PRODUCTION)
=================================================== */

async function useBrothel(service){

  const paid = await spendYton(service.price);
  if(!paid) return;

  GAME.user.energy =
    Math.min(
      CONFIG.MAX_ENERGY,
      GAME.user.energy + service.energy
    );

  await db.from("users")
    .update({
      energy:GAME.user.energy
    })
    .eq("id",CONFIG.USER_ID);

  renderStats();
}

/* ===================================================
   WEAPON SHOP (SERVER ONLY)
=================================================== */

async function buyWeapon(weapon){

  const paid = await spendYton(weapon.price);
  if(!paid) return;

  await addItem(weapon.id,1);

  console.log("Weapon purchased");
}

/* ===================================================
   BUSINESS LOOP
=================================================== */

async function businessLoop(){

  await serverProductionReset();
}

/* ===================================================
   INIT
=================================================== */

async function initBusiness(){

  if(GAME.business.initialized) return;

  GAME.business.initialized=true;

  await serverProductionReset();

  setInterval(businessLoop,60000);

  console.log("Business Engine Ready");
}

document.addEventListener(
  "DOMContentLoaded",
  initBusiness
);
