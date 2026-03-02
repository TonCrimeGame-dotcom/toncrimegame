// src/scenes/CoffeeShopScene.js
export class CoffeeShopScene {
  constructor({ assets, i18n, scenes }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;

    // UI state
    this.menuOpen = false;
    this.page = 0; // 0..3
    this.itemsPerPage = 8;

    // Image keys (BootScene'de bu key'ler load edilmiş olmalı)
    this.bgKey = "coffeeshop_bg";     // coffeeshop.png
    this.menuKey = "coffeeshop_menu"; // coffeeshop_menu.png

    // Layout (menü overlay)
    this.menuScale = 0.78; // ekranın %78'i (çok küçülmesin)
    this.menuAlphaBackdrop = 0.35;

    // Kutuların (slot) konumu: menü görseline göre yüzde oranlar
    // Bu oranlar "coffeeshop_menu.png" içindeki altın çerçeveli slot'lara göre ayarlandı.
    // 4 satır x 2 sütun = 8 slot
    this.SLOTS = [
      // left page
      { col: "L", row: 0, x: 0.12, y: 0.18, w: 0.34, h: 0.10 },
      { col: "L", row: 1, x: 0.12, y: 0.36, w: 0.34, h: 0.10 },
      { col: "L", row: 2, x: 0.12, y: 0.54, w: 0.34, h: 0.10 },
      { col: "L", row: 3, x: 0.12, y: 0.72, w: 0.34, h: 0.10 },

      // right page
      { col: "R", row: 0, x: 0.54, y: 0.18, w: 0.34, h: 0.10 },
      { col: "R", row: 1, x: 0.54, y: 0.36, w: 0.34, h: 0.10 },
      { col: "R", row: 2, x: 0.54, y: 0.54, w: 0.34, h: 0.10 },
      { col: "R", row: 3, x: 0.54, y: 0.72, w: 0.34, h: 0.10 },
    ];

    // Close button (X) ve sayfa okları: menü görseli üzerinde oranla
    this.CLOSE_BTN = { x: 0.90, y: 0.10, r: 0.035 }; // daire alan
    this.PREV_BTN = { x: 0.08, y: 0.92, w: 0.12, h: 0.06 };
    this.NEXT_BTN = { x: 0.80, y: 0.92, w: 0.12, h: 0.06 };

    // Persistent keys
    this.KEY_PLAYER = "toncrime_player"; // yton, energy, energyMax, xp, lvl... burada tutuyoruz
    this.KEY_COFFEE = "toncrime_coffeeshop"; // usage + addiction timer
  }

  async onEnter() {
    // Varsayılan player state varsa yarat
    this._ensurePlayerState();

    // Coffee state varsa yarat
    this._ensureCoffeeState();

    // Click handler canvas'a DOM üzerinden bağlanacak
    this._boundClick = false;
    this._canvas = null;
    this._clickHandler = (e) => this._onCanvasClick(e);

    // Scene ilk açıldığında menü kapalı
    this.menuOpen = false;
    this.page = 0;
  }

  onExit() {
    // Event temizle
    if (this._canvas && this._boundClick) {
      this._canvas.removeEventListener("click", this._clickHandler);
      this._boundClick = false;
    }
  }

  update() {
    // Bağımlılık reset kontrolü (24 saat)
    const cs = this._getCoffeeState();
    if (cs.addictionUntil && Date.now() > cs.addictionUntil) {
      // reset
      cs.addictionUntil = 0;
      cs.uses = {}; // hepsini sıfırla
      this._setCoffeeState(cs);
    }
  }

  render(ctx, w, h) {
    // Canvas event'i burada bağla (ctx.canvas burada garanti)
    if (!this._boundClick && ctx && ctx.canvas) {
      this._canvas = ctx.canvas;
      this._canvas.addEventListener("click", this._clickHandler);
      this._boundClick = true;
    }

    // BG
    const bg = this.assets.getImage ? this.assets.getImage(this.bgKey) : null;
    ctx.clearRect(0, 0, w, h);

    if (bg) {
      // cover draw
      const s = this._cover(bg.width, bg.height, w, h);
      ctx.drawImage(bg, s.sx, s.sy, s.sw, s.sh, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }

    // Menü overlay
    if (this.menuOpen) {
      // backdrop
      ctx.fillStyle = `rgba(0,0,0,${this.menuAlphaBackdrop})`;
      ctx.fillRect(0, 0, w, h);

      // menu image
      const menuImg = this.assets.getImage ? this.assets.getImage(this.menuKey) : null;
      if (!menuImg) return;

      const mw = Math.floor(w * this.menuScale);
      const mh = Math.floor((mw / menuImg.width) * menuImg.height);
      const mx = Math.floor((w - mw) / 2);
      const my = Math.floor((h - mh) / 2);

      // menu base
      ctx.drawImage(menuImg, mx, my, mw, mh);

      // Draw clickable text aligned into slots
      const items = this._getItems();
      const pageItems = items.slice(this.page * this.itemsPerPage, this.page * this.itemsPerPage + this.itemsPerPage);

      const player = this._getPlayerState();
      const cs = this._getCoffeeState();
      const addictionActive = !!cs.addictionUntil && Date.now() < cs.addictionUntil;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < this.SLOTS.length; i++) {
        const slot = this.SLOTS[i];
        const item = pageItems[i];
        if (!item) continue;

        const rx = mx + slot.x * mw;
        const ry = my + slot.y * mh;
        const rw = slot.w * mw;
        const rh = slot.h * mh;
        const cx = rx + rw / 2;

        const uses = (cs.uses[item.id] || 0);
        const maxUses = 10;

        // Enerji kazancı: normalde item.energyPct, bağımlılık aktifse %2
        const energyPct = addictionActive ? 2 : item.energyPct;

        // Yazı boyutlarını slot'a göre ayarla
        const nameSize = Math.max(14, Math.floor(rh * 0.34));
        const lineSize = Math.max(12, Math.floor(rh * 0.26));
        const smallSize = Math.max(11, Math.floor(rh * 0.22));

        // İsim
        ctx.font = `700 ${nameSize}px system-ui`;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fillText(item.name, cx, ry + rh * 0.30);

        // Fiyat + enerji
        ctx.font = `600 ${lineSize}px system-ui`;
        ctx.fillStyle = "rgba(255,255,255,0.90)";
        ctx.fillText(`${item.price} YTON  |  +%${energyPct}`, cx, ry + rh * 0.58);

        // Kullanım
        ctx.font = `500 ${smallSize}px system-ui`;
        ctx.fillStyle = "rgba(255,255,255,0.80)";
        ctx.fillText(`Kullanım: ${uses}/${maxUses}`, cx, ry + rh * 0.82);
      }

      // Page indicator
      ctx.font = `600 ${Math.max(12, Math.floor(mh * 0.03))}px system-ui`;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.textAlign = "center";
      ctx.fillText(`Sayfa ${this.page + 1}/4`, mx + mw / 2, my + mh * 0.945);

      // Addiction indicator (üstte küçük)
      const cs2 = this._getCoffeeState();
      if (cs2.addictionUntil && Date.now() < cs2.addictionUntil) {
        const leftMs = cs2.addictionUntil - Date.now();
        const mm = Math.floor(leftMs / 60000);
        const ss = Math.floor((leftMs % 60000) / 1000);
        ctx.textAlign = "left";
        ctx.font = `600 ${Math.max(12, Math.floor(mh * 0.03))}px system-ui`;
        ctx.fillStyle = "rgba(255,210,80,0.95)";
        ctx.fillText(`Bağımlılık: ${mm}:${String(ss).padStart(2, "0")} (Enerji +%2)`, mx + mw * 0.10, my + mh * 0.10);
      }
    }
  }

  // =========================
  // CLICK / HIT TEST
  // =========================
  _onCanvasClick(e) {
    if (!this._canvas) return;

    const rect = this._canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this._canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this._canvas.height / rect.height);

    // Menü kapalıysa: BG içindeki "kitap" alanına tıklayınca aç
    // Biz burada kitabı çizmediğimiz için (bg'nin üstüne ekstra koymuyoruz),
    // sabit bir hit-area kullanıyoruz. Senin BG’de kitabın olduğu bölgeye göre ayarlı:
    if (!this.menuOpen) {
      // Kitap hitbox (ekrandaki görsele göre yaklaşık)
      const hit = {
        x1: this._canvas.width * 0.20,
        y1: this._canvas.height * 0.40,
        x2: this._canvas.width * 0.58,
        y2: this._canvas.height * 0.88,
      };

      if (x >= hit.x1 && x <= hit.x2 && y >= hit.y1 && y <= hit.y2) {
        this.menuOpen = true;
        return;
      }
      return;
    }

    // Menü açıksa: menu overlay koordinatlarına göre kontrol
    const w = this._canvas.width;
    const h = this._canvas.height;

    const menuImg = this.assets.getImage ? this.assets.getImage(this.menuKey) : null;
    if (!menuImg) return;

    const mw = Math.floor(w * this.menuScale);
    const mh = Math.floor((mw / menuImg.width) * menuImg.height);
    const mx = Math.floor((w - mw) / 2);
    const my = Math.floor((h - mh) / 2);

    // Menü dışına tıklandıysa kapat
    if (x < mx || x > mx + mw || y < my || y > my + mh) {
      this.menuOpen = false;
      return;
    }

    // Close button (X) daire
    const cx = mx + this.CLOSE_BTN.x * mw;
    const cy = my + this.CLOSE_BTN.y * mh;
    const rr = this.CLOSE_BTN.r * mw;
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= rr * rr) {
      this.menuOpen = false;
      return;
    }

    // Prev/Next
    const prev = this._rectAbs(mx, my, mw, mh, this.PREV_BTN);
    const next = this._rectAbs(mx, my, mw, mh, this.NEXT_BTN);

    if (this._inRect(x, y, prev)) {
      this.page = Math.max(0, this.page - 1);
      return;
    }
    if (this._inRect(x, y, next)) {
      this.page = Math.min(3, this.page + 1);
      return;
    }

    // Slot click => satın al / kullan
    const items = this._getItems();
    const pageItems = items.slice(this.page * this.itemsPerPage, this.page * this.itemsPerPage + this.itemsPerPage);

    for (let i = 0; i < this.SLOTS.length; i++) {
      const slot = this.SLOTS[i];
      const r = this._rectAbs(mx, my, mw, mh, slot);
      if (this._inRect(x, y, r)) {
        const item = pageItems[i];
        if (item) this._useItem(item);
        return;
      }
    }
  }

  _useItem(item) {
    const player = this._getPlayerState();
    const cs = this._getCoffeeState();

    // 24 saat reset kontrolü (her kullanımda da kontrol)
    if (cs.addictionUntil && Date.now() > cs.addictionUntil) {
      cs.addictionUntil = 0;
      cs.uses = {};
    }

    // Yeterli para var mı?
    if (player.yton < item.price) {
      // İstersen chat'e mesaj atarsın; şimdilik sessiz geçiyoruz
      this._setCoffeeState(cs);
      return;
    }

    // kullanım sayısı
    const uses = (cs.uses[item.id] || 0);

    // Bağımlılık aktif mi?
    const addictionActive = !!cs.addictionUntil && Date.now() < cs.addictionUntil;

    // Enerji artışı: %5 default, bağımlılık aktifse %2
    const gainPct = addictionActive ? 2 : item.energyPct;

    // İşlem
    player.yton -= item.price;

    const maxEnergy = player.energyMax ?? 10;
    const gain = Math.max(1, Math.round((maxEnergy * gainPct) / 100));
    player.energy = Math.min(maxEnergy, (player.energy ?? 0) + gain);

    // uses + bağımlılık tetik
    const newUses = uses + 1;
    cs.uses[item.id] = newUses;

    if (!addictionActive && newUses >= 10) {
      // 24 saat bağımlılık
      cs.addictionUntil = Date.now() + 24 * 60 * 60 * 1000;
    }

    // Kaydet
    this._setPlayerState(player);
    this._setCoffeeState(cs);

    // HUD localStorage dinliyorsa güncellenir; dinlemiyorsa refresh'te görünür.
  }

  // =========================
  // DATA
  // =========================
  _getItems() {
    // 30 ürün — kurgusal ama OG Kush tarzı yakın isimler
    // Fiyat min 10 YTON, enerji default %5 (bazılarını %2/%3/%5 yapıyoruz ama kural: en düşük 10YTON => %5
    // (Senin kuralına göre en düşük fiyat 10YTON ve enerji %5; burada 10YTON olanlar %5)
    return [
      { id: "shadow_kush", name: "Shadow Kush", price: 10, energyPct: 5 },
      { id: "blue_drift", name: "Blue Drift", price: 15, energyPct: 5 },
      { id: "neon_haze", name: "Neon Haze", price: 12, energyPct: 5 },
      { id: "gelato_flux", name: "Gelato Flux", price: 16, energyPct: 5 },
      { id: "lemon_sketch", name: "Lemon Sketch", price: 13, energyPct: 5 },
      { id: "zk_sugar", name: "ZK Sugar", price: 16, energyPct: 5 },
      { id: "white_veil", name: "White Veil", price: 14, energyPct: 5 },
      { id: "gsc_prime", name: "GSC Prime", price: 17, energyPct: 5 },

      { id: "og_kush", name: "OG Kush", price: 18, energyPct: 5 },
      { id: "purple_haze", name: "Purple Haze", price: 19, energyPct: 5 },
      { id: "sour_skunk", name: "Sour Skunk", price: 20, energyPct: 5 },
      { id: "island_gold", name: "Island Gold", price: 21, energyPct: 5 },
      { id: "amnesia_wave", name: "Amnesia Wave", price: 22, energyPct: 5 },
      { id: "bubble_diesel", name: "Bubble Diesel", price: 24, energyPct: 5 },
      { id: "crystal_moon", name: "Crystal Moon", price: 25, energyPct: 5 },
      { id: "kali_mist", name: "Kali Mist", price: 23, energyPct: 5 },

      { id: "mdm_spark", name: "MDM Spark", price: 26, energyPct: 5 },
      { id: "stone_rush", name: "Stone Rush", price: 27, energyPct: 5 },
      { id: "dust_runner", name: "Dust Runner", price: 28, energyPct: 5 },
      { id: "crackling_ice", name: "Crackling Ice", price: 29, energyPct: 5 },
      { id: "glass_shift", name: "Glass Shift", price: 30, energyPct: 5 },
      { id: "night_crystal", name: "Night Crystal", price: 32, energyPct: 5 },
      { id: "street_mix", name: "Street Mix", price: 10, energyPct: 5 },
      { id: "dark_powder", name: "Dark Powder", price: 31, energyPct: 5 },

      { id: "ruby_shard", name: "Ruby Shard", price: 33, energyPct: 5 },
      { id: "ice_flake", name: "Ice Flake", price: 34, energyPct: 5 },
      { id: "kristal_ex", name: "Kristal-EX", price: 35, energyPct: 5 },
      { id: "mdm_pulse", name: "MDM Pulse", price: 36, energyPct: 5 },
      { id: "toz_ghost", name: "Toz Ghost", price: 14, energyPct: 5 },
      { id: "cizik_black", name: "Çizik Black", price: 12, energyPct: 5 },
    ];
  }

  // =========================
  // STORAGE
  // =========================
  _ensurePlayerState() {
    const cur = localStorage.getItem(this.KEY_PLAYER);
    if (cur) return;
    const base = {
      username: "Player",
      yton: 0,
      energy: 10,
      energyMax: 10,
      xp: 30,
      lvl: 1,
    };
    localStorage.setItem(this.KEY_PLAYER, JSON.stringify(base));
  }

  _getPlayerState() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY_PLAYER)) || { yton: 0, energy: 0, energyMax: 10 };
    } catch {
      return { yton: 0, energy: 0, energyMax: 10 };
    }
  }

  _setPlayerState(state) {
    localStorage.setItem(this.KEY_PLAYER, JSON.stringify(state));
  }

  _ensureCoffeeState() {
    const cur = localStorage.getItem(this.KEY_COFFEE);
    if (cur) return;
    const base = {
      uses: {}, // { [itemId]: number }
      addictionUntil: 0, // timestamp
    };
    localStorage.setItem(this.KEY_COFFEE, JSON.stringify(base));
  }

  _getCoffeeState() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY_COFFEE)) || { uses: {}, addictionUntil: 0 };
    } catch {
      return { uses: {}, addictionUntil: 0 };
    }
  }

  _setCoffeeState(state) {
    localStorage.setItem(this.KEY_COFFEE, JSON.stringify(state));
  }

  // =========================
  // HELPERS
  // =========================
  _inRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  _rectAbs(mx, my, mw, mh, rel) {
    return {
      x: mx + rel.x * mw,
      y: my + rel.y * mh,
      w: rel.w * mw,
      h: rel.h * mh,
    };
  }

  _cover(iw, ih, ow, oh) {
    const ir = iw / ih;
    const or = ow / oh;
    let sw, sh, sx, sy;
    if (ir > or) {
      sh = ih;
      sw = ih * or;
      sx = (iw - sw) / 2;
      sy = 0;
    } else {
      sw = iw;
      sh = iw / or;
      sx = 0;
      sy = (ih - sh) / 2;
    }
    return { sx, sy, sw, sh };
  }
          }
