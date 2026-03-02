// src/scenes/CoffeeShopScene.js

export class CoffeeShopScene {
  constructor({ assets, i18n, scenes, state }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;
    // state yoksa güvenli fallback
    this.state = state || {
      coin: 0,
      energy: 0,
      energyMax: 10,
    };

    // UI
    this._w = 0;
    this._h = 0;

    // CoffeeShop
    this._menuOpen = false;
    this._page = 0;

    // click handling
    this._clickHandler = null;
    this._canvas = null;

    // addiction tracking (24h reset)
    this._adKey = "tc_coffee_ad_v1";

    // Products (30 item / 3 sayfa / sayfa başına 10 slot)
    // NOT: İsimler kurgusal/oyun içi.
    this._items = [
      { id: "shadow_kush", name: "Shadow Kush", price: 10, energyPct: 5 },
      { id: "blue_drift", name: "Blue Drift", price: 11, energyPct: 5 },
      { id: "neon_haze", name: "Neon Haze", price: 12, energyPct: 5 },
      { id: "lemon_sketch", name: "Lemon Sketch", price: 13, energyPct: 5 },
      { id: "white_veil", name: "White Veil", price: 14, energyPct: 5 },
      { id: "gelato_flux", name: "Gelato Flux", price: 15, energyPct: 5 },
      { id: "zk_sugar", name: "ZK Sugar", price: 16, energyPct: 5 },
      { id: "gsc_prime", name: "GSC Prime", price: 17, energyPct: 5 },
      { id: "night_sherb", name: "Night Sherb", price: 18, energyPct: 5 },
      { id: "island_gold", name: "Island Gold", price: 19, energyPct: 5 },

      { id: "street_mix", name: "Street Mix", price: 10, energyPct: 5 },
      { id: "lava_kief", name: "Lava Kief", price: 19, energyPct: 5 },
      { id: "noir_dust", name: "Noir Dust", price: 17, energyPct: 5 },
      { id: "amber_shard", name: "Amber Shard", price: 23, energyPct: 5 },
      { id: "viper_crush", name: "Viper Crush", price: 25, energyPct: 5 },
      { id: "crystal_leaf", name: "Crystal Leaf", price: 24, energyPct: 5 },
      { id: "velvet_stone", name: "Velvet Stone", price: 22, energyPct: 5 },
      { id: "night_sheen", name: "Night Sheen", price: 21, energyPct: 5 },
      { id: "island_black", name: "Island Black", price: 20, energyPct: 5 },
      { id: "kush_x", name: "OG Kush X", price: 18, energyPct: 5 },

      { id: "mono_crystal", name: "Mono Crystal", price: 26, energyPct: 5 },
      { id: "eclipse_pow", name: "Eclipse Powder", price: 27, energyPct: 5 },
      { id: "nova_chip", name: "Nova Chips", price: 28, energyPct: 5 },
      { id: "ruby_spark", name: "Ruby Spark", price: 29, energyPct: 5 },
      { id: "ghost_shard", name: "Ghost Shard", price: 30, energyPct: 5 },
      { id: "obsidian_dust", name: "Obsidian Dust", price: 31, energyPct: 5 },
      { id: "mint_crush", name: "Mint Crush", price: 32, energyPct: 5 },
      { id: "delta_flake", name: "Delta Flake", price: 33, energyPct: 5 },
      { id: "prime_pow", name: "Prime Powder", price: 34, energyPct: 5 },
      { id: "velour_mix", name: "Velour Mix", price: 35, energyPct: 5 },
    ];

    // sayfa başına 10 item
    this._perPage = 10;
  }

  // -----------------------------
  // lifecycle
  // -----------------------------
  async onEnter({ canvas } = {}) {
    this._menuOpen = false;
    this._page = 0;

    // canvas referansı
    this._canvas = canvas || null;

    // addiction state load
    this._ad = this._loadAddiction();

    // click binding (engine input yerine direkt canvas click)
    if (this._canvas && !this._clickHandler) {
      this._clickHandler = (ev) => {
        const p = this._clientToCanvas(ev);
        if (!p) return;
        this._handleClick(p.x, p.y);
      };
      this._canvas.addEventListener("click", this._clickHandler);
      // mobil için:
      this._canvas.addEventListener("touchend", (ev) => {
        const t = ev.changedTouches && ev.changedTouches[0];
        if (!t) return;
        const p = this._clientToCanvas(t);
        if (!p) return;
        this._handleClick(p.x, p.y);
      }, { passive: true });
    }
  }

  onExit() {
    if (this._canvas && this._clickHandler) {
      this._canvas.removeEventListener("click", this._clickHandler);
    }
    this._clickHandler = null;
    this._canvas = null;
  }

  update() {
    // 24 saat reset kontrol
    this._ensureAddictionFresh();
  }

  // engine render çağırır
  render(ctx, w, h) {
    this._w = w;
    this._h = h;

    // BG (coffeeshop.png)
    const bg = this.assets.getImage("coffeeshop_bg");
    if (bg) {
      this._drawCover(ctx, bg, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }

    // Menü açıksa overlay + menu png
    if (this._menuOpen) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      const menuImg = this.assets.getImage("coffeeshop_menu");
      if (menuImg) {
        const layout = this._menuLayout(menuImg, w, h);
        this._drawMenu(ctx, menuImg, layout);
      }
      return;
    }

    // Menü kapalıyken: kitap görseli overlay (coffeeshop_book.png)
    // Eğer bg'nin üstüne ekstra kitap çizmek istemiyorsun: aşağıdaki blok zaten küçük + tıklanabilir alan oluşturuyor.
    const book = this.assets.getImage("coffeeshop_book");
    if (book) {
      const bx = w * 0.37;
      const by = h * 0.36;
      const bw = w * 0.26;
      const bh = bw * (book.height / book.width);
      this._bookRect = { x: bx, y: by, w: bw, h: bh };
      ctx.drawImage(book, bx, by, bw, bh);
    } else {
      // kitap yoksa da bg üzerinde merkezde tıklama alanı bırak
      this._bookRect = { x: w * 0.35, y: h * 0.35, w: w * 0.30, h: h * 0.40 };
    }
  }

  // -----------------------------
  // click logic
  // -----------------------------
  _handleClick(x, y) {
    if (this._menuOpen) {
      // menüde: oklar + slotlar + kapatma (ESC yok)
      const menuImg = this.assets.getImage("coffeeshop_menu");
      if (!menuImg) return;

      const layout = this._menuLayout(menuImg, this._w, this._h);

      // sağ/sol ok butonları
      if (this._inRect(x, y, layout.btnPrev)) {
        this._page = (this._page - 1 + this._pageCount()) % this._pageCount();
        return;
      }
      if (this._inRect(x, y, layout.btnNext)) {
        this._page = (this._page + 1) % this._pageCount();
        return;
      }

      // menüyü kapatma: menü dışına tıkla
      if (!this._inRect(x, y, layout.menuRect)) {
        this._menuOpen = false;
        return;
      }

      // slot click
      for (let i = 0; i < layout.slots.length; i++) {
        const slot = layout.slots[i];
        if (!this._inRect(x, y, slot)) continue;
        const idx = this._page * this._perPage + i;
        const item = this._items[idx];
        if (!item) return;

        this._buyAndUse(item);
        return;
      }

      return;
    }

    // menü kapalıysa: kitap alanı tıkla -> menü aç
    if (this._bookRect && this._inRect(x, y, this._bookRect)) {
      this._menuOpen = true;
      return;
    }
  }

  // -----------------------------
  // gameplay (coin/energy + addiction)
  // -----------------------------
  _buyAndUse(item) {
    // coin check
    const coin = Number(this.state.coin || 0);
    if (coin < item.price) return;

    // addiction tracking per item (10 kullanım sonrası)
    this._ensureAddictionFresh();
    const ad = this._ad.items[item.id] || { uses: 0, penalized: false };

    // satın al
    this.state.coin = coin - item.price;

    // enerji kazanımı:
    // - normal: +%5 of energyMax (min 1)
    // - 10+ kullanım sonrası: +%2'ye düşer (senin kuralın)
    const pct = ad.uses >= 10 ? 2 : item.energyPct; // 5 veya 2
    const gain = Math.max(1, Math.round((Number(this.state.energyMax || 10) * pct) / 100));

    const curE = Number(this.state.energy || 0);
    const maxE = Number(this.state.energyMax || 10);
    this.state.energy = Math.min(maxE, curE + gain);

    // kullanım say
    ad.uses = (ad.uses || 0) + 1;
    this._ad.items[item.id] = ad;
    this._saveAddiction();
  }

  _ensureAddictionFresh() {
    const now = Date.now();
    if (!this._ad || !this._ad.resetAt) return;
    if (now >= this._ad.resetAt) {
      // 24h reset
      this._ad = this._freshAddiction();
      this._saveAddiction();
    }
  }

  _freshAddiction() {
    const now = Date.now();
    return {
      resetAt: now + 24 * 60 * 60 * 1000,
      items: {},
    };
  }

  _loadAddiction() {
    try {
      const raw = localStorage.getItem(this._adKey);
      if (!raw) return this._freshAddiction();
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return this._freshAddiction();
      if (!obj.resetAt || !obj.items) return this._freshAddiction();
      return obj;
    } catch {
      return this._freshAddiction();
    }
  }

  _saveAddiction() {
    try {
      localStorage.setItem(this._adKey, JSON.stringify(this._ad));
    } catch {}
  }

  // -----------------------------
  // menu layout + drawing
  // -----------------------------
  _menuLayout(menuImg, w, h) {
    // Menü görselini ekrana düzgün oturt (küçülme/taşma yok)
    // hedef: ekranın %88 yüksekliği
    const targetH = h * 0.88;
    const scale = targetH / menuImg.height;
    const mw = menuImg.width * scale;
    const mh = menuImg.height * scale;

    const mx = (w - mw) / 2;
    const my = (h - mh) / 2;

    const menuRect = { x: mx, y: my, w: mw, h: mh };

    // SLOT koordinatları (menu png 1024x1536 referans alınarak)
    // Bu değerler senin attığın “boş yazısız menü” görselindeki çerçevelere göre ayarlı.
    // 5 sol + 5 sağ = 10 slot
    const n = (v) => v * scale; // px -> scaled px

    // referans rect'ler (1024x1536 içinde)
    const Lx = 130, Rx = 545;
    const slotW = 330, slotH = 125;
    const ys = [415, 565, 715, 865, 1015]; // 5 sıra

    const slots = [];
    for (let r = 0; r < 5; r++) {
      slots.push({ x: mx + n(Lx), y: my + n(ys[r]), w: n(slotW), h: n(slotH) }); // sol
    }
    for (let r = 0; r < 5; r++) {
      slots.push({ x: mx + n(Rx), y: my + n(ys[r]), w: n(slotW), h: n(slotH) }); // sağ
    }

    // Ok butonları (menu altı)
    const btnPrev = {
      x: mx + mw * 0.12,
      y: my + mh * 0.90,
      w: mw * 0.10,
      h: mh * 0.07,
    };
    const btnNext = {
      x: mx + mw * 0.78,
      y: my + mh * 0.90,
      w: mw * 0.10,
      h: mh * 0.07,
    };

    return { menuRect, mx, my, mw, mh, slots, btnPrev, btnNext, scale };
  }

  _drawMenu(ctx, menuImg, layout) {
    // menu background
    ctx.drawImage(menuImg, layout.mx, layout.my, layout.mw, layout.mh);

    // items (page)
    const start = this._page * this._perPage;
    const pageItems = this._items.slice(start, start + this._perPage);

    // text style
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 6;

    for (let i = 0; i < layout.slots.length; i++) {
      const slot = layout.slots[i];
      const item = pageItems[i];
      if (!item) continue;

      const ad = (this._ad.items[item.id] || { uses: 0 });
      const effectivePct = ad.uses >= 10 ? 2 : item.energyPct;

      // === YAZIYI AŞAĞI OTURT (senin istediğin) ===
      // slot içinde padding (daha aşağı)
      const padX = slot.w * 0.07;
      const padY = slot.h * 0.24;   // kritik: daha aşağı başlat
      const yShift = slot.h * 0.10; // kritik: komple aşağı kaydır

      const tx = slot.x + padX;
      const maxW = slot.w - padX * 2;

      // 1) isim (upper)
      const titleText = item.name.toUpperCase();
      const titleSize = this._fitText(ctx, titleText, maxW, slot.h * 0.30, slot.h * 0.18, 900);
      ctx.font = `900 ${Math.round(titleSize)}px system-ui`;
      ctx.fillStyle = "rgba(255,255,255,0.98)";
      ctx.fillText(this._ellipsis(ctx, titleText, maxW), tx, slot.y + padY + yShift + titleSize);

      // 2) price + energy
      const line2 = `${item.price} YTON  |  +%${effectivePct} Enerji`;
      const line2Size = this._fitText(ctx, line2, maxW, slot.h * 0.22, slot.h * 0.16, 800);
      ctx.font = `800 ${Math.round(line2Size)}px system-ui`;
      ctx.fillStyle = "rgba(255,255,255,0.93)";
      ctx.fillText(this._ellipsis(ctx, line2, maxW), tx, slot.y + padY + yShift + titleSize + slot.h * 0.30);

      // 3) usage
      const usedTxt = `Kullanım: ${Math.min(ad.uses || 0, 99)}/10`;
      const line3Size = Math.max(11, slot.h * 0.15);
      ctx.font = `700 ${Math.round(line3Size)}px system-ui`;
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.fillText(usedTxt, tx, slot.y + slot.h - padY * 0.20);

      // (isteğe bağlı) 24h reset kalan süreyi gösterme istemiyorsun diye eklemedim.
    }

    ctx.restore();

    // page indicator
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.round(layout.mh * 0.028)}px system-ui`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 6;
    ctx.fillText(`Sayfa ${this._page + 1}/${this._pageCount()}`, layout.mx + layout.mw / 2, layout.my + layout.mh * 0.935);
    ctx.restore();

    // arrows (tıklanabilir alan)
    this._drawArrow(ctx, layout.btnPrev, "left");
    this._drawArrow(ctx, layout.btnNext, "right");
  }

  _drawArrow(ctx, r, dir) {
    // sade ok (senin “tuş yok” dediğin problem için)
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(r.x, r.y, r.w, r.h);

    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = Math.max(2, r.h * 0.12);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const s = Math.min(r.w, r.h) * 0.32;

    ctx.beginPath();
    if (dir === "left") {
      ctx.moveTo(cx + s, cy - s);
      ctx.lineTo(cx - s, cy);
      ctx.lineTo(cx + s, cy + s);
    } else {
      ctx.moveTo(cx - s, cy - s);
      ctx.lineTo(cx + s, cy);
      ctx.lineTo(cx - s, cy + s);
    }
    ctx.stroke();
    ctx.restore();
  }

  _pageCount() {
    return Math.max(1, Math.ceil(this._items.length / this._perPage));
  }

  // -----------------------------
  // helpers
  // -----------------------------
  _inRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  _clientToCanvas(ev) {
    const c = this._canvas;
    if (!c) return null;

    const rect = c.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;

    // canvas gerçek boyut/ekran boyut oranı
    const sx = c.width / rect.width;
    const sy = c.height / rect.height;

    return { x: cx * sx, y: cy * sy };
  }

  _drawCover(ctx, img, x, y, w, h) {
    // CSS background-size: cover gibi
    const iw = img.width;
    const ih = img.height;
    const s = Math.max(w / iw, h / ih);
    const dw = iw * s;
    const dh = ih * s;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  _fitText(ctx, text, maxWidth, startPx, minPx, weight = 800) {
    let size = Math.floor(startPx);
    const min = Math.floor(minPx);
    while (size >= min) {
      ctx.font = `${weight} ${size}px system-ui`;
      if (ctx.measureText(text).width <= maxWidth) return size;
      size -= 1;
    }
    return min;
  }

  _ellipsis(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    const ell = "...";
    let t = text;
    while (t.length > 0) {
      t = t.slice(0, -1);
      if (ctx.measureText(t + ell).width <= maxWidth) return t + ell;
    }
    return ell;
  }
        }
