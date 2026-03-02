// src/scenes/CoffeeShopScene.js

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
const DAY = 24 * 60 * 60 * 1000;

function safeJSONParse(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function findLikelyPlayerState() {
  // HUD hangi key'i kullanıyorsa yakalamaya çalışıyoruz
  const keys = [
    "tc_player",
    "tc_state",
    "player",
    "playerState",
    "toncrime_player",
    "toncrime_state",
    "game_state",
    "hud_state",
    "hud",
  ];

  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    const obj = safeJSONParse(raw, null);
    if (!obj || typeof obj !== "object") continue;

    // coin/energy benzeri alanlar var mı?
    const hasMoney =
      typeof obj.coin === "number" ||
      typeof obj.yton === "number" ||
      typeof obj.money === "number";
    const hasEnergy =
      typeof obj.energy === "number" ||
      typeof obj.enerji === "number" ||
      (obj.stats && typeof obj.stats.energy === "number");

    if (hasMoney || hasEnergy) return { key: k, obj };
  }

  // fallback: tc_player yoksa oluştur
  const init = {
    name: "Player",
    coin: 500,
    yton: 500,
    energy: 5,
    energyMax: 10,
    xp: 30,
    level: 1,
  };
  localStorage.setItem("tc_player", JSON.stringify(init));
  return { key: "tc_player", obj: init };
}

function savePlayerEverywhere(player) {
  // HUD’un farklı key’leri kullanma ihtimaline karşı çoklu yazıyoruz
  const payloads = [
    ["tc_player", player],
    ["tc_state", player],
    ["playerState", player],
    ["toncrime_state", player],
    ["hud_state", player],
  ];

  for (const [k, v] of payloads) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  }

  // HUD ileride dinleyebilirse diye event de atalım
  try {
    window.dispatchEvent(new CustomEvent("tc:playerUpdate", { detail: player }));
  } catch {}
}

function ensureDrugState() {
  const raw = localStorage.getItem("tc_drugs");
  if (raw) {
    const obj = safeJSONParse(raw, null);
    if (obj && typeof obj === "object") return obj;
  }
  const init = {};
  localStorage.setItem("tc_drugs", JSON.stringify(init));
  return init;
}

function getDrugMeta(drugs, key) {
  if (!drugs[key]) drugs[key] = { uses: 0, firstUseAt: 0, addictedUntil: 0 };
  return drugs[key];
}

function updateAddiction(meta) {
  // 24 saat geçtiyse reset
  if (meta.firstUseAt && Date.now() - meta.firstUseAt >= DAY) {
    meta.uses = 0;
    meta.firstUseAt = 0;
    meta.addictedUntil = 0;
  }
  // 10 kullanım sonrası 24 saat bağımlı
  if (meta.uses >= 10 && (!meta.addictedUntil || meta.addictedUntil <= Date.now())) {
    meta.addictedUntil = Date.now() + DAY;
  }
}

function isAddicted(meta) {
  return meta.addictedUntil && meta.addictedUntil > Date.now();
}

function fmtLeft(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export class CoffeeShopScene {
  constructor({ assets, i18n, scenes }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;

    const found = findLikelyPlayerState();
    this.playerKey = found.key;
    this.player = found.obj;

    this.drugs = ensureDrugState();

    this.menuOpen = false;
    this.page = 0;

    // Kurgusal 30 ürün (gerçek uyuşturucu isimleri yok)
    // fiyat: min 10
    // enerji kazancı: normal %5, bağımlıysa %2
    this.items = [
      { key: "shadow_kush", name: "Shadow Kush", price: 10 },
      { key: "neon_haze", name: "Neon Haze", price: 12 },
      { key: "lemon_sketch", name: "Lemon Sketch", price: 13 },
      { key: "white_veil", name: "White Veil", price: 14 },
      { key: "blue_drift", name: "Blue Drift", price: 15 },
      { key: "gelato_flux", name: "Gelato Flux", price: 16 },
      { key: "zk_sugar", name: "ZK Sugar", price: 16 },
      { key: "gsc_prime", name: "GSC Prime", price: 17 },

      { key: "diamond_dust", name: "Diamond Dust", price: 18 },
      { key: "glass_shard", name: "Glass Shard", price: 18 },
      { key: "neon_crystal", name: "Neon Crystal", price: 19 },
      { key: "midnight_rock", name: "Midnight Rock", price: 19 },
      { key: "mdm_mix", name: "MDM Mix", price: 20 },
      { key: "soft_powder", name: "Soft Powder", price: 20 },
      { key: "hard_powder", name: "Hard Powder", price: 21 },
      { key: "pure_powder", name: "Pure Powder", price: 22 },

      { key: "red_crystal", name: "Red Crystal", price: 22 },
      { key: "ice_kristal", name: "Ice Kristal", price: 23 },
      { key: "gold_flake", name: "Gold Flake", price: 24 },
      { key: "black_tar", name: "Black Tar", price: 25 },
      { key: "silver_line", name: "Silver Line", price: 26 },
      { key: "night_snow", name: "Night Snow", price: 27 },
      { key: "acid_drop", name: "Acid Drop", price: 28 },
      { key: "astro_tabs", name: "Astro Tabs", price: 29 },

      { key: "retro_pills", name: "Retro Pills", price: 30 },
      { key: "neon_pills", name: "Neon Pills", price: 32 },
      { key: "shadow_tabs", name: "Shadow Tabs", price: 34 },
      { key: "velvet_powder", name: "Velvet Powder", price: 36 },
      { key: "chrome_dust", name: "Chrome Dust", price: 38 },
      { key: "ultra_crystal", name: "Ultra Crystal", price: 40 },
    ];

    this.PAGE_SIZE = 8;

    // ✅ Arka plandaki kitabın tıklama alanı (yüzde) — gerekirse az oynarsın
    this.BOOK_HIT = { x: 0.22, y: 0.40, w: 0.34, h: 0.40 };

    // ✅ Menü artık büyük ve ortalı
    this.MENU_RECT = { x: 0.10, y: 0.05, w: 0.80, h: 0.90 };

    // ✅ Yeni menu görseline göre kutu yerleşimi (daha iyi oturur)
    this.BOX_LAYOUT = {
      leftX: 0.28,
      rightX: 0.72,
      startY: 0.33,
      gapY: 0.155,
    };

    // Kutuların ölçüsü (menu rect içinde)
    this.BOX_SIZE = { w: 0.36, h: 0.105 }; // genişlik/yükseklik yüzde

    // Kapatma / sayfa alanları (menu rect içinde yüzde)
    this.CLOSE_HIT = { x: 0.89, y: 0.05, w: 0.08, h: 0.08 };
    this.PREV_HIT = { x: 0.10, y: 0.92, w: 0.18, h: 0.06 };
    this.NEXT_HIT = { x: 0.72, y: 0.92, w: 0.18, h: 0.06 };

    this._clickHandler = null;
  }

  async onEnter() {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    if (!this._clickHandler) {
      this._clickHandler = (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = canvas.width / rect.width;
        const sy = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * sx;
        const y = (e.clientY - rect.top) * sy;
        this._handleClick(x, y, canvas.width, canvas.height);
      };
      canvas.addEventListener("click", this._clickHandler);
    }
  }

  onExit() {
    const canvas = document.querySelector("canvas");
    if (canvas && this._clickHandler) {
      canvas.removeEventListener("click", this._clickHandler);
      this._clickHandler = null;
    }
  }

  _rectAbsFromPct(p, W, H) {
    return { x: p.x * W, y: p.y * H, w: p.w * W, h: p.h * H };
  }

  _rectAbsInside(parent, p) {
    return {
      x: parent.x + p.x * parent.w,
      y: parent.y + p.y * parent.h,
      w: p.w * parent.w,
      h: p.h * parent.h,
    };
  }

  _inRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  _maxPage() {
    return Math.max(0, Math.ceil(this.items.length / this.PAGE_SIZE) - 1);
  }

  _getVisibleItems() {
    const start = this.page * this.PAGE_SIZE;
    return this.items.slice(start, start + this.PAGE_SIZE);
  }

  _getBoxes(menuAbs) {
    const boxW = menuAbs.w * this.BOX_SIZE.w;
    const boxH = menuAbs.h * this.BOX_SIZE.h;

    const cxL = menuAbs.x + this.BOX_LAYOUT.leftX * menuAbs.w;
    const cxR = menuAbs.x + this.BOX_LAYOUT.rightX * menuAbs.w;
    const startY = menuAbs.y + this.BOX_LAYOUT.startY * menuAbs.h;
    const gap = this.BOX_LAYOUT.gapY * menuAbs.h;

    const boxes = [];
    for (let i = 0; i < 4; i++) {
      const cy = startY + i * gap;
      boxes.push({ x: cxL - boxW / 2, y: cy - boxH / 2, w: boxW, h: boxH });
    }
    for (let i = 0; i < 4; i++) {
      const cy = startY + i * gap;
      boxes.push({ x: cxR - boxW / 2, y: cy - boxH / 2, w: boxW, h: boxH });
    }
    return boxes;
  }

  _getMoney() {
    // HUD “Coin: 0” gösteriyor → coin varsa onu baz al
    if (typeof this.player.coin === "number") return this.player.coin;
    if (typeof this.player.yton === "number") return this.player.yton;
    if (typeof this.player.money === "number") return this.player.money;
    return 0;
  }

  _setMoney(v) {
    v = Math.max(0, Math.floor(v));
    if (typeof this.player.coin === "number") this.player.coin = v;
    if (typeof this.player.yton === "number") this.player.yton = v;
    if (typeof this.player.money === "number") this.player.money = v;

    // hiçbiri yoksa coin+yton setle
    if (
      typeof this.player.coin !== "number" &&
      typeof this.player.yton !== "number" &&
      typeof this.player.money !== "number"
    ) {
      this.player.coin = v;
      this.player.yton = v;
    }
  }

  _getEnergy() {
    if (typeof this.player.energy === "number") return this.player.energy;
    if (typeof this.player.enerji === "number") return this.player.enerji;
    if (this.player.stats && typeof this.player.stats.energy === "number") return this.player.stats.energy;
    return 0;
  }

  _getEnergyMax() {
    if (typeof this.player.energyMax === "number") return this.player.energyMax;
    if (typeof this.player.enerjiMax === "number") return this.player.enerjiMax;
    if (this.player.stats && typeof this.player.stats.energyMax === "number") return this.player.stats.energyMax;
    return 10;
  }

  _setEnergy(v) {
    v = clamp(v, 0, this._getEnergyMax());
    if (typeof this.player.energy === "number") this.player.energy = v;
    if (typeof this.player.enerji === "number") this.player.enerji = v;
    if (this.player.stats && typeof this.player.stats.energy === "number") this.player.stats.energy = v;

    // hiçbiri yoksa energy alanı ekle
    if (
      typeof this.player.energy !== "number" &&
      typeof this.player.enerji !== "number" &&
      !(this.player.stats && typeof this.player.stats.energy === "number")
    ) {
      this.player.energy = v;
    }
  }

  _handleClick(x, y, W, H) {
    // addiction tick
    for (const k of Object.keys(this.drugs)) updateAddiction(this.drugs[k]);
    localStorage.setItem("tc_drugs", JSON.stringify(this.drugs));

    const bookAbs = this._rectAbsFromPct(this.BOOK_HIT, W, H);

    // Menü kapalı → kitap alanına tıkla → aç
    if (!this.menuOpen) {
      if (this._inRect(x, y, bookAbs)) {
        this.menuOpen = true;
      }
      return;
    }

    // Menü açık
    const menuAbs = this._rectAbsFromPct(this.MENU_RECT, W, H);

    // Menü dışına tıkla → kapat
    if (!this._inRect(x, y, menuAbs)) {
      this.menuOpen = false;
      return;
    }

    // Close
    const closeAbs = this._rectAbsInside(menuAbs, this.CLOSE_HIT);
    if (this._inRect(x, y, closeAbs)) {
      this.menuOpen = false;
      return;
    }

    // Prev/Next
    const prevAbs = this._rectAbsInside(menuAbs, this.PREV_HIT);
    const nextAbs = this._rectAbsInside(menuAbs, this.NEXT_HIT);

    if (this._inRect(x, y, prevAbs)) {
      this.page = clamp(this.page - 1, 0, this._maxPage());
      return;
    }
    if (this._inRect(x, y, nextAbs)) {
      this.page = clamp(this.page + 1, 0, this._maxPage());
      return;
    }

    // Ürün kutuları
    const visible = this._getVisibleItems();
    const boxes = this._getBoxes(menuAbs);

    for (let i = 0; i < boxes.length; i++) {
      if (!visible[i]) continue;
      if (this._inRect(x, y, boxes[i])) {
        this._buy(visible[i]);
        return;
      }
    }
  }

  _buy(item) {
    // Player snapshot güncelle (HUD key'i değiştiyse)
    const found = findLikelyPlayerState();
    this.playerKey = found.key;
    this.player = found.obj;

    const meta = getDrugMeta(this.drugs, item.key);
    updateAddiction(meta);

    if (!meta.firstUseAt) meta.firstUseAt = Date.now();

    const addicted = isAddicted(meta);
    const energyPct = addicted ? 2 : 5;

    const money = this._getMoney();
    if (money < item.price) return;

    // ödeme
    this._setMoney(money - item.price);

    // enerji ekle (max 10 üzerinden)
    const eMax = this._getEnergyMax();
    const gain = Math.max(1, Math.floor((eMax * energyPct) / 100));
    this._setEnergy(this._getEnergy() + gain);

    // kullanım
    meta.uses += 1;
    updateAddiction(meta);

    localStorage.setItem("tc_drugs", JSON.stringify(this.drugs));
    savePlayerEverywhere(this.player);
  }

  update(dt) {
    // addiction reset
    let changed = false;
    for (const k of Object.keys(this.drugs)) {
      const before = JSON.stringify(this.drugs[k]);
      updateAddiction(this.drugs[k]);
      if (JSON.stringify(this.drugs[k]) !== before) changed = true;
    }
    if (changed) localStorage.setItem("tc_drugs", JSON.stringify(this.drugs));
  }

  render(ctx, W, H) {
    // BG: coffeeshop.png
    const bg =
      this.assets.get?.("coffeeshop_bg") ||
      this.assets.get?.("coffeeshop") ||
      this.assets.images?.coffeeshop_bg ||
      this.assets.images?.coffeeshop;

    if (bg) {
      const s = Math.max(W / bg.width, H / bg.height);
      const dw = bg.width * s;
      const dh = bg.height * s;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      ctx.drawImage(bg, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, W, H);
    }

    if (!this.menuOpen) return;

    const menuAbs = this._rectAbsFromPct(this.MENU_RECT, W, H);

    // karartma
    ctx.fillStyle = "rgba(0,0,0,0.20)";
    ctx.fillRect(0, 0, W, H);

    // Menu image: coffeeshop_menu.png
    const menuImg =
      this.assets.get?.("coffeeshop_menu") ||
      this.assets.images?.coffeeshop_menu;

    if (menuImg) {
      ctx.drawImage(menuImg, menuAbs.x, menuAbs.y, menuAbs.w, menuAbs.h);
    } else {
      ctx.fillStyle = "rgba(20,20,25,0.92)";
      ctx.fillRect(menuAbs.x, menuAbs.y, menuAbs.w, menuAbs.h);
    }

    // yazıları kutulara oturt
    const visible = this._getVisibleItems();
    const boxes = this._getBoxes(menuAbs);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < boxes.length; i++) {
      const item = visible[i];
      if (!item) continue;

      const r = boxes[i];
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;

      const meta = getDrugMeta(this.drugs, item.key);
      updateAddiction(meta);

      const addicted = isAddicted(meta);
      const energyPct = addicted ? 2 : 5;

      // Hafif glow
      ctx.shadowColor = "rgba(255,215,0,0.55)";
      ctx.shadowBlur = 8;

      // Başlık
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px system-ui";
      ctx.fillText(item.name, cx, cy - 16);

      // Alt satır (fiyat + enerji)
      ctx.font = "16px system-ui";
      ctx.fillText(`${item.price} YTON | +%${energyPct}`, cx, cy + 6);

      // Küçük satır (kullanım/bağımlılık)
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "12px system-ui";
      if (addicted) {
        ctx.fillText(`Bağımlılık: ${fmtLeft(meta.addictedUntil - Date.now())}`, cx, cy + 24);
      } else {
        ctx.fillText(`Kullanım: ${meta.uses}/10`, cx, cy + 24);
      }
    }

    // sayfa
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "14px system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`Sayfa ${this.page + 1}/${this._maxPage() + 1}`, menuAbs.x + 12, menuAbs.y + menuAbs.h - 18);
  }
        }
