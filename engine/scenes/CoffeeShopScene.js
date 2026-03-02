// src/scenes/CoffeeShopScene.js
export class CoffeeShopScene {
  constructor({ assets, i18n, scenes, state, engine }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;
    this.engine = engine;

    // Global state (HUD ile aynı kaynaktan okumak için)
    // Eğer sende zaten state yöneten bir sistem varsa burayı kendi state’inle değiştir.
    this.state = state || (window.__TC_STATE ||= this._loadState());
  }

  // -------------------------------
  // Lifecycle
  // -------------------------------
  async onEnter() {
    this._menuOpen = false;
    this._page = 0; // 0..(pages-1)
    this._lastTick = performance.now();

    // Menü sayfaları (10 slot/sayfa = 5 sol + 5 sağ)
    this._items = this._buildItems(); // 30 item -> 3 sayfa

    // Pointer handler bağla (engine input API farklı olabiliyor)
    this._bindPointer();

    // Klavye (opsiyonel)
    this._onKeyDown = (e) => {
      if (!this._menuOpen) return;
      if (e.key === "ArrowRight") this._nextPage();
      if (e.key === "ArrowLeft") this._prevPage();
      if (e.key === "Escape") this._menuOpen = false;
    };
    window.addEventListener("keydown", this._onKeyDown);
  }

  onExit() {
    this._unbindPointer();
    if (this._onKeyDown) window.removeEventListener("keydown", this._onKeyDown);
  }

  update(dt) {
    // Bağımlılık reset (24 saat)
    this._maybeResetAddiction();
  }

  // -------------------------------
  // Rendering
  // -------------------------------
  render(ctx, w, h) {
    this._ctx = ctx;
    this._w = w;
    this._h = h;

    // Assets
    const bg = this.assets?.getImage?.("coffeeshop_bg");
    const menuImg = this.assets?.getImage?.("coffeeshop_menu");

    // BG çiz
    ctx.clearRect(0, 0, w, h);
    if (bg) {
      const r = this._drawCover(ctx, bg, 0, 0, w, h);
      // BG üzerinde kitabın clickable alanını bg görsel koordinatına göre kuracağız
      this._bgDrawRect = r;
    } else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      ctx.font = "16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("coffeeshop_bg bulunamadı (coffeeshop.png)", w / 2, h / 2);
    }

    // Menü açıksa overlay çiz
    if (this._menuOpen) {
      // karartma
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, w, h);

      if (menuImg) {
        const menuRect = this._drawContain(ctx, menuImg, w * 0.06, h * 0.04, w * 0.88, h * 0.92);
        this._menuDrawRect = menuRect;

        // Slot hitboxlarını menuImg’nin orijinal boyutuna göre normalize ettik
        const slotRects = this._computeMenuSlotRects(menuRect);

        // Ürünleri sayfaya dağıt (10 item / sayfa)
        const pageSize = 10;
        const totalPages = Math.ceil(this._items.length / pageSize);
        this._page = Math.max(0, Math.min(this._page, totalPages - 1));

        const start = this._page * pageSize;
        const pageItems = this._items.slice(start, start + pageSize);

        // Slotlara yazı bas
        for (let i = 0; i < slotRects.length; i++) {
          const item = pageItems[i];
          if (!item) continue;
          const r = slotRects[i];
          this._drawItemText(ctx, r, item);
        }

        // Sayfa kontrol (sol/sağ ok)
        this._drawPager(ctx, menuRect, this._page, totalPages);

        // Close button (X) sağ üst
        this._closeRect = {
          x: menuRect.x + menuRect.w - 44,
          y: menuRect.y + 14,
          w: 30,
          h: 30,
        };
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.roundRect(this._closeRect.x, this._closeRect.y, this._closeRect.w, this._closeRect.h, 8);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "18px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("×", this._closeRect.x + this._closeRect.w / 2, this._closeRect.y + this._closeRect.h / 2);

        // Bu slot rectlerini click için sakla
        this._slotRects = slotRects;
      } else {
        ctx.fillStyle = "#fff";
        ctx.font = "16px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("coffeeshop_menu bulunamadı (coffeeshop_menu.png)", w / 2, h / 2);
      }
    } else {
      // Menü kapalıyken hiçbir yazı basma (sen istemiyorsun)
      // sadece tıklanabilir alan aktif olacak.
      this._menuDrawRect = null;
      this._slotRects = null;
      this._closeRect = null;
    }
  }

  // -------------------------------
  // Input (Pointer)
  // -------------------------------
  _bindPointer() {
    // Engine input varsa onu dene
    const input = this.engine?.input || this.input;

    // 1) Eğer input.on varsa
    if (input && typeof input.on === "function") {
      this._inputOff = [];
      const offDown = input.on("pointerdown", (p) => {
        const x = p?.x ?? p?.clientX ?? 0;
        const y = p?.y ?? p?.clientY ?? 0;
        this._handlePointer(x, y, "engine");
      });
      if (typeof offDown === "function") this._inputOff.push(offDown);

      const offClick = input.on("click", (p) => {
        const x = p?.x ?? p?.clientX ?? 0;
        const y = p?.y ?? p?.clientY ?? 0;
        this._handlePointer(x, y, "engine");
      });
      if (typeof offClick === "function") this._inputOff.push(offClick);
      return;
    }

    // 2) Canvas üzerinden DOM event
    const canvas = this.engine?.canvas || this.canvas || document.querySelector("canvas");
    this._canvas = canvas;

    if (canvas) {
      this._onCanvasDown = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this._w / rect.width);
        const y = (e.clientY - rect.top) * (this._h / rect.height);
        this._handlePointer(x, y, "dom");
      };
      canvas.addEventListener("pointerdown", this._onCanvasDown);
      canvas.addEventListener("mousedown", this._onCanvasDown);
      canvas.addEventListener("touchstart", (t) => {
        const touch = t.touches?.[0];
        if (!touch) return;
        const rect = canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * (this._w / rect.width);
        const y = (touch.clientY - rect.top) * (this._h / rect.height);
        this._handlePointer(x, y, "dom");
      });
    }
  }

  _unbindPointer() {
    if (this._inputOff && this._inputOff.length) {
      for (const off of this._inputOff) {
        try {
          off();
        } catch {}
      }
    }
    this._inputOff = null;

    if (this._canvas && this._onCanvasDown) {
      this._canvas.removeEventListener("pointerdown", this._onCanvasDown);
      this._canvas.removeEventListener("mousedown", this._onCanvasDown);
    }
    this._onCanvasDown = null;
    this._canvas = null;
  }

  _handlePointer(x, y) {
    // Menü açıksa: close / pager / slot click
    if (this._menuOpen) {
      // close
      if (this._closeRect && this._hit(x, y, this._closeRect)) {
        this._menuOpen = false;
        return;
      }

      // pager
      if (this._pagerPrevRect && this._hit(x, y, this._pagerPrevRect)) {
        this._prevPage();
        return;
      }
      if (this._pagerNextRect && this._hit(x, y, this._pagerNextRect)) {
        this._nextPage();
        return;
      }

      // slot click
      if (this._slotRects && this._slotRects.length) {
        const pageSize = 10;
        const start = this._page * pageSize;
        const pageItems = this._items.slice(start, start + pageSize);

        for (let i = 0; i < this._slotRects.length; i++) {
          const r = this._slotRects[i];
          if (!r) continue;
          if (this._hit(x, y, r)) {
            const item = pageItems[i];
            if (item) this._buy(item);
            return;
          }
        }
      }

      // menü açıkken boş yere tık -> kapatma istemiyorsun, dokunma
      return;
    }

    // Menü kapalıysa: BG’deki kitabın alanına tıklanınca menü aç
    if (this._bgDrawRect) {
      const bookRect = this._computeBgBookRect(this._bgDrawRect);
      if (this._hit(x, y, bookRect)) {
        this._menuOpen = true;
        return;
      }
    }
  }

  // -------------------------------
  // Business Logic (Buy / Addiction)
  // -------------------------------
  _buy(item) {
    // YTON yeterli mi
    const yton = this.state.yton ?? this.state.coin ?? 0;
    if (yton < item.price) {
      this._toast(`YTON yetersiz (${item.price})`);
      return;
    }

    // 24 saat reset kontrolü
    this._maybeResetAddiction();

    // kullanım sayacı
    const now = Date.now();
    this.state.addiction ||= { resetAt: now, byId: {} };
    const byId = (this.state.addiction.byId ||= {});
    const rec = (byId[item.id] ||= { count: 0 });

    rec.count += 1;

    // 10+ kullanım -> enerji %2
    const basePct = item.energyPct; // 5
    const effectivePct = rec.count >= 10 ? Math.min(basePct, 2) : basePct;

    // Enerji ekle (0..10)
    const maxEnergy = 10;
    const curEnergy = this.state.energy ?? 0;
    const gain = (maxEnergy * effectivePct) / 100; // %5 -> 0.5
    const newEnergy = Math.min(maxEnergy, curEnergy + gain);

    // düş / yaz
    this.state.yton = yton - item.price;
    this.state.energy = newEnergy;

    // persist & HUD update
    this._saveState();
    this._emitStateChanged();

    this._toast(
      `${item.name}: -${item.price} YTON, +%${effectivePct} enerji (Kullanım ${rec.count}/10)`
    );
  }

  _maybeResetAddiction() {
    const now = Date.now();
    this.state.addiction ||= { resetAt: now, byId: {} };

    const resetAt = this.state.addiction.resetAt || now;
    const DAY = 24 * 60 * 60 * 1000;

    if (now - resetAt >= DAY) {
      // Reset
      this.state.addiction = { resetAt: now, byId: {} };
      this._saveState();
      this._emitStateChanged();
    }
  }

  // -------------------------------
  // Layout helpers (IMPORTANT: gerçek koordinatlar)
  // -------------------------------
  _computeBgBookRect(bgDrawRect) {
    // coffeeshop.png üzerinde kitabın yeri için normalize koordinat (0..1)
    // Bu değerler, senin BG görselindeki kitabın yaklaşık alanına göre seçildi.
    // Eğer 1-2 px kayma olursa sadece burayı oynatacaksın.
    //
    // (x,y,w,h) normalize:
    const nx = 0.23;
    const ny = 0.40;
    const nw = 0.30;
    const nh = 0.38;

    return {
      x: bgDrawRect.x + bgDrawRect.w * nx,
      y: bgDrawRect.y + bgDrawRect.h * ny,
      w: bgDrawRect.w * nw,
      h: bgDrawRect.h * nh,
    };
  }

  _computeMenuSlotRects(menuRect) {
    // coffeeshop_menu.png (1024x1536) baz alınarak normalize slot bölgeleri
    // 5 sol + 5 sağ = 10 slot. (Üstte 1 büyük, altında 4 küçük gibi)
    //
    // Bu normalize değerler, gönderdiğin “boş kutulu” menü görseline göre ayarlı.
    // Menü büyüyüp küçülse bile slotlar aynı oranda oturur.
    const slots = [
      // LEFT PAGE (x,y,w,h)
      { x: 0.10, y: 0.19, w: 0.38, h: 0.11 },
      { x: 0.10, y: 0.34, w: 0.38, h: 0.11 },
      { x: 0.10, y: 0.48, w: 0.38, h: 0.11 },
      { x: 0.10, y: 0.62, w: 0.38, h: 0.11 },
      { x: 0.10, y: 0.76, w: 0.38, h: 0.11 },

      // RIGHT PAGE
      { x: 0.54, y: 0.26, w: 0.38, h: 0.11 },
      { x: 0.54, y: 0.40, w: 0.38, h: 0.11 },
      { x: 0.54, y: 0.54, w: 0.38, h: 0.11 },
      { x: 0.54, y: 0.68, w: 0.38, h: 0.11 },
      { x: 0.54, y: 0.82, w: 0.38, h: 0.11 },
    ];

    return slots.map((s) => ({
      x: menuRect.x + menuRect.w * s.x,
      y: menuRect.y + menuRect.h * s.y,
      w: menuRect.w * s.w,
      h: menuRect.h * s.h,
    }));
  }

  _drawItemText(ctx, r, item) {
    // Yazıları kutuya sığdırma: 3 satır
    // 1) İsim (bold)
    // 2) fiyat + enerji
    // 3) kullanım sayaç
    const padX = r.w * 0.06;
    const padY = r.h * 0.18;

    // click hissi için çok hafif highlight (isteğe bağlı)
    // ctx.strokeStyle = "rgba(255,255,255,0.06)";
    // ctx.strokeRect(r.x, r.y, r.w, r.h);

    const name = item.name.toUpperCase();
    const line2 = `${item.price} YTON  |  +%${item.energyPct} Enerji`;

    // kullanım
    const rec = this.state.addiction?.byId?.[item.id];
    const count = rec?.count ?? 0;

    // bağımlılık durumunda enerji efektif %2
    const effectivePct = count >= 10 ? 2 : item.energyPct;

    const line3 = count >= 10 ? `Bağımlılık aktif (Kull.: ${count}/10)` : `Kullanım: ${count}/10`;

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255,255,255,0.95)";

    // 1) NAME (fit)
    const maxW = r.w - padX * 2;
    const nameSize = this._fitText(ctx, name, maxW, 22, 14, 800);
    ctx.font = `800 ${nameSize}px system-ui`;
    const safeName = this._ellipsis(ctx, name, maxW);
    ctx.fillText(safeName, r.x + padX, r.y + padY);

    // 2) PRICE + ENERGY
    const pSize = Math.max(12, Math.floor(nameSize * 0.58));
    ctx.font = `700 ${pSize}px system-ui`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    const safe2 = this._ellipsis(ctx, line2.replace("+%5", `+%${effectivePct}`), maxW);
    ctx.fillText(safe2, r.x + padX, r.y + padY + r.h * 0.33);

    // 3) COUNT
    const cSize = Math.max(11, Math.floor(nameSize * 0.52));
    ctx.font = `600 ${cSize}px system-ui`;
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    const safe3 = this._ellipsis(ctx, line3, maxW);
    ctx.fillText(safe3, r.x + padX, r.y + padY + r.h * 0.62);
  }

  _drawPager(ctx, menuRect, page, totalPages) {
    const y = menuRect.y + menuRect.h - 46;

    // sayfa yazısı
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "700 16px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Sayfa ${page + 1}/${totalPages}`, menuRect.x + menuRect.w / 2, y);

    // ok butonları
    const btn = { w: 44, h: 30 };
    this._pagerPrevRect = { x: menuRect.x + menuRect.w * 0.30 - btn.w / 2, y - btn.h / 2, w: btn.w, h: btn.h };
    this._pagerNextRect = { x: menuRect.x + menuRect.w * 0.70 - btn.w / 2, y - btn.h / 2, w: btn.w, h: btn.h };

    const drawArrow = (rect, dir) => {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      if (dir === "left") {
        ctx.moveTo(rect.x + rect.w * 0.62, rect.y + rect.h * 0.22);
        ctx.lineTo(rect.x + rect.w * 0.38, rect.y + rect.h * 0.50);
        ctx.lineTo(rect.x + rect.w * 0.62, rect.y + rect.h * 0.78);
      } else {
        ctx.moveTo(rect.x + rect.w * 0.38, rect.y + rect.h * 0.22);
        ctx.lineTo(rect.x + rect.w * 0.62, rect.y + rect.h * 0.50);
        ctx.lineTo(rect.x + rect.w * 0.38, rect.y + rect.h * 0.78);
      }
      ctx.closePath();
      ctx.fill();
    };

    // disable durumunu görsel olarak hafiflet
    if (page <= 0) {
      ctx.globalAlpha = 0.35;
      drawArrow(this._pagerPrevRect, "left");
      ctx.globalAlpha = 1;
    } else {
      drawArrow(this._pagerPrevRect, "left");
    }

    if (page >= totalPages - 1) {
      ctx.globalAlpha = 0.35;
      drawArrow(this._pagerNextRect, "right");
      ctx.globalAlpha = 1;
    } else {
      drawArrow(this._pagerNextRect, "right");
    }
  }

  _nextPage() {
    const totalPages = Math.ceil(this._items.length / 10);
    this._page = Math.min(totalPages - 1, this._page + 1);
  }

  _prevPage() {
    this._page = Math.max(0, this._page - 1);
  }

  // -------------------------------
  // Text fitting helpers (senin screenshot’taki kısım)
  // -------------------------------
  _fitText(ctx, text, maxWidth, startPx, minPx, weight = 700) {
    let size = startPx;
    while (size >= minPx) {
      ctx.font = `${weight} ${size}px system-ui`;
      if (ctx.measureText(text).width <= maxWidth) return size;
      size -= 1;
    }
    return minPx;
  }

  _ellipsis(ctx, text, maxWidth) {
    ctx = ctx || this._ctx;
    if (!ctx) return text;
    if (ctx.measureText(text).width <= maxWidth) return text;
    const ell = "…";
    let t = text;
    while (t.length > 0) {
      t = t.slice(0, -1);
      if (ctx.measureText(t + ell).width <= maxWidth) return t + ell;
    }
    return ell;
  }

  // -------------------------------
  // Draw helpers
  // -------------------------------
  _drawCover(ctx, img, x, y, w, h) {
    // cover: resmi kırparak alanı doldurur
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    return { x: dx, y: dy, w: dw, h: dh };
  }

  _drawContain(ctx, img, x, y, w, h) {
    // contain: resmi kırpmadan sığdırır
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.min(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    return { x: dx, y: dy, w: dw, h: dh };
  }

  _hit(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  // -------------------------------
  // Items
  // -------------------------------
  _buildItems() {
    // 30 kurgusal ürün (strains/türler gibi), tek mekanik:
    // min 10 YTON, +%5 enerji, 10+ kullanımdan sonra +%2 (24 saat reset)
    const names = [
      "Shadow Kush",
      "Blue Drift",
      "Neon Haze",
      "Lemon Sketch",
      "White Veil",
      "Gelato Flux",
      "ZK Sugar",
      "GSC Prime",
      "Night Sherb",
      "Island Gold",

      "Street Mix",
      "Amber Shard",
      "Viper Crux",
      "Nova Dust",
      "Velvet Stone",
      "Crystal Leaf",
      "Rift Resin",
      "Pulse Powder",
      "Echo Chip",
      "Frost Flake",

      "Kush X",
      "Midnight Mint",
      "Cobalt Cloud",
      "Sour Orbit",
      "Polar Wax",
      "Redline Resin",
      "Ghost Kief",
      "Lava Kief",
      "Quartz Pop",
      "Melted Sugar",
    ];

    // fiyatları kurgusal basamak
    const prices = names.map((_, i) => {
      if (i === 0) return 10;
      return Math.min(10 + i, 35);
    });

    return names.map((n, i) => ({
      id: `item_${i}`,
      name: n,
      price: prices[i],
      energyPct: 5,
    }));
  }

  // -------------------------------
  // State / HUD
  // -------------------------------
  _emitStateChanged() {
    try {
      window.dispatchEvent(new CustomEvent("tc_state_changed", { detail: this.state }));
    } catch {}
  }

  _loadState() {
    try {
      const raw = localStorage.getItem("tc_state");
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      yton: 0,
      energy: 10,
      addiction: { resetAt: Date.now(), byId: {} },
    };
  }

  _saveState() {
    try {
      localStorage.setItem("tc_state", JSON.stringify(this.state));
    } catch {}
  }

  _toast(msg) {
    // İstersen HUD chat’e basarsın; şimdilik console
    console.log("[CoffeeShop]", msg);
  }
}

// roundRect polyfill (bazı canvas’larda yok)
if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rr = Array.isArray(r) ? r : [r, r, r, r];
    const [r1, r2, r3, r4] = rr.map((v) => Math.max(0, Math.min(v, Math.min(w, h) / 2)));
    this.beginPath();
    this.moveTo(x + r1, y);
    this.lineTo(x + w - r2, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r2);
    this.lineTo(x + w, y + h - r3);
    this.quadraticCurveTo(x + w, y + h, x + w - r3, y + h);
    this.lineTo(x + r4, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r4);
    this.lineTo(x, y + r1);
    this.quadraticCurveTo(x, y, x + r1, y);
    this.closePath();
    return this;
  };
      }
