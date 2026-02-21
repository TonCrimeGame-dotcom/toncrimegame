/* ===================================================
   INVENTORY ENGINE
=================================================== */

GAME.inventory = [];

async function loadInventory() {

  const { data, error } = await db
    .from("inventory")
    .select("*")
    .eq("user_id", CONFIG.USER_ID);

  if (error) {
    console.error("Inventory load error", error);
    return;
  }

  GAME.inventory = data || [];
}

async function addItem(itemId, qty = 1) {

  await db.from("inventory").insert({
    user_id: CONFIG.USER_ID,
    item_id: itemId,
    quantity: qty
  });

  await loadInventory();
}

function hasItem(itemId) {
  return GAME.inventory.find(i => i.item_id === itemId);
}
