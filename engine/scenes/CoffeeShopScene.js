// /src/scenes/CoffeeShopScene.js
export class CoffeeShopScene {
  constructor({ assets, i18n, scenes }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;

    this.menuOpen = false;
    this.page = 0;

    // Menü sprite baz ölçüsü (senin attığın görsel: 1024 x 1536)
    this.MENU_W = 1024;
    this.MENU_H = 1536;

    // 4 sayfa * 8 ürün = 32 slot -> biz 30 ürün doldurup son 2 slotu boş bırakacağız.
    this.PAGE_SIZE = 8;

    // Kullanıcı state localStorage anahtarları
    this.STORAGE_KEY = "tc_state_v1";
  }

  // ---- AYAR: Asset key isimleri ----
  ASSET_KEYS = {
    BG: "coffeeshop_bg", // ./src/assets/coffeeshop.png
    MENU: "coffeeshop_menu", // ./src/assets/coffeeshop_menu.png
  };

  // ---- MENÜ KUTUCUK KOORDİNATLARI (coffeeshop_menu.png üzerinde) ----
  // 8 slot: solda 4, sağda 4 (alttaki dekorların üstünde kalıyor, taşma yapmıyor)
  // Bu koordinatlar 1024x1536 referansına göredir.
  SLOT_RECTS = [
    // LEFT column (4)
    { x: 115, y: 360, w: 360, h: 76 },
    { x: 115, y: 494, w: 360, h: 76 },
    { x: 115, y: 630, w: 360, h: 76 },
    { x: 115, y: 765, w: 360, h: 76 },

    // RIGHT column (4)
    { x: 545, y: 360, w: 360, h: 76 },
    { x: 545, y: 494, w: 360, h: 76 },
    { x: 545, y: 630, w: 360, h: 76 },
    { x: 545, y: 765, w: 360, h: 76 },
  ];

  // Menü kontrol alanları (1024x1536 referansına göre)
  UI_RECTS = {
    close: { x: 900, y: 170, w: 90, h: 90 },     // sağ üst kapat
    prev:  { x: 90,  y: 1350, w: 220, h: 120 },   // sol alt önceki
    next:  { x: 714, y: 1350, w: 220, h: 120 },   // sağ alt sonraki
  };

  // ---- Kurgusal ürün listesi (30 adet) ----
  // min fiyat 10 YTON, min enerji +%5 (bağımlılıkta +%2)
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

  // ---------------- STATE ----------------
  _now() { return Date.now(); }
  _dayMs() { return 24 * 60 * 60 * 1000; }

  _loadState() {
    let s;
    try { s = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "null"); } catch { s = null; }
    if (!s) {
      s = {
        yton: 200,
        energy: 5,
        energyMax: 10,
        // item usage tracking
        usage: {}, // id -> { count, windowStart, addictedAt }
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(s));
    }
    return s;
  }

  _saveState(s) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(s));
    // Hud/Chat başka js’lerde dinliyorsa diye event atalım
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

  _isAddicted(u) {
    return !!u.addictedAt;
  }

  // ---------------- INPUT HELPERS ----------------
  _pointer(thisInput) {
    // Engine’in input’u projende “pointer object” şeklindeyse:
    // {x, y, down, pressed, justPressed} gibi.
    // Bazı sürümlerde "this.input.pointer" objedir. Fonksiyon değildir.
    const p = thisInput?.pointer || thisInput?.mouse || thisInput;
    if (!p) return null;

    // "clicked" benzeri alanları normalize edelim:
    const x = p.x ?? p.clientX ?? 0;
    const y = p.y ?? p.clientY ?? 0;

    // tık anı: justPressed / pressed / click
    const justPressed = !!(p.justPressed || p.pressed || p.click || p.clicked);
    return { x, y, justPressed };
  }

  _inRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  // Menü çizim alanı (ekranda)
  _computeMenuDraw(w, h) {
    // Menü yüksekliği ekranın %86’sı olsun (HUD üstü kalsın)
    const maxH = h * 0.86;
    const scale = Math.min((w * 0.92) / this.MENU_W, maxH / this.MENU_H);
    const dw = this.MENU_W * scale;
    const dh = this.MENU_H * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2 + 10;
    return { dx, dy, dw, dh, scale };
  }

  // Menü içindeki (1024x1536) rect’i ekrana mapler
  _mapRect(menuDraw, r) {
    const { dx, dy, scale } = menuDraw;
    return {
      x: dx + r.x * scale,
      y: dy + r.y * scale,
      w: r.w * scale,
      h: r.h * scale,
    };
  }

  // ---------------- LIFECYCLE ----------------
  onEnter() {
    // hiçbir şey
  }

  update(dt, input, w, h) {
    const p = this._pointer(input);
    if (!p || !p.justPressed) return;

    // Menü kapalıyken: arka plandaki kitabın olduğu bölgeye tıklayınca aç
    if (!this.menuOpen) {
      // coffeeshop.png arka planında kitabın yaklaşık alanı (oran bazlı)
      // Bu oranlar senin ekranda kitabın üstüne denk gelecek şekilde geniş tutuldu.
      const bookRect = {
        x: w * 0.22,
        y: h * 0.28,
        w: w * 0.46,
        h: h * 0.50,
      };
      if (this._inRect(p.x, p.y, bookRect)) {
        this.menuOpen = true;
      }
      return;
    }

    // Menü açıkken: menü UI hit-test
    const menuDraw = this._computeMenuDraw(w, h);

    // close
    const closeR = this._mapRect(menuDraw, this.UI_RECTS.close);
    if (this._inRect(p.x, p.y, closeR)) {
      this.menuOpen = false;
      return;
    }

    // prev/next
    const prevR = this._mapRect(menuDraw, this.UI_RECTS.prev);
    const nextR = this._mapRect(menuDraw, this.UI_RECTS.next);

    if (this._inRect(p.x, p.y, prevR)) {
      this.page = (this.page + 4 - 1) % 4;
      return;
    }
    if (this._inRect(p.x, p.y, nextR)) {
      this.page = (this.page + 1) % 4;
      return;
    }

    // slot click
    const start = this.page * this.PAGE_SIZE;

    for (let i = 0; i < this.SLOT_RECTS.length; i++) {
      const item = this.ITEMS[start + i];
      if (!item) continue;

      const slotR = this._mapRect(menuDraw, this.SLOT_RECTS[i]);
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

    // 24 saat penceresi başlat
    if (!u.windowStart) u.windowStart = now;

    // bakiye yeterli mi?
    if (s.yton < item.price) return;

    // ödeme
    s.yton -= item.price;

    // bağımlılık kontrol: 10 kullanımdan sonra 24 saat boyunca düşür
    // (10. kullanımdan itibaren addictedAt set)
    u.count += 1;
    if (u.count >= 10 && !u.addictedAt) {
      u.addictedAt = now;
    }

    const addicted = this._isAddicted(u);
    const effectivePct = addicted ? 2 : item.energyPct;

    // enerji artışı: max’a göre yüzde
    const gain = Math.max(1, Math.round((s.energyMax * effectivePct) / 100));
    s.energy = Math.min(s.energyMax, s.energy + gain);

    s.usage[item.id] = u;
    this._saveState(s);
  }

  // ---------------- RENDER ----------------
  render(ctx, w, h) {
    // BG
    const bg = this.assets.image(this.ASSET_KEYS.BG);
    if (bg) {
      this._drawCover(ctx, bg, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }

    if (!this.menuOpen) return;

    // Menü karartma
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Menü sprite
    const menu = this.assets.image(this.ASSET_KEYS.MENU);
    const md = this._computeMenuDraw(w, h);

    if (menu) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.drawImage(menu, md.dx, md.dy, md.dw, md.dh);
      ctx.restore();
    } else {
      // fallback panel
      ctx.fillStyle = "rgba(20,20,25,0.92)";
      ctx.fillRect(md.dx, md.dy, md.dw, md.dh);
    }

    // UI: close + oklar + sayfa yazısı
    this._drawMenuUI(ctx, w, h, md);

    // Slot yazıları
    this._drawItems(ctx, md);
  }

  _drawCover(ctx, img, x, y, w, h) {
    // cover fit (center crop)
    const iw = img.width, ih = img.height;
    const ir = iw / ih;
    const r = w / h;
    let sx = 0, sy = 0, sw = iw, sh = ih;
    if (ir > r) {
      // too wide
      sh = ih;
      sw = ih * r;
      sx = (iw - sw) / 2;
    } else {
      // too tall
      sw = iw;
      sh = iw / r;
      sy = (ih - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  _drawMenuUI(ctx, w, h, md) {
    // close "X"
    const closeR = this._mapRect(md, this.UI_RECTS.close);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.roundRect(closeR.x + closeR.w * 0.18, closeR.y + closeR.h * 0.18, closeR.w * 0.64, closeR.h * 0.64, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(closeR.x + closeR.w * 0.33, closeR.y + closeR.h * 0.33);
    ctx.lineTo(closeR.x + closeR.w * 0.67, closeR.y + closeR.h * 0.67);
    ctx.moveTo(closeR.x + closeR.w * 0.67, closeR.y + closeR.h * 0.33);
    ctx.lineTo(closeR.x + closeR.w * 0.33, closeR.y + closeR.h * 0.67);
    ctx.stroke();
    ctx.restore();

    // oklar (görünür küçük)
    const prevR = this._mapRect(md, this.UI_RECTS.prev);
    const nextR = this._mapRect(md, this.UI_RECTS.next);

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.roundRect(prevR.x, prevR.y, prevR.w, prevR.h, 18);
    ctx.roundRect(nextR.x, nextR.y, nextR.w, nextR.h, 18);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `${Math.max(22, Math.round(md.scale * 34))}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("◀", prevR.x + prevR.w / 2, prevR.y + prevR.h / 2);
    ctx.fillText("▶", nextR.x + nextR.w / 2, nextR.y + nextR.h / 2);

    // sayfa
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

      // 3 satır: İsim / fiyat+pct / kullanım+bağımlılık
      const padX = r.w * 0.06;
      const x = r.x + padX;
      const maxW = r.w - padX * 2;

      // Yazıları kutu içine sığdır (özellikle alt kutularda taşma oluyordu)
      const nameFont = Math.max(14, Math.round(md.scale * 26));
      const subFont = Math.max(11, Math.round(md.scale * 18));
      const tinyFont = Math.max(10, Math.round(md.scale * 15));

      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255,255,255,0.92)";

      // isim (fit)
      this._fillTextFit(ctx, item.name, x, r.y + r.h * 0.12, maxW, nameFont, 24);

      // fiyat + enerji
      ctx.font = `${subFont}px system-ui`;
      ctx.fillText(`${item.price} YTON  |  +%${pct} Enerji`, x, r.y + r.h * 0.46);

      // kullanım + bağımlılık geri sayımı
      ctx.font = `${tinyFont}px system-ui`;
      let line3 = `Kullanım: ${Math.min(usage.count, 10)}/10`;
      if (addicted) {
        const remain = Math.max(0, (usage.addictedAt + this._dayMs()) - this._now());
        const hh = String(Math.floor(remain / 3600000)).padStart(2, "0");
        const mm = String(Math.floor((remain % 3600000) / 60000)).padStart(2, "0");
        const ss = String(Math.floor((remain % 60000) / 1000)).padStart(2, "0");
        line3 += `  |  Bağımlılık: ${hh}:${mm}:${ss}`;
      }
      ctx.fillText(line3, x, r.y + r.h * 0.70);

      // slot hover/klik hissi için çok hafif highlight
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);

      ctx.restore();
    }
  }

  _fillTextFit(ctx, text, x, y, maxW, startSize, minSize) {
    let size = startSize;
    while (size >= minSize) {
      ctx.font = `700 ${size}px system-ui`;
      const w = ctx.measureText(text).width;
      if (w <= maxW) break;
      size -= 1;
    }
    ctx.fillText(text, x, y);
  }
}

// Canvas roundRect polyfill (bazı tarayıcılarda yoksa)
if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    this.beginPath();
    this.moveTo(x + rr, y);
    this.arcTo(x + w, y, x + w, y + h, rr);
    this.arcTo(x + w, y + h, x, y + h, rr);
    this.arcTo(x, y + h, x, y, rr);
    this.arcTo(x, y, x + w, y, rr);
    this.closePath();
    return this;
  };
}
