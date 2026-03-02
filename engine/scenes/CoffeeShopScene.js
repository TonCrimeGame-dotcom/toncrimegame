// src/scenes/CoffeeShopScene.js
export class CoffeeShopScene {
  constructor({ assets, i18n, scenes }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;

    this.menuOpen = false;
    this.page = 0;
    this.itemsPerPage = 8;

    this.bgKey = "coffeeshop_bg";     // coffeeshop.png
    this.menuKey = "coffeeshop_menu"; // coffeeshop_menu.png

    // Menü artık küçülmesin
    this.menuScale = 0.86;

    // DEBUG: kutu çerçevelerini çizmek için true yap
    this.DEBUG_LAYOUT = false;

    // Bu menü görselinde her slotta üstte "label frame" var.
    // Yazıları O LABEL frame’in içine oturtuyoruz (büyük boş kutuya değil).
    // Ekran görüntüne göre güncellendi:
    this.SLOTS = [
      // LEFT page label frames
      { x: 0.115, y: 0.185, w: 0.355, h: 0.105 },
      { x: 0.115, y: 0.365, w: 0.355, h: 0.105 },
      { x: 0.115, y: 0.545, w: 0.355, h: 0.105 },
      { x: 0.115, y: 0.725, w: 0.355, h: 0.105 },

      // RIGHT page label frames
      { x: 0.535, y: 0.185, w: 0.355, h: 0.105 },
      { x: 0.535, y: 0.365, w: 0.355, h: 0.105 },
      { x: 0.535, y: 0.545, w: 0.355, h: 0.105 },
      { x: 0.535, y: 0.725, w: 0.355, h: 0.105 },
    ];

    // Close + sayfa butonları
    this.CLOSE_BTN = { x: 0.905, y: 0.105, r: 0.040 };
    this.PREV_BTN = { x: 0.10, y: 0.92, w: 0.16, h: 0.07 };
    this.NEXT_BTN = { x: 0.74, y: 0.92, w: 0.16, h: 0.07 };

    // localStorage
    this.KEY_PLAYER = "toncrime_player";
    this.KEY_COFFEE = "toncrime_coffeeshop";

    // canvas click
    this._boundClick = false;
    this._canvas = null;
    this._clickHandler = (e) => this._onCanvasClick(e);
  }

  async onEnter() {
    this._ensurePlayerState();
    this._ensureCoffeeState();
    this.menuOpen = false;
    this.page = 0;
  }

  onExit() {
    if (this._canvas && this._boundClick) {
      this._canvas.removeEventListener("click", this._clickHandler);
      this._boundClick = false;
    }
  }

  update() {
    const cs = this._getCoffeeState();
    if (cs.addictionUntil && Date.now() > cs.addictionUntil) {
      cs.addictionUntil = 0;
      cs.uses = {};
      this._setCoffeeState(cs);
    }
  }

  render(ctx, w, h) {
    // click bind
    if (!this._boundClick && ctx?.canvas) {
      this._canvas = ctx.canvas;
      this._canvas.addEventListener("click", this._clickHandler);
      this._boundClick = true;
    }

    // BG cover
    const bg = this.assets.getImage?.(this.bgKey);
    ctx.clearRect(0, 0, w, h);
    if (bg) {
      const s = this._cover(bg.width, bg.height, w, h);
      ctx.drawImage(bg, s.sx, s.sy, s.sw, s.sh, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }

    // Menü kapalıysa hiçbir yazı basma (sen istemiyorsun)
    if (!this.menuOpen) return;

    // Backdrop
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, w, h);

    const menuImg = this.assets.getImage?.(this.menuKey);
    if (!menuImg) return;

    const mw = Math.floor(w * this.menuScale);
    const mh = Math.floor((mw / menuImg.width) * menuImg.height);
    const mx = Math.floor((w - mw) / 2);
    const my = Math.floor((h - mh) / 2);

    ctx.drawImage(menuImg, mx, my, mw, mh);

    // DEBUG frame
    if (this.DEBUG_LAYOUT) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,0,0,0.85)";
      ctx.lineWidth = 3;
      for (const slot of this.SLOTS) {
        const r = this._rectAbs(mx, my, mw, mh, slot);
        ctx.strokeRect(r.x, r.y, r.w, r.h);
      }
      ctx.restore();
    }

    // Items
    const items = this._getItems();
    const pageItems = items.slice(
      this.page * this.itemsPerPage,
      this.page * this.itemsPerPage + this.itemsPerPage
    );

    const player = this._getPlayerState();
    const cs = this._getCoffeeState();
    const addictionActive = !!cs.addictionUntil && Date.now() < cs.addictionUntil;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < this.SLOTS.length; i++) {
      const item = pageItems[i];
      if (!item) continue;

      const r = this._rectAbs(mx, my, mw, mh, this.SLOTS[i]);
      const cx = r.x + r.w / 2;

      const uses = cs.uses[item.id] || 0;
      const energyPct = addictionActive ? 2 : item.energyPct;

      // Kutunun içine “3 satır” net oturt
      const nameSize = Math.floor(r.h * 0.34);
      const lineSize = Math.floor(r.h * 0.26);
      const smallSize = Math.floor(r.h * 0.22);

      // 1) İsim
      ctx.font = `800 ${Math.max(14, nameSize)}px system-ui`;
      ctx.fillStyle = "rgba(255,255,255,0.98)";
      ctx.fillText(item.name, cx, r.y + r.h * 0.30);

      // 2) Fiyat + Enerji
      ctx.font = `700 ${Math.max(12, lineSize)}px system-ui`;
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillText(`${item.price} YTON  |  +%${energyPct}`, cx, r.y + r.h * 0.58);

      // 3) Kullanım
      ctx.font = `600 ${Math.max(11, smallSize)}px system-ui`;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(`Kullanım: ${uses}/10`, cx, r.y + r.h * 0.82);

      // (İstersen parası yoksa slotu hafif soldur)
      if (player.yton < item.price) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.restore();
      }
    }

    // Sayfa yazısı (alt, küçük)
    ctx.font = `700 ${Math.max(12, Math.floor(mh * 0.03))}px system-ui`;
    ctx.fillStyle = "rgba(255,255,255,0.90)";
    ctx.textAlign = "center";
    ctx.fillText(`Sayfa ${this.page + 1}/4`, mx + mw / 2, my + mh * 0.955);

    // Bağımlılık göstergesi
    if (cs.addictionUntil && Date.now() < cs.addictionUntil) {
      const leftMs = cs.addictionUntil - Date.now();
      const mm = Math.floor(leftMs / 60000);
      const ss = Math.floor((leftMs % 60000) / 1000);
      ctx.textAlign = "left";
      ctx.font = `800 ${Math.max(12, Math.floor(mh * 0.03))}px system-ui`;
      ctx.fillStyle = "rgba(255,210,80,0.95)";
      ctx.fillText(
        `Bağımlılık: ${mm}:${String(ss).padStart(2, "0")} (Enerji +%2)`,
        mx + mw * 0.10,
        my + mh * 0.10
      );
    }
  }

  // ---------------- CLICK ----------------
  _onCanvasClick(e) {
    if (!this._canvas) return;

    const rect = this._canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this._canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this._canvas.height / rect.height);

    // Menü kapalıysa: kitap hitbox (bg içindeki kitap alanı)
    if (!this.menuOpen) {
      // Ekranındaki coffeeshop.png kitabına göre yaklaşık alan.
      // Tam kusursuz yapmak için coffeeshop.png’yi buraya atarsan nokta atışı çıkarırım.
      const hit = {
        x1: this._canvas.width * 0.18,
        y1: this._canvas.height * 0.38,
        x2: this._canvas.width * 0.62,
        y2: this._canvas.height * 0.90,
      };
      if (x >= hit.x1 && x <= hit.x2 && y >= hit.y1 && y <= hit.y2) {
        this.menuOpen = true;
      }
      return;
    }

    // Menü açıksa
    const w = this._canvas.width;
    const h = this._canvas.height;

    const menuImg = this.assets.getImage?.(this.menuKey);
    if (!menuImg) return;

    const mw = Math.floor(w * this.menuScale);
    const mh = Math.floor((mw / menuImg.width) * menuImg.height);
    const mx = Math.floor((w - mw) / 2);
    const my = Math.floor((h - mh) / 2);

    // dışına tıklandı -> kapat
    if (x < mx || x > mx + mw || y < my || y > my + mh) {
      this.menuOpen = false;
      return;
    }

    // close
    const cx = mx + this.CLOSE_BTN.x * mw;
    const cy = my + this.CLOSE_BTN.y * mh;
    const rr = this.CLOSE_BTN.r * mw;
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= rr * rr) {
      this.menuOpen = false;
      return;
    }

    // prev/next
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

    // slot click
    const items = this._getItems();
    const pageItems = items.slice(
      this.page * this.itemsPerPage,
      this.page * this.itemsPerPage + this.itemsPerPage
    );

    for (let i = 0; i < this.SLOTS.length; i++) {
      const r = this._rectAbs(mx, my, mw, mh, this.SLOTS[i]);
      if (this._inRect(x, y, r)) {
        const item = pageItems[i];
        if (item) this._useItem(item);
        return;
      }
    }
  }

  // ---------------- USE ITEM ----------------
  _useItem(item) {
    const player = this._getPlayerState();
    const cs = this._getCoffeeState();

    // reset check
    if (cs.addictionUntil && Date.now() > cs.addictionUntil) {
      cs.addictionUntil = 0;
      cs.uses = {};
    }

    // para yetmezse çık
    if (player.yton < item.price) {
      this._setCoffeeState(cs);
      return;
    }

    const uses = cs.uses[item.id] || 0;
    const addictionActive = !!cs.addictionUntil && Date.now() < cs.addictionUntil;

    // enerji kazancı
    const gainPct = addictionActive ? 2 : item.energyPct;

    // para düş
    player.yton -= item.price;

    // enerji ekle
    const maxEnergy = player.energyMax ?? 10;
    const gain = Math.max(1, Math.round((maxEnergy * gainPct) / 100));
    player.energy = Math.min(maxEnergy, (player.energy ?? 0) + gain);

    // kullanım + bağımlılık
    const newUses = uses + 1;
    cs.uses[item.id] = newUses;

    if (!addictionActive && newUses >= 10) {
      cs.addictionUntil = Date.now() + 24 * 60 * 60 * 1000;
    }

    this._setPlayerState(player);
    this._setCoffeeState(cs);
  }

  // ---------------- ITEMS ----------------
  _getItems() {
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

  // ---------------- STORAGE ----------------
  _ensurePlayerState() {
    const cur = localStorage.getItem(this.KEY_PLAYER);
    if (cur) return;
    localStorage.setItem(
      this.KEY_PLAYER,
      JSON.stringify({ username: "Player", yton: 0, energy: 10, energyMax: 10, xp: 30, lvl: 1 })
    );
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
    localStorage.setItem(this.KEY_COFFEE, JSON.stringify({ uses: {}, addictionUntil: 0 }));
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

  // ---------------- HELPERS ----------------
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
