// CoffeeShopScene.js
export class CoffeeShopScene {
  constructor({ assets, i18n, scenes }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;

    // --- runtime ---
    this._canvas = null;
    this._ctx = null;
    this._w = 0;
    this._h = 0;

    this.menuOpen = false;
    this.page = 0;

    // Menü çizim rect (render sırasında hesaplanır)
    this.menuRect = { x: 0, y: 0, w: 0, h: 0 };

    // Tıklanabilir hitbox’lar (render sırasında güncellenir)
    this.hit = {
      book: null,       // arkaplandaki kitap alanı
      slots: [],        // ürün slotları
      prev: null,       // sayfa geri
      next: null,       // sayfa ileri
      close: null,      // kapat (X)
    };

    // 10 slot / sayfa (5 sol + 5 sağ) - MENÜ görseline göre normalize oranlar
    // Bu oranlar menü görselinin (coffeeshop_menu.png) içindeki kutucuklara göre ayarlandı.
    // Gerekirse sadece buradaki sayıları milim oynatabilirsin; başka yere dokunma.
    this.SLOTS_NORM = [
      // LEFT PAGE (5)
      { x: 0.095, y: 0.235, w: 0.365, h: 0.085 },
      { x: 0.095, y: 0.350, w: 0.365, h: 0.085 },
      { x: 0.095, y: 0.465, w: 0.365, h: 0.085 },
      { x: 0.095, y: 0.580, w: 0.365, h: 0.085 },
      { x: 0.095, y: 0.695, w: 0.365, h: 0.085 },

      // RIGHT PAGE (5)
      { x: 0.540, y: 0.235, w: 0.365, h: 0.085 },
      { x: 0.540, y: 0.350, w: 0.365, h: 0.085 },
      { x: 0.540, y: 0.465, w: 0.365, h: 0.085 },
      { x: 0.540, y: 0.580, w: 0.365, h: 0.085 },
      { x: 0.540, y: 0.695, w: 0.365, h: 0.085 },
    ];

    // 30 ürün (kurgusal isimler) - 10’ar slot => 3 sayfa dolu, 4. sayfa boş/az dolu
    // İstersen 40 yapıp 4 sayfayı tamamen doldurabilirsin.
    this.items = [
      { id: "shadow_kush", name: "Shadow Kush", price: 10, energyPct: 5 },
      { id: "purple_haze", name: "Purple Haze", price: 12, energyPct: 5 },
      { id: "lemon_sketch", name: "Lemon Sketch", price: 13, energyPct: 5 },
      { id: "white_veil", name: "White Veil", price: 14, energyPct: 5 },
      { id: "blue_drift", name: "Blue Drift", price: 15, energyPct: 5 },
      { id: "gelato_flux", name: "Gelato Flux", price: 16, energyPct: 5 },
      { id: "zk_sugar", name: "ZK Sugar", price: 16, energyPct: 5 },
      { id: "gsc_prime", name: "GSC Prime", price: 17, energyPct: 5 },
      { id: "neon_haze", name: "Neon Haze", price: 12, energyPct: 5 },
      { id: "mint_mist", name: "Mint Mist", price: 11, energyPct: 5 },

      { id: "og_kush_x", name: "OG Kush X", price: 18, energyPct: 5 },
      { id: "island_gold", name: "Island Gold", price: 20, energyPct: 5 },
      { id: "night_sherb", name: "Night Sherb", price: 21, energyPct: 5 },
      { id: "velvet_stone", name: "Velvet Stone", price: 22, energyPct: 5 },
      { id: "crystal_leaf", name: "Crystal Leaf", price: 24, energyPct: 5 },
      { id: "street_mix", name: "Street Mix", price: 10, energyPct: 5 },
      { id: "lava_kief", name: "Lava Kief", price: 19, energyPct: 5 },
      { id: "noir_dust", name: "Noir Dust", price: 17, energyPct: 5 },
      { id: "amber_shard", name: "Amber Shard", price: 23, energyPct: 5 },
      { id: "viper_crush", name: "Viper Crush", price: 25, energyPct: 5 },

      { id: "mango_skunk", name: "Mango Skunk", price: 14, energyPct: 5 },
      { id: "blue_dreamer", name: "Blue Dreamer", price: 15, energyPct: 5 },
      { id: "rasta_glow", name: "Rasta Glow", price: 13, energyPct: 5 },
      { id: "kush_moon", name: "Kush Moon", price: 16, energyPct: 5 },
      { id: "stone_ripple", name: "Stone Ripple", price: 18, energyPct: 5 },
      { id: "ice_mint", name: "Ice Mint", price: 12, energyPct: 5 },
      { id: "ghost_pollen", name: "Ghost Pollen", price: 20, energyPct: 5 },
      { id: "golden_trim", name: "Golden Trim", price: 21, energyPct: 5 },
      { id: "haze_blend", name: "Haze Blend", price: 11, energyPct: 5 },
      { id: "sugar_fog", name: "Sugar Fog", price: 19, energyPct: 5 },
    ];

    // 24h bağımlılık reset / kullanım sayacı (item bazlı)
    this.ADDICTION_WINDOW_MS = 24 * 60 * 60 * 1000;
    this.ADDICTION_TRIGGER = 10;   // 10 kullanımdan sonra
    this.ADDICTION_PENALTY = 0.98; // enerji kazancını %2 düşür

    // storage keys
    this.STORE_KEY = "tc_coffeeshop_state_v1";

    // event handlers
    this._onClick = (e) => this._handleClick(e);
    this._onKeyDown = (e) => this._handleKeyDown(e);
  }

  // ---------- lifecycle ----------
  async onEnter({ engine } = {}) {
    // canvas bul (engine varsa onu kullan, yoksa dokümandan bul)
    this._canvas =
      engine?.canvas ||
      document.querySelector("canvas") ||
      document.getElementById("canvas") ||
      document.getElementById("game");

    if (this._canvas) {
      this._ctx = this._canvas.getContext("2d");
      this._canvas.addEventListener("click", this._onClick);
    }
    window.addEventListener("keydown", this._onKeyDown);

    // ilk girişte menü kapalı
    this.menuOpen = false;
    this.page = 0;

    // state yükle
    this.state = this._loadState();
    this._cleanupOldUsage(); // 24h dışını temizle
    this._saveState();
  }

  onExit() {
    if (this._canvas) this._canvas.removeEventListener("click", this._onClick);
    window.removeEventListener("keydown", this._onKeyDown);
  }

  // ---------- state ----------
  _defaultState() {
    return {
      yton: 0,
      energy: 10,     // 0..10
      maxEnergy: 10,
      usage: {
        // itemId: { count: number, firstTs: number }
      },
    };
  }

  _loadState() {
    try {
      const raw = localStorage.getItem(this.STORE_KEY);
      if (!raw) return this._defaultState();
      const parsed = JSON.parse(raw);
      return {
        ...this._defaultState(),
        ...parsed,
        usage: parsed.usage || {},
      };
    } catch {
      return this._defaultState();
    }
  }

  _saveState() {
    try {
      localStorage.setItem(this.STORE_KEY, JSON.stringify(this.state));
    } catch {}
  }

  _cleanupOldUsage() {
    const now = Date.now();
    for (const [id, u] of Object.entries(this.state.usage || {})) {
      if (!u?.firstTs) {
        delete this.state.usage[id];
        continue;
      }
      if (now - u.firstTs > this.ADDICTION_WINDOW_MS) {
        delete this.state.usage[id];
      }
    }
  }

  _getAddictionMultiplier(itemId) {
    this._cleanupOldUsage();
    const u = this.state.usage[itemId];
    if (!u) return 1.0;
    if (u.count >= this.ADDICTION_TRIGGER) return this.ADDICTION_PENALTY;
    return 1.0;
  }

  _touchUsage(itemId) {
    this._cleanupOldUsage();
    const now = Date.now();
    const u = this.state.usage[itemId];
    if (!u) {
      this.state.usage[itemId] = { count: 1, firstTs: now };
    } else {
      // window içinde ise artır, dışındaysa reset
      if (now - u.firstTs > this.ADDICTION_WINDOW_MS) {
        this.state.usage[itemId] = { count: 1, firstTs: now };
      } else {
        u.count += 1;
      }
    }
  }

  // ---------- helpers ----------
  _img(key) {
    // assets.getImage / assets.get / assets.images[key] ihtimallerini tolere et
    if (!this.assets) return null;
    if (typeof this.assets.getImage === "function") return this.assets.getImage(key);
    if (typeof this.assets.get === "function") return this.assets.get(key);
    if (this.assets.images && this.assets.images[key]) return this.assets.images[key];
    return null;
  }

  _coverRect(imgW, imgH, dstW, dstH) {
    const s = Math.max(dstW / imgW, dstH / imgH);
    const w = imgW * s;
    const h = imgH * s;
    const x = (dstW - w) / 2;
    const y = (dstH - h) / 2;
    return { x, y, w, h };
  }

  _inside(p, r) {
    return r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  }

  // ---------- input ----------
  _handleKeyDown(e) {
    if (!this.menuOpen) return;
    if (e.key === "Escape") {
      this.menuOpen = false;
      return;
    }
    if (e.key === "ArrowLeft") this._prevPage();
    if (e.key === "ArrowRight") this._nextPage();
  }

  _handleClick(e) {
    if (!this._canvas) return;

    const rect = this._canvas.getBoundingClientRect();
    const p = {
      x: ((e.clientX - rect.left) / rect.width) * this._w,
      y: ((e.clientY - rect.top) / rect.height) * this._h,
    };

    // Menü kapalıyken: kitap alanına tıklayınca aç
    if (!this.menuOpen) {
      if (this._inside(p, this.hit.book)) {
        this.menuOpen = true;
      }
      return;
    }

    // Menü açıksa:
    if (this._inside(p, this.hit.close)) {
      this.menuOpen = false;
      return;
    }
    if (this._inside(p, this.hit.prev)) {
      this._prevPage();
      return;
    }
    if (this._inside(p, this.hit.next)) {
      this._nextPage();
      return;
    }

    // slotlar
    for (const s of this.hit.slots) {
      if (this._inside(p, s.rect) && s.item) {
        this._buy(s.item);
        return;
      }
    }
  }

  _pageCount() {
    // 10 slot / sayfa
    return Math.max(1, Math.ceil(this.items.length / 10));
  }

  _prevPage() {
    const pc = this._pageCount();
    this.page = (this.page - 1 + pc) % pc;
  }

  _nextPage() {
    const pc = this._pageCount();
    this.page = (this.page + 1) % pc;
  }

  // ---------- logic ----------
  _buy(item) {
    // yton / enerji mekanik
    const st = this.state;

    if (st.yton < item.price) return;

    // bağımlılık çarpanı
    const mult = this._getAddictionMultiplier(item.id);

    const gainBase = (st.maxEnergy * item.energyPct) / 100; // %5 => 0.5 enerji
    const gain = gainBase * mult;

    st.yton = Math.max(0, st.yton - item.price);
    st.energy = Math.min(st.maxEnergy, st.energy + gain);

    this._touchUsage(item.id);
    this._saveState();
  }

  // ---------- render ----------
  render(ctx, w, h) {
    // engine ctx veriyorsa onu kullan, yoksa canvas ctx
    const c = ctx || this._ctx;
    if (!c) return;

    this._w = w;
    this._h = h;

    // BG: coffeeshop.png
    const bg = this._img("coffeeshop_bg");
    if (bg) {
      const r = this._coverRect(bg.width, bg.height, w, h);
      c.drawImage(bg, r.x, r.y, r.w, r.h);

      // Arkaplandaki kitabın tıklama alanı (bg üzerindeki kitap)
      // (Tam ortaya yakın büyük kitap)
      this.hit.book = {
        x: w * 0.22,
        y: h * 0.28,
        w: w * 0.56,
        h: h * 0.55,
      };
    } else {
      // bg yoksa koyu zemin
      c.fillStyle = "#0b0b0f";
      c.fillRect(0, 0, w, h);
      this.hit.book = null;
    }

    // Menü kapalıysa sadece BG
    if (!this.menuOpen) return;

    // overlay
    c.fillStyle = "rgba(0,0,0,0.55)";
    c.fillRect(0, 0, w, h);

    // Menü görseli: coffeeshop_menu.png (ortalanmış)
    const menu = this._img("coffeeshop_menu");
    if (!menu) {
      // menü görseli yoksa hata yaz
      c.fillStyle = "#fff";
      c.font = "18px system-ui";
      c.textAlign = "center";
      c.fillText("coffeeshop_menu.png bulunamadı", w / 2, h / 2);
      return;
    }

    // Menü boyut (yüksekliğin %82’si, taşarsa genişliğe göre küçült)
    let mw = w * 0.70;
    let mh = h * 0.82;
    const imgRatio = menu.width / menu.height;
    const targetRatio = mw / mh;

    if (targetRatio > imgRatio) {
      // fazla geniş -> genişliği img ratio’ya göre ayarla
      mw = mh * imgRatio;
    } else {
      // fazla dar -> yüksekliği img ratio’ya göre ayarla
      mh = mw / imgRatio;
    }

    const mx = (w - mw) / 2;
    const my = (h - mh) / 2;

    this.menuRect = { x: mx, y: my, w: mw, h: mh };

    c.drawImage(menu, mx, my, mw, mh);

    // Close (X) butonu sağ üst (menü içinde)
    this.hit.close = {
      x: mx + mw * 0.89,
      y: my + mh * 0.05,
      w: mw * 0.07,
      h: mh * 0.06,
    };

    // Sayfa tuşları (menü alt)
    this.hit.prev = {
      x: mx + mw * 0.07,
      y: my + mh * 0.88,
      w: mw * 0.10,
      h: mh * 0.08,
    };
    this.hit.next = {
      x: mx + mw * 0.83,
      y: my + mh * 0.88,
      w: mw * 0.10,
      h: mh * 0.08,
    };

    // Sayfa göstergesi
    c.fillStyle = "rgba(255,255,255,0.85)";
    c.font = `${Math.max(14, mh * 0.03)}px system-ui`;
    c.textAlign = "center";
    const pc = this._pageCount();
    c.fillText(`Sayfa ${this.page + 1}/${pc}`, mx + mw * 0.5, my + mh * 0.94);

    // ok ikonları
    c.font = `${Math.max(18, mh * 0.05)}px system-ui`;
    c.textAlign = "center";
    c.fillText("‹", this.hit.prev.x + this.hit.prev.w / 2, this.hit.prev.y + this.hit.prev.h * 0.72);
    c.fillText("›", this.hit.next.x + this.hit.next.w / 2, this.hit.next.y + this.hit.next.h * 0.72);

    // slotlar + yazılar
    const start = this.page * 10;
    const pageItems = this.items.slice(start, start + 10);

    this.hit.slots = [];

    for (let i = 0; i < 10; i++) {
      const norm = this.SLOTS_NORM[i];
      const rect = {
        x: mx + mw * norm.x,
        y: my + mh * norm.y,
        w: mw * norm.w,
        h: mh * norm.h,
      };

      const item = pageItems[i] || null;
      this.hit.slots.push({ rect, item });

      if (!item) continue;

      // Yazıların kutuya taşmaması için font ve satırları sabitle
      const titleSize = Math.max(14, rect.h * 0.32);
      const subSize = Math.max(11, rect.h * 0.24);

      c.textAlign = "left";
      c.fillStyle = "rgba(255,255,255,0.92)";
      c.font = `700 ${titleSize}px system-ui`;

      const padX = rect.w * 0.06;
      const padY = rect.h * 0.28;

      // 1) Ürün adı
      c.fillText(item.name, rect.x + padX, rect.y + padY);

      // 2) Fiyat + enerji
      const mult = this._getAddictionMultiplier(item.id);
      const pct = item.energyPct;
      const pctShown = mult < 1 ? Math.max(0, Math.round(pct * mult)) : pct;

      c.font = `600 ${subSize}px system-ui`;
      c.fillStyle = "rgba(255,255,255,0.85)";
      c.fillText(`${item.price} YTON  |  +%${pctShown} Enerji`, rect.x + padX, rect.y + padY + rect.h * 0.32);

      // 3) kullanım/bağımlılık info
      const u = this.state.usage[item.id];
      const used = u?.count ? Math.min(u.count, 999) : 0;

      let depTxt = "";
      if (u?.firstTs) {
        const leftMs = Math.max(0, this.ADDICTION_WINDOW_MS - (Date.now() - u.firstTs));
        const hh = String(Math.floor(leftMs / 3600000)).padStart(2, "0");
        const mm = String(Math.floor((leftMs % 3600000) / 60000)).padStart(2, "0");
        depTxt = `Bağımlılık reset: ${hh}:${mm}`;
      }

      c.font = `500 ${Math.max(10, rect.h * 0.20)}px system-ui`;
      c.fillStyle = "rgba(255,255,255,0.75)";
      c.fillText(`Kullanım: ${used}/${this.ADDICTION_TRIGGER}`, rect.x + padX, rect.y + rect.h * 0.92);
      if (depTxt) c.fillText(depTxt, rect.x + padX, rect.y + rect.h * 1.15);
    }
  }
}
