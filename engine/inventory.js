/* ===================================================
   TONCRIME INVENTORY SYSTEM
   =================================================== */

const INVENTORY = {
  items: [],
  loaded: false
};

/* ================= LOAD INVENTORY ================= */

async function loadInventory(){

  if(INVENTORY.loaded) return INVENTORY.items;

  const {data,error}=await db
    .from("inventory")
    .select("*")
    .eq("user_id",CONFIG.USER_ID);

  if(error){
    console.error("Inventory load error",error);
    return [];
  }

  INVENTORY.items=data || [];
  INVENTORY.loaded=true;

  renderInventory();
  return INVENTORY.items;
}

/* ================= ADD ITEM ================= */

async function addItem(item){

  const existing=INVENTORY.items.find(
    i=>i.item_code===item.code
  );

  /* already owned */
  if(existing){

    await db.from("inventory")
      .update({qty:existing.qty+1})
      .eq("id",existing.id);

    existing.qty++;

  }else{

    const {data}=await db.from("inventory")
      .insert({
        user_id:CONFIG.USER_ID,
        item_code:item.code,
        item_name:item.name,
        qty:1,
        power:item.power || 0
      })
      .select()
      .single();

    INVENTORY.items.push(data);
  }

  renderInventory();
}

/* ================= REMOVE ITEM ================= */

async function removeItem(id){

  await db.from("inventory")
    .delete()
    .eq("id",id);

  INVENTORY.items =
    INVENTORY.items.filter(i=>i.id!==id);

  renderInventory();
}

/* ================= TOTAL POWER ================= */

function getInventoryPower(){

  let total=0;

  INVENTORY.items.forEach(i=>{
    total += (i.power||0) * i.qty;
  });

  return total;
}

/* ================= UI ================= */

function renderInventory(){

  const el=document.getElementById("inventoryArea");
  if(!el) return;

  if(INVENTORY.items.length===0){
    el.innerHTML="Envanter boş";
    return;
  }

  let html="";

  INVENTORY.items.forEach(i=>{
    html+=`
      <div class="inv-item">
        <b>${i.item_name}</b><br>
        Adet: ${i.qty}<br>
        Güç: +${i.power*i.qty}
      </div>
    `;
  });

  el.innerHTML=html;
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded",()=>{
  loadInventory();
});
