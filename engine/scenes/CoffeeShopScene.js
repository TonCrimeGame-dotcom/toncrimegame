// /src/scenes/CoffeeShopScene.js
export class CoffeeShopScene {
  constructor({ assets, i18n, scenes }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;

    this.menuOpen = false;
    this.page = 0;

    // Menünün baz ölçüsü (coffeeshop_menu.png üretimin 1024x1536 idi)
    this.MENU_W = 1024;
    this.MENU_H = 1536;

    this.PAGE_SIZE = 8;
    this.STORAGE_KEY = "tc_state_v1";
  }

  // ---- MENÜ KUTUCUK KOORDİNATLARI (1024x1536 referans) ----
  SLOT_RECTS = [
    // LEFT
    { x: 115, y: 360, w: 360, h: 76 },
    { x: 115, y: 494, w: 360, h: 76 },
    { x: 115, y: 630, w: 360, h: 76 },
    { x: 115, y: 765, w: 360, h: 76 },
    // RIGHT
    { x: 545, y: 360, w: 360, h: 76 },
    { x: 545, y: 494, w: 360, h: 76 },
    { x: 545, y: 630, w: 360, h: 76 },
    { x: 545, y: 765, w: 360, h: 76 },
  ];

  UI_RECTS = {
    close: { x: 900, y: 170, w: 90, h: 90 },
    prev: { x: 90, y: 1350, w: 220, h: 120 },
    next: { x: 714, y: 1350, w: 220, h: 120 },
  };

  // ---- Kurgusal ürün listesi (30) ----
  ITEMS = [
    { id: "shadow_kush", name: "Shadow Kush", price: 10, energyPct: 5 },
    { id: "blue_drift", name: "Blue Drift", price: 15, energyPct: 5 },
    { id: "neon_haze", name: "Neon Haze", price: 12, energyPct: 5 },
    { id: "lemon_sketch", name: "Lemon Sketch", price: 13, energyPct: 5 },
    { id: "white_veil", name: "White Veil", price: 14, energyPct: 5 },
    { id: "gelato_flux", name: "Gelato Flux", price: 16, energyPct: 5 },
    { id: "zk_sugar", name: "ZK Sugar", price: 16, energyPct: 5 },
    { id: "gsc_prime", name: "GSC Prime", price: 17, energyPct: 5 },

    { id: "purple_static", name: "Purple Static", price: 18, energyPct: 5 },
    { id: "mint_crystal", name: "Mint Crystal", price: 19, energyPct: 5 },
    { id: "citrus_stone", name: "Citrus Stone", price: 20, energyPct: 5 },
    { id: "midnight_dust", name: "Midnight Dust", price: 21, energyPct: 5 },
    { id: "rasta_resin", name: "Rasta Resin", price: 22, energyPct: 5 },
    { id: "ember_shard", name: "Ember Shard", price: 23, energyPct: 5 },
    { id: "ghost_powder", name: "Ghost Powder", price: 24, energyPct: 5 },
    { id: "viper_crush", name: "Viper Crush", price: 25, energyPct: 5 },

    { id: "island_melt", name: "Island Melt", price: 26, energyPct: 5 },
    { id: "nova_chip", name: "Nova Chip", price: 27, energyPct: 5 },
    { id: "black_syrup", name: "Black Syrup", price: 28, energyPct: 5 },
    { id: "acid_wax", name: "Acid Wax", price: 29, energyPct: 5 },
    { id: "zero_flake", name: "Zero Flake", price: 30, energyPct: 5 },
    { id: "diamond_mist", name: "Diamond Mist", price: 31, energyPct: 5 },
    { id: "ruby_grit", name: "Ruby Grit", price: 32, energyPct: 5 },
    { id: "phantom_ice", name: "Phantom Ice", price: 33, energyPct: 5 },

    { id: "street_mix", name: "Street Mix", price: 34, energyPct: 5 },
    { id: "hush_crystals", name: "Hush Crystals", price: 35, energyPct: 5 },
    { id: "matrix_powder", name: "Matrix Powder", price: 36, energyPct: 5 },
    { id: "lava_dots", name: "Lava Dots", price: 38, energyPct: 5 },
    { id: "cloud_tabs", name: "Cloud Tabs", price: 40, energyPct: 5 },
    { id: "prime_rocks", name: "Prime Rocks", price: 42, energyPct: 5 },
  ];

  // -------- time helpers --------
  _now() { return Date.now(); }
  _dayMs() { return 24 * 60 * 60 * 1000; }

  // -------- state --------
  _loadState() {
    let s;
    try { s = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "null"); } catch { s = null; }
    if (!s) {
      s = { yton: 200, energy: 5, energyMax: 10, usage: {} };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(s));
    }
    if (!s.usage) s.usage = {};
    if (typeof s.yton !== "number") s.yton = 0;
    if (typeof s.energy !== "number") s.energy = 0;
    if (typeof s.energyMax !== "number") s.energyMax = 10;
    return s;
  }

  _saveState(s) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent("tc:state", { detail: s }));
  }

  _getUsage(s, id) {
    if (!s.usage[id]) s.usage[id] = { count: 0, windowStart: 0, addictedAt: 0 };
    const u = s.usage[id];
    const now = this._now();

    // 24 saat geçtiyse reset
    if (u.windowStart && now - u.windowStart > this._dayMs()) {
      u.count = 0;
      u.windowStart = 0;
    }
    if (u.addictedAt && now - u.addictedAt > this._dayMs()) {
      u.addictedAt = 0;
      u.count = 0;
      u.windowStart = 0;
    }
    return u;
  }

  _isAddicted(u) { return !!u.addictedAt; }

  // -------- ENGINE UYUMLU: image getter (ÖNEMLİ) --------
  _getImageByKey(key) {
    if (!key) return null;

    // 1) assets.image(key)
    try {
      const a = this.assets?.image?.(key);
      if (a && (a instanceof HTMLImageElement || a instanceof HTMLCanvasElement || a instanceof ImageBitmap)) return a;
      // bazı engine’lerde {img: HTMLImageElement} gibi dönebiliyor
      if (a?.img && a.img instanceof HTMLImageElement) return a.img;
    } catch {}

    // 2) assets.getImage / assets.get
    try {
      const b = this.assets?.getImage?.(key);
      if (b && b instanceof HTMLImageElement) return b;
    } catch {}
    try {
      const c = this.assets?.get?.(key);
      if (c && c instanceof HTMLImageElement) return c;
      if (c?.img && c.img instanceof HTMLImageElement) return c.img;
    } catch {}

    // 3) assets.images map/obj
    const imgs = this.assets?.images;
    if (imgs) {
      if (typeof imgs.get === "function") {
        const d = imgs.get(key);
        if (d && d instanceof HTMLImageElement) return d;
        if (d?.img && d.img instanceof HTMLImageElement) return d.img;
      } else {
        const e = imgs[key];
        if (e && e instanceof HTMLImageElement) return e;
        if (e?.img && e.img instanceof HTMLImageElement) return e.img;
      }
    }

    return null;
  }

  _getImageAny(keys) {
    for (const k of keys) {
      const img = this._getImageByKey(k);
      if (img) return img;
    }
    return null;
  }

  // -------- input normalize --------
  _pointer(input) {
    const p = input?.pointer || input?.mouse || input;
    if (!p) return null;
    const x = p.x ?? p.clientX ?? 0;
    const y = p.y ?? p.clientY ?? 0;
    const justPressed = !!(p.justPressed || p.pressed || p.click || p.clicked);
    return { x, y, justPressed };
  }

  _inRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  _computeMenuDraw(w, h) {
    const maxH = h * 0.86;
    const scale = Math.min((w * 0.92) / this.MENU_W, maxH / this.MENU_H);
    const dw = this.MENU_W * scale;
    const dh = this.MENU_H * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2 + 10;
    return { dx, dy, dw, dh, scale };
  }

  _mapRect(menuDraw, r) {
    const { dx, dy, scale } = menuDraw;
    return { x: dx + r.x * scale, y: dy + r.y * scale, w: r.w * scale, h: r.h * scale };
  }

  // -------- lifecycle --------
  onEnter() {}

  update(dt, input, w, h) {
    const p = this._pointer(input);
    if (!p || !p.justPressed) return;

    if (!this.menuOpen) {
      // arka plandaki kitabın alanı (oran bazlı)
      const bookRect = { x: w * 0.22, y: h * 0.28, w: w * 0.46, h: h * 0.50 };
      if (this._inRect(p.x, p.y, bookRect)) this.menuOpen = true;
      return;
    }

    const md = this._computeMenuDraw(w, h);

    const closeR = this._mapRect(md, this.UI_RECTS.close);
    if (this._inRect(p.x, p.y, closeR)) { this.menuOpen = false; return; }

    const prevR = this._mapRect(md, this.UI_RECTS.prev);
    const nextR = this._mapRect(md, this.UI_RECTS.next);
    if (this._inRect(p.x, p.y, prevR)) { this.page = (this.page + 3) % 4; return; }
    if (this._inRect(p.x, p.y, nextR)) { this.page = (this.page + 1) % 4; return; }

    const start = this.page * this.PAGE_SIZE;
    for (let i = 0; i < this.SLOT_RECTS.length; i++) {
      const item = this.ITEMS[start + i];
      if (!item) continue;
      const slotR = this._mapRect(md, this.SLOT_RECTS[i]);
      if (this._inRect(p.x, p.y, slotR)) {
        this._buyAndApply(item);
        return;
      }
    }
  }

  _buyAndApply(item) {
    const s = this._loadState();
    const u = this._getUsage(s, item.id);
    const now = this._now();

    if (!u.windowStart) u.windowStart = now;
    if (s.yton < item.price) return;

    s.yton -= item.price;

    u.count += 1;
    if (u.count >= 10 && !u.addictedAt) u.addictedAt = now;

    const addicted = this._isAddicted(u);
    const pct = addicted ? 2 : item.energyPct;

    const gain = Math.max(1, Math.round((s.energyMax * pct) / 100));
    s.energy = Math.min(s.energyMax, s.energy + gain);

    s.usage[item.id] = u;
    this._saveState(s);
  }

  // -------- render --------
  render(ctx, w, h) {
    // BG: farklı olası key’ler
    const bg = this._getImageAny([
      "coffeeshop_bg",
      "coffeeshop",
      "background_coffeeshop",
      "bg_coffeeshop",
      "background",
    ]);

    if (bg && bg.width && bg.height) {
      this._drawCover(ctx, bg, 0, 0, w, h);
    } else {
      // resim yoksa çökme yok
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }

    if (!this.menuOpen) return;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const md = this._computeMenuDraw(w, h);

    const menu = this._getImageAny([
      "coffeeshop_menu",
      "menu_coffeeshop",
      "menu",
    ]);

    if (menu && menu.width && menu.height) {
      ctx.drawImage(menu, md.dx, md.dy, md.dw, md.dh);
    } else {
      ctx.fillStyle = "rgba(20,20,25,0.92)";
      ctx.fillRect(md.dx, md.dy, md.dw, md.dh);
    }

    this._drawMenuUI(ctx, md);
    this._drawItems(ctx, md);
  }

  _drawCover(ctx, img, x, y, w, h) {
    const iw = img.width, ih = img.height;
    const ir = iw / ih;
    const r = w / h;
    let sx = 0, sy = 0, sw = iw, sh = ih;
    if (ir > r) {
      sw = ih * r;
      sx = (iw - sw) / 2;
    } else {
      sh = iw / r;
      sy = (ih - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  _drawMenuUI(ctx, md) {
    const closeR = this._mapRect(md, this.UI_RECTS.close);
    const prevR = this._mapRect(md, this.UI_RECTS.prev);
    const nextR = this._mapRect(md, this.UI_RECTS.next);

    ctx.save();

    // Close X
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    this._rr(ctx, closeR.x + closeR.w * 0.18, closeR.y + closeR.h * 0.18, closeR.w * 0.64, closeR.h * 0.64, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(closeR.x + closeR.w * 0.33, closeR.y + closeR.h * 0.33);
    ctx.lineTo(closeR.x + closeR.w * 0.67, closeR.y + closeR.h * 0.67);
    ctx.moveTo(closeR.x + closeR.w * 0.67, closeR.y + closeR.h * 0.33);
    ctx.lineTo(closeR.x + closeR.w * 0.33, closeR.y + closeR.h * 0.67);
    ctx.stroke();

    // Prev/Next
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    this._rr(ctx, prevR.x, prevR.y, prevR.w, prevR.h, 18); ctx.fill();
    this._rr(ctx, nextR.x, nextR.y, nextR.w, nextR.h, 18); ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.max(22, Math.round(md.scale * 34))}px system-ui`;
    ctx.fillText("◀", prevR.x + prevR.w / 2, prevR.y + prevR.h / 2);
    ctx.fillText("▶", nextR.x + nextR.w / 2, nextR.y + nextR.h / 2);

    // Page label
    ctx.font = `${Math.max(16, Math.round(md.scale * 22))}px system-ui`;
    ctx.fillText(`Sayfa ${this.page + 1}/4`, md.dx + md.dw / 2, md.dy + md.dh - md.scale * 40);

    ctx.restore();
  }

  _drawItems(ctx, md) {
    const s = this._loadState();
    const start = this.page * this.PAGE_SIZE;

    for (let i = 0; i < this.SLOT_RECTS.length; i++) {
      const item = this.ITEMS[start + i];
      if (!item) continue;

      const r = this._mapRect(md, this.SLOT_RECTS[i]);
      const usage = this._getUsage(s, item.id);
      const addicted = this._isAddicted(usage);
      const pct = addicted ? 2 : item.energyPct;

      const padX = r.w * 0.06;
      const x = r.x + padX;
      const maxW = r.w - padX * 2;

      // taşmayı bitirmek için: isim fontu slot genişliğine göre otomatik küçülür
      const nameFontStart = Math.max(12, Math.round(md.scale * 24));
      const nameFontMin = 12;
      const subFont = Math.max(10, Math.round(md.scale * 16));
      const tinyFont = Math.max(10, Math.round(md.scale * 14));

      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      // 1) İsim (fit)
      this._fillTextFit(ctx, item.name, x, r.y + r.h * 0.08, maxW, nameFontStart, nameFontMin);

      // 2) fiyat + enerji
      ctx.font = `${subFont}px system-ui`;
      ctx.fillText(`${item.price} YTON  |  +%${pct} Enerji`, x, r.y + r.h * 0.43);

      // 3) kullanım + bağımlılık geri sayım
      ctx.font = `${tinyFont}px system-ui`;
      let line3 = `Kullanım: ${Math.min(usage.count, 10)}/10`;
      if (addicted) {
        const remain = Math.max(0, (usage.addictedAt + this._dayMs()) - this._now());
        const hh = String(Math.floor(remain / 3600000)).padStart(2, "0");
        const mm = String(Math.floor((remain % 3600000) / 60000)).padStart(2, "0");
        const ss = String(Math.floor((remain % 60000) / 1000)).padStart(2, "0");
        line3 += `  |  Bağımlılık: ${hh}:${mm}:${ss}`;
      }
      // line3 çok uzarsa slotta kırpılsın
      this._fillTextFit(ctx, line3, x, r.y + r.h * 0.68, maxW, tinyFont, 10, false);

      ctx.restore();
    }
  }

  _fillTextFit(ctx, text, x, y, maxW, startSize, minSize, bold = true) {
    let size = startSize;
    while (size >= minSize) {
      ctx.font = `${bold ? "700" : "400"} ${size}px system-ui`;
      if (ctx.measureText(text).width <= maxW) break;
      size -= 1;
    }
    ctx.fillText(text, x, y);
  }

  _rr(ctx, x, y, w, h, r) {
    // roundRect yoksa manuel
    if (ctx.roundRect) return ctx.roundRect(x, y, w, h, r);
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
    return ctx;
  }
          }
