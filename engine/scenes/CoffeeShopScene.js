// src/scenes/CoffeeShopScene.js
export class CoffeeShopScene {
  constructor({ assets, i18n, scenes, state }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;

    // Esnek state: state.player / state / window.gameState
    this.state = state || null;

    // Menü durumu
    this.menuOpen = false;
    this.page = 0;
    this.perPage = 10;

    // Pointer
    this._ptr = { x: 0, y: 0, down: false, pressed: false };

    // Canvas bağlandı mı?
    this._bound = false;

    // Menü görselinin orijinal boyutu (senin attığın görsel: 1024x1536)
    this.MW = 1024;
    this.MH = 1536;

    // Slot koordinatları (menü PNG içindeki gerçek yerleşim mantığıyla sabit)
    // 5 satır, her satırda: sol slot + sağ slot
    // Kutuların iç yazı alanı için (slotun içine biraz padding bırakacağız).
    this.SLOTS = [
      // row1
      { l: this._r(120, 245, 360, 98), r: this._r(545, 245, 360, 98) },
      // row2
      { l: this._r(120, 375, 360, 98), r: this._r(545, 375, 360, 98) },
      // row3
      { l: this._r(120, 505, 360, 98), r: this._r(545, 505, 360, 98) },
      // row4
      { l: this._r(120, 635, 360, 98), r: this._r(545, 635, 360, 98) },
      // row5
      { l: this._r(120, 765, 360, 98), r: this._r(545, 765, 360, 98) },
    ];

    // Sayfa okları (menü üzerinde alt kısım)
    this.ARROW_LEFT = this._r(360, 1385, 110, 110);
    this.ARROW_RIGHT = this._r(555, 1385, 110, 110);

    // Menü kapatma (sağ üst X yoksa ESC ile kapatacağız)
    // İstersen buraya X alanı da eklersin:
    this.CLOSE_RECT = this._r(900, 170, 90, 90);

    // BG’deki kitap tıklama alanı (coffeeshop.png içinde kitap)
    // Bu alanı ekrana göre ölçekleyeceğiz.
    // (Bu değerler çoğu sahnede işe yarar; gerekirse tek yer burası.)
    this.BOOK_HIT = { x: 0.33, y: 0.44, w: 0.18, h: 0.28 };

    // Kurgusal ürün listesi (30 adet)
    this.PRODUCTS = PRODUCTS_30;
  }

  _r(x, y, w, h) {
    return { x, y, w, h };
  }

  // State çekme (player objesi)
  _player() {
    if (this.state?.player) return this.state.player;
    if (this.state?.coin !== undefined || this.state?.yton !== undefined) return this.state;
    if (window.gameState?.player) return window.gameState.player;
    if (window.gameState) return window.gameState;
    // fallback
    return (this._fallbackPlayer ||= {
      yton: 999,
      energy: 5,
      energyMax: 10,
      addiction: {}, // key -> { uses, lastUseAt, penaltyPct }
    });
  }

  _getYton(p) {
    return Number(p.yton ?? p.coin ?? 0);
  }
  _setYton(p, v) {
    if (p.yton !== undefined) p.yton = v;
    else p.coin = v;
  }
  _getEnergy(p) {
    return Number(p.energy ?? 0);
  }
  _getEnergyMax(p) {
    return Number(p.energyMax ?? 10);
  }
  _setEnergy(p, v) {
    p.energy = v;
  }

  _now() {
    return Date.now();
  }

  _ensureAddictionBucket(p) {
    if (!p.addiction) p.addiction = {};
    return p.addiction;
  }

  _getAddiction(p, key) {
    const bucket = this._ensureAddictionBucket(p);
    if (!bucket[key]) bucket[key] = { uses: 0, lastUseAt: 0, penaltyPct: 0 };
    return bucket[key];
  }

  _resetIfExpired(entry) {
    // 24 saat sonra reset
    const DAY = 24 * 60 * 60 * 1000;
    if (entry.lastUseAt && this._now() - entry.lastUseAt >= DAY) {
      entry.uses = 0;
      entry.penaltyPct = 0;
      entry.lastUseAt = 0;
    }
  }

  _bindPointer(canvas) {
    if (this._bound || !canvas) return;
    this._bound = true;

    const toLocal = (ev) => {
      const rect = canvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
      return { x, y };
    };

    canvas.addEventListener("pointerdown", (ev) => {
      const p = toLocal(ev);
      this._ptr.x = p.x;
      this._ptr.y = p.y;
      this._ptr.down = true;
      this._ptr.pressed = true; // tek frame’lik click
    });

    canvas.addEventListener("pointermove", (ev) => {
      const p = toLocal(ev);
      this._ptr.x = p.x;
      this._ptr.y = p.y;
    });

    const up = () => {
      this._ptr.down = false;
    };
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);

    window.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") this.menuOpen = false;
      if (!this.menuOpen) return;
      if (ev.key === "ArrowLeft") this._prevPage();
      if (ev.key === "ArrowRight") this._nextPage();
    });
  }

  _hitRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  _fitText(ctx, text, maxW, startPx, minPx, weight = 800) {
    let size = startPx;
    while (size >= minPx) {
      ctx.font = `${weight} ${size}px system-ui`;
      if (ctx.measureText(text).width <= maxW) return size;
      size -= 1;
    }
    return minPx;
  }

  _ellipsis(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    const ell = "…";
    let t = text;
    while (t.length > 0) {
      t = t.slice(0, -1);
      if (ctx.measureText(t + ell).width <= maxW) return t + ell;
    }
    return ell;
  }

  onEnter({ ctx } = {}) {
    // Engine ctx veriyorsa kullanırız; vermiyorsa render’da yakalayıp bağlarız
    if (ctx?.canvas) this._bindPointer(ctx.canvas);
  }

  update() {
    // pressed flag’i sadece 1 tick çalışsın
    // Engine update loop çağırıyorsa burada sıfırlarız; çağırmıyorsa render sonunda da sıfırlıyoruz.
  }

  render(ctx, w, h) {
    // canvas bağla (en güvenlisi render anı)
    if (ctx?.canvas) this._bindPointer(ctx.canvas);

    // BG çiz
    const bg = this.assets?.getImage?.("coffeeshop_bg");
    if (bg) ctx.drawImage(bg, 0, 0, w, h);
    else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }

    // Menü kapalıyken: kitap hotspot
    if (!this.menuOpen) {
      this._handleBookClick(w, h);
      // İSTEK: “Kitaba tıkla -> Menü aç” yazısı OLMASIN, o yüzden çizmiyoruz.
    } else {
      this._drawMenu(ctx, w, h);
      this._handleMenuClick(ctx, w, h);
    }

    // pressed tek frame
    this._ptr.pressed = false;
  }

  _handleBookClick(w, h) {
    if (!this._ptr.pressed) return;

    const r = {
      x: this.BOOK_HIT.x * w,
      y: this.BOOK_HIT.y * h,
      w: this.BOOK_HIT.w * w,
      h: this.BOOK_HIT.h * h,
    };

    if (this._hitRect(this._ptr.x, this._ptr.y, r)) {
      this.menuOpen = true;
    }
  }

  _menuLayout(w, h) {
    const menuImg = this.assets?.getImage?.("coffeeshop_menu");
    const mw = menuImg?.width || this.MW;
    const mh = menuImg?.height || this.MH;

    // ekrana sığdır: yüksekliğin %88’i
    const scale = Math.min((w * 0.92) / mw, (h * 0.88) / mh);
    const drawW = mw * scale;
    const drawH = mh * scale;
    const ox = (w - drawW) / 2;
    const oy = (h - drawH) / 2;
    return { ox, oy, scale, drawW, drawH, mw, mh };
  }

  _toScreenRect(layout, r) {
    return {
      x: layout.ox + r.x * layout.scale,
      y: layout.oy + r.y * layout.scale,
      w: r.w * layout.scale,
      h: r.h * layout.scale,
    };
  }

  _drawMenu(ctx, w, h) {
    const menuImg = this.assets?.getImage?.("coffeeshop_menu");
    if (!menuImg) {
      // görsel yoksa crash olmasın
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      ctx.font = "16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Menu image missing: coffeeshop_menu", w / 2, h / 2);
      return;
    }

    // arka karartma
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, w, h);

    const layout = this._menuLayout(w, h);

    // Menü PNG
    ctx.drawImage(menuImg, layout.ox, layout.oy, layout.drawW, layout.drawH);

    // ürünler
    const pageCount = Math.ceil(this.PRODUCTS.length / this.perPage);
    const items = this.PRODUCTS.slice(this.page * this.perPage, (this.page + 1) * this.perPage);

    // 10 slot: 5 satır x 2 kolon
    const slots = [];
    for (let i = 0; i < 5; i++) {
      slots.push(this._toScreenRect(layout, this.SLOTS[i].l));
      slots.push(this._toScreenRect(layout, this.SLOTS[i].r));
    }

    ctx.textAlign = "left";
    ctx.fillStyle = "#f5f7ff";

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const item = items[i];
      if (!item) continue;

      // slot içine padding
      const padX = slot.w * 0.06;
      const padY = slot.h * 0.14;
      const tx = slot.x + padX;
      const maxW = slot.w - padX * 2;

      // 3 satır yazı: ad / fiyat+enerji / kullanım
      // Boyutları slot yüksekliğine göre dinamik ayarla
      const titleSize = this._fitText(ctx, item.name.toUpperCase(), maxW, Math.max(20, slot.h * 0.32), Math.max(12, slot.h * 0.22), 900);
      ctx.font = `900 ${titleSize}px system-ui`;
      const title = this._ellipsis(ctx, item.name.toUpperCase(), maxW);
      ctx.fillText(title, tx, slot.y + padY + titleSize);

      const line2 = `${item.price} YTON  |  +%${item.energyPct} Enerji`;
      const line2Size = this._fitText(ctx, line2, maxW, Math.max(16, slot.h * 0.22), Math.max(11, slot.h * 0.17), 800);
      ctx.font = `800 ${line2Size}px system-ui`;
      ctx.fillText(this._ellipsis(ctx, line2, maxW), tx, slot.y + padY + titleSize + slot.h * 0.28);

      const p = this._player();
      const ad = this._getAddiction(p, item.key);
      this._resetIfExpired(ad);

      const usedTxt = `Kullanım: ${ad.uses}/10`;
      const line3Size = Math.max(11, slot.h * 0.16);
      ctx.font = `700 ${line3Size}px system-ui`;
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.fillText(usedTxt, tx, slot.y + slot.h - padY * 0.55);
      ctx.fillStyle = "#f5f7ff";
    }

    // Sayfa yazısı + oklar
    ctx.textAlign = "center";
    ctx.font = `800 ${Math.max(14, h * 0.018)}px system-ui`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(`Sayfa ${this.page + 1}/${pageCount}`, w / 2, layout.oy + layout.drawH - 12);

    // okları görünür yap (görselde yoksa bile)
    const L = this._toScreenRect(layout, this.ARROW_LEFT);
    const R = this._toScreenRect(layout, this.ARROW_RIGHT);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath(); ctx.roundRect(L.x, L.y, L.w, L.h, 16); ctx.fill();
    ctx.beginPath(); ctx.roundRect(R.x, R.y, R.w, R.h, 16); ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `900 ${Math.max(28, L.h * 0.45)}px system-ui`;
    ctx.fillText("‹", L.x + L.w / 2, L.y + L.h * 0.68);
    ctx.fillText("›", R.x + R.w / 2, R.y + R.h * 0.68);
  }

  _handleMenuClick(ctx, w, h) {
    if (!this._ptr.pressed) return;

    const layout = this._menuLayout(w, h);

    // Menü dışına tıklayınca kapat
    const inside = this._hitRect(this._ptr.x, this._ptr.y, { x: layout.ox, y: layout.oy, w: layout.drawW, h: layout.drawH });
    if (!inside) {
      this.menuOpen = false;
      return;
    }

    // Oklar
    const L = this._toScreenRect(layout, this.ARROW_LEFT);
    const R = this._toScreenRect(layout, this.ARROW_RIGHT);
    if (this._hitRect(this._ptr.x, this._ptr.y, L)) {
      this._prevPage();
      return;
    }
    if (this._hitRect(this._ptr.x, this._ptr.y, R)) {
      this._nextPage();
      return;
    }

    // Slot tıklayınca satın al
    const pageItems = this.PRODUCTS.slice(this.page * this.perPage, (this.page + 1) * this.perPage);
    const slots = [];
    for (let i = 0; i < 5; i++) {
      slots.push(this._toScreenRect(layout, this.SLOTS[i].l));
      slots.push(this._toScreenRect(layout, this.SLOTS[i].r));
    }

    for (let i = 0; i < slots.length; i++) {
      const item = pageItems[i];
      if (!item) continue;
      if (this._hitRect(this._ptr.x, this._ptr.y, slots[i])) {
        this._buy(item);
        return;
      }
    }
  }

  _prevPage() {
    const pageCount = Math.ceil(this.PRODUCTS.length / this.perPage);
    this.page = (this.page - 1 + pageCount) % pageCount;
  }

  _nextPage() {
    const pageCount = Math.ceil(this.PRODUCTS.length / this.perPage);
    this.page = (this.page + 1) % pageCount;
  }

  _buy(item) {
    const p = this._player();

    const yton = this._getYton(p);
    if (yton < item.price) return; // paran yoksa alma

    const ad = this._getAddiction(p, item.key);
    this._resetIfExpired(ad);

    // 10 kullanım sonrası: enerji kazancı %2 düşer (penaltyPct = 2)
    // Burada “aynı ürünü 10 defa kullanınca bağımlılık yapar” kuralını uyguluyoruz.
    // ceza sadece o üründe; 24 saatte reset.
    let gainPct = item.energyPct;

    // ceza uygula
    if (ad.penaltyPct > 0) {
      gainPct = Math.max(0, gainPct - ad.penaltyPct);
    }

    // parayı düş
    this._setYton(p, yton - item.price);

    // enerji ekle (energyMax üzerinden %)
    const e = this._getEnergy(p);
    const eMax = this._getEnergyMax(p);
    const add = (eMax * gainPct) / 100;
    this._setEnergy(p, Math.min(eMax, e + add));

    // kullanım say
    ad.uses += 1;
    ad.lastUseAt = this._now();

    if (ad.uses >= 10) {
      ad.penaltyPct = 2; // %2 düşür
    }
  }
}

// 30 kurgusal ürün (isimleri istersen sen değiştir)
const PRODUCTS_30 = [
  { key: "shadow_kush", name: "Shadow Kush", price: 10, energyPct: 5 },
  { key: "blue_drift", name: "Blue Drift", price: 11, energyPct: 5 },
  { key: "neon_haze", name: "Neon Haze", price: 12, energyPct: 5 },
  { key: "lemon_sketch", name: "Lemon Sketch", price: 13, energyPct: 5 },
  { key: "white_veil", name: "White Veil", price: 14, energyPct: 5 },

  { key: "gelato_flux", name: "Gelato Flux", price: 15, energyPct: 5 },
  { key: "zk_sugar", name: "ZK Sugar", price: 16, energyPct: 5 },
  { key: "gsc_prime", name: "GSC Prime", price: 17, energyPct: 5 },
  { key: "night_sherb", name: "Night Sherb", price: 18, energyPct: 5 },
  { key: "island_gold", name: "Island Gold", price: 19, energyPct: 5 },

  { key: "street_mix", name: "Street Mix", price: 10, energyPct: 5 },
  { key: "lava_kief", name: "Lava Kief", price: 19, energyPct: 5 },
  { key: "noir_dust", name: "Noir Dust", price: 17, energyPct: 5 },
  { key: "amber_shard", name: "Amber Shard", price: 23, energyPct: 5 },
  { key: "viper_crush", name: "Viper Crush", price: 25, energyPct: 5 },

  { key: "crystal_leaf", name: "Crystal Leaf", price: 24, energyPct: 5 },
  { key: "velvet_stone", name: "Velvet Stone", price: 22, energyPct: 5 },
  { key: "night_bloom", name: "Night Bloom", price: 21, energyPct: 5 },
  { key: "isle_mint", name: "Isle Mint", price: 14, energyPct: 5 },
  { key: "blue_ember", name: "Blue Ember", price: 16, energyPct: 5 },

  { key: "golden_spark", name: "Golden Spark", price: 18, energyPct: 5 },
  { key: "black_lotus", name: "Black Lotus", price: 20, energyPct: 5 },
  { key: "ghost_sugar", name: "Ghost Sugar", price: 15, energyPct: 5 },
  { key: "mint_shroud", name: "Mint Shroud", price: 12, energyPct: 5 },
  { key: "violet_rush", name: "Violet Rush", price: 17, energyPct: 5 },

  { key: "cinder_wave", name: "Cinder Wave", price: 13, energyPct: 5 },
  { key: "silver_static", name: "Silver Static", price: 16, energyPct: 5 },
  { key: "emerald_hush", name: "Emerald Hush", price: 19, energyPct: 5 },
  { key: "sunset_glint", name: "Sunset Glint", price: 21, energyPct: 5 },
  { key: "royal_fog", name: "Royal Fog", price: 22, energyPct: 5 },
];
