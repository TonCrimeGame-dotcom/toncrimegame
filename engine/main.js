const store = new Store(initial);

// autosave
let _lastSaveAt = 0;
(function autosaveLoop() {
  const now = Date.now();
  if (now - _lastSaveAt > 300) {
    saveStore(store.get());
    _lastSaveAt = now;
  }
  requestAnimationFrame(autosaveLoop);
})();

/* ===== ENERGY REGEN ===== */
function tickEnergy() {
  const s = store.get();
  const p = s.player;
  if (!p) return;

  const now = Date.now();
  const interval = Math.max(10_000, Number(p.energyIntervalMs || 300000));
  const maxE = Math.max(1, Number(p.energyMax || 10));
  const e = Math.max(0, Math.min(maxE, Number(p.energy || 0)));

  if (e >= maxE) return;

  const elapsed = now - Number(p.lastEnergyAt || now);
  if (elapsed < interval) return;

  const gained = Math.floor(elapsed / interval);
  if (gained <= 0) return;

  const newE = Math.min(maxE, e + gained);
  const newLast = Number(p.lastEnergyAt || now) + gained * interval;
  store.set({ player: { ...p, energy: newE, lastEnergyAt: newLast } });
}
setInterval(tickEnergy, 1000);

/* ===== I18N ===== */
const i18n = new I18n(store);
i18n.register({
  tr: { loading: "Yükleniyor..." },
  en: { loading: "Loading..." },
});

/* ===== ASSETS ===== */
const assets = new Assets();
function addImage(key, url) {
  if (typeof assets.image === "function") return assets.image(key, url);
  if (typeof assets.loadImage === "function") return assets.loadImage(key, url);
  if (typeof assets.addImage === "function") return assets.addImage(key, url);
}
addImage("background", "./src/assets/ui/background.jpg");
addImage("missions", "./src/assets/missions.jpg");
addImage("pvp", "./src/assets/pvp.jpg");
addImage("weapons", "./src/assets/weapons.jpg");
addImage("nightclub", "./src/assets/nightclub.jpg");
addImage("coffeeshop", "./src/assets/coffeeshop.jpg");
addImage("xxx", "./src/assets/xxx.jpg");

/* ===== INPUT / SCENES ===== */
const input = new Input(canvas);
const scenes = new SceneManager();

// ✅ GLOBAL DEBUG (SADECE BURADA OLSUN)
// ⚠️ main.js içinde başka yerde window.tcScenes = scenes varsa SİL
window.tcStore = store;
window.tcScenes = scenes;

scenes.register("boot", new BootScene({ assets, i18n, scenes }));
scenes.register("home", new HomeScene({ store, input, i18n, assets, scenes }));
scenes.register("coffeeshop", new CoffeeShopScene({ store, input, i18n, assets, scenes }));

// placeholders
scenes.register("missions", new SimpleScreenScene({ i18n, titleKey: "Missions" }));
scenes.register("dealer", new SimpleScreenScene({ i18n, titleKey: "Dealer" }));
scenes.register("pvp", new SimpleScreenScene({ i18n, titleKey: "PvP" }));
scenes.register("clan", new SimpleScreenScene({ i18n, titleKey: "Clan" }));
scenes.register("nightclub", new SimpleScreenScene({ i18n, titleKey: "Nightclub" }));
scenes.register("xxx", new SimpleScreenScene({ i18n, titleKey: "XXX" }));

const engine = new Engine({ canvas, ctx, input, scenes });

// keep safe area updated
(function safeAreaLoop() {
  store.set({ ui: { ...store.get().ui, safe: getSafeArea() } });
  requestAnimationFrame(safeAreaLoop);
})();

// start overlay motors
startHud(store);
startChat(store);
startMenu(store);

// start game
scenes.go("boot");
engine.start();
