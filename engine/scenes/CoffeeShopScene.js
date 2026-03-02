// src/scenes/CoffeeShopScene.js
export class CoffeeShopScene {
  constructor({ assets, i18n, scenes, state, engine }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;
    this.engine = engine;

    // Global state (HUD ile ortak kullanılabilir)
    if (state) {
      this.state = state;
    } else {
      if (!window.__TC_STATE) window.__TC_STATE = this._loadState();
      this.state = window.__TC_STATE;
    }

    this._menuOpen = false;
    this._page = 0;
    this._items = this._buildItems(); // 30 ürün -> 3 sayfa (10 slot/sayfa)
  }

  // -------------------------------
  // Lifecycle
  // -------------------------------
  onEnter() {
    this._menuOpen = false;
    this._page = 0;
    this._bindPointer();

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
    this._maybeResetAddiction();
  }

  // -------------------------------
  // Render
  // -------------------------------
  render(ctx, w, h) {
    this._ctx = ctx;
    this._w = w;
    this._h = h;

    const bg = this.assets && this.assets.getImage ? this.assets.getImage("coffeeshop_bg") : null;
    const menuImg = this.assets && this.assets.getImage ? this.assets.getImage("coffeeshop_menu") : null;

    ctx.clearRect(0, 0, w, h);

    // BG
    if (bg) {
      const r = this._drawCover(ctx, bg, 0, 0, w, h);
      this._bgDrawRect = r;
    } else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      ctx.font = "16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("coffeeshop.png bulunamadı (key: coffeeshop_bg)", w / 2, h / 2);
      this._bgDrawRect = null;
    }

    // Menü kapalıyken hiçbir yazı yok
    if (!this._menuOpen) {
      this._menuDrawRect = null;
      this._slotRects = null;
      this._closeRect = null;
      this._pagerPrevRect = null;
      this._pagerNextRect = null;
      return;
    }

    // Menü açık overlay
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, w, h);

    if (!menuImg) {
      ctx.fillStyle = "#fff";
      ctx.font = "16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("coffeeshop_menu.png bulunamadı (key: coffeeshop_menu)", w / 2, h / 2);
      return;
    }

    // Menü görseli: contain (büyüme/küçülme tutarlı)
    const menuRect = this._drawContain(ctx, menuImg, w * 0.06, h * 0.04, w * 0.88, h * 0.92);
    this._menuDrawRect = menuRect;

    // Slot rectleri (normalize -> gerçek px)
    const slotRects = this._computeMenuSlotRects(menuRect);
    this._slotRects = slotRects;

    // Sayfalama
    const pageSize = 10;
    const totalPages = Math.ceil(this._items.length / pageSize);
    if (this._page < 0) this._page = 0;
    if (this._page > totalPages - 1) this._page = totalPages - 1;

    const start = this._page * pageSize;
    const pageItems = this._items.slice(start, start + pageSize);

    // Ürün yazıları
    for (let i = 0; i < slotRects.length; i++) {
      const item = pageItems[i];
      if (!item) continue;
      this._drawItemText(ctx, slotRects[i], item);
    }

    // Pager + close
    this._drawPager(ctx, menuRect, this._page, totalPages);

    this._closeRect = {
      x: menuRect.x + menuRect.w - 44,
      y: menuRect.y + 14,
      w: 30,
      h: 30,
    };
    this._drawRoundedBox(ctx, this._closeRect.x, this._closeRect.y, this._closeRect.w, this._closeRect.h, 8, "rgba(0,0,0,0.45)", "rgba(255,255,255,0.35)");
    ctx.fillStyle = "#fff";
    ctx.font = "18px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("x", this._closeRect.x + this._closeRect.w / 2, this._closeRect.y + this._closeRect.h / 2);
  }

  // -------------------------------
  // Input
  // -------------------------------
  _bindPointer() {
    const canvas = (this.engine && this.engine.canvas) ? this.engine.canvas : document.querySelector("canvas");
    this._canvas = canvas;

    this._onCanvasDown = (e) => {
      if (!this._ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this._w / rect.width);
      const y = (e.clientY - rect.top) * (this._h / rect.height);
      this._handlePointer(x, y);
    };

    if (canvas) {
      canvas.addEventListener("pointerdown", this._onCanvasDown);
      canvas.addEventListener("mousedown", this._onCanvasDown);
    }
  }

  _unbindPointer() {
    if (this._canvas && this._onCanvasDown) {
      this._canvas.removeEventListener("pointerdown", this._onCanvasDown);
      this._canvas.removeEventListener("mousedown", this._onCanvasDown);
    }
    this._canvas = null;
    this._onCanvasDown = null;
  }

  _handlePointer(x, y) {
    // Menü açıksa
    if (this._menuOpen) {
      if (this._closeRect && this._hit(x, y, this._closeRect)) {
        this._menuOpen = false;
        return;
      }

      if (this._pagerPrevRect && this._hit(x, y, this._pagerPrevRect)) {
        this._prevPage();
        return;
      }
      if (this._pagerNextRect && this._hit(x, y, this._pagerNextRect)) {
        this._nextPage();
        return;
      }

      // Slot click -> satın al
      if (this._slotRects && this._slotRects.length) {
        const pageSize = 10;
        const start = this._page * pageSize;
        const pageItems = this._items.slice(start, start + pageSize);

        for (let i = 0; i < this._slotRects.length; i++) {
          const r = this._slotRects[i];
          if (r && this._hit(x, y, r)) {
            const item = pageItems[i];
            if (item) this._buy(item);
            return;
          }
        }
      }
      return;
    }

    // Menü kapalıyken: BG kitabına tıklayınca aç
    if (this._bgDrawRect) {
      const bookRect = this._computeBgBookRect(this._bgDrawRect);
      if (this._hit(x, y, bookRect)) {
        this._menuOpen = true;
      }
    }
  }

  // -------------------------------
  // Logic: Buy / Addiction
  // -------------------------------
  _buy(item) {
    const yton = (typeof this.state.yton === "number") ? this.state.yton : 0;
    if (yton < item.price) {
      console.log("[CoffeeShop] YTON yetersiz:", item.price);
      return;
    }

    this._maybeResetAddiction();

    if (!this.state.addiction) this.state.addiction = { resetAt: Date.now(), byId: {} };
    if (!this.state.addiction.byId) this.state.addiction.byId = {};
    if (!this.state.addiction.byId[item.id]) this.state.addiction.byId[item.id] = { count: 0 };

    const rec = this.state.addiction.byId[item.id];
    rec.count += 1;

    // 10+ kullanımda enerji %2
    const basePct = item.energyPct; // 5
    const effectivePct = (rec.count >= 10) ? 2 : basePct;

    const maxEnergy = 10;
    const curEnergy = (typeof this.state.energy === "number") ? this.state.energy : 0;

    const gain = (maxEnergy * effectivePct) / 100; // %5 -> 0.5
    const newEnergy = Math.min(maxEnergy, curEnergy + gain);

    this.state.yton = yton - item.price;
    this.state.energy = newEnergy;

    this._saveState();
    this._emitStateChanged();
  }

  _maybeResetAddiction() {
    const now = Date.now();
    if (!this.state.addiction) {
      this.state.addiction = { resetAt: now, byId: {} };
      return;
    }
    const resetAt = this.state.addiction.resetAt || now;
    const DAY = 24 * 60 * 60 * 1000;
    if (now - resetAt >= DAY) {
      this.state.addiction = { resetAt: now, byId: {} };
      this._saveState();
      this._emitStateChanged();
    }
  }

  // -------------------------------
  // Layout (COORDINATE)
  // -------------------------------
  _computeBgBookRect(bgDrawRect) {
    // coffeeshop.png üzerindeki kitabın normalize alanı
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
    // coffeeshop_menu.png (1024x1536) normalize slotlar
    const slots = [
      // left 5
      { x: 0.10, y: 0.19, w: 0.38, h: 0.11 },
      { x: 0.10, y: 0.34, w: 0.38, h: 0.11 },
      { x: 0.10, y: 0.48, w: 0.38, h: 0.11 },
      { x: 0.10, y: 0.62, w: 0.38, h: 0.11 },
      { x: 0.10, y: 0.76, w: 0.38, h: 0.11 },
      // right 5
      { x: 0.54, y: 0.26, w: 0.38, h: 0.11 },
      { x: 0.54, y: 0.40, w: 0.38, h: 0.11 },
      { x: 0.54, y: 0.54, w: 0.38, h: 0.11 },
      { x: 0.54, y: 0.68, w: 0.38, h: 0.11 },
      { x: 0.54, y: 0.82, w: 0.38, h: 0.11 },
    ];

    const out = [];
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      out.push({
        x: menuRect.x + menuRect.w * s.x,
        y: menuRect.y + menuRect.h * s.y,
        w: menuRect.w * s.w,
        h: menuRect.h * s.h,
      });
    }
    return out;
  }

  _drawItemText(ctx, r, item) {
    const padX = r.w * 0.06;
    const padY = r.h * 0.18;
    const maxW = r.w - padX * 2;

    // usage
    const rec = (this.state.addiction && this.state.addiction.byId) ? this.state.addiction.byId[item.id] : null;
    const count = rec ? rec.count : 0;
    const effectivePct = (count >= 10) ? 2 : item.energyPct;

    const name = String(item.name || "").toUpperCase();
    const line2 = item.price + " YTON  |  +%" + effectivePct + " Enerji";
    const line3 = (count >= 10) ? ("Bagimlilik aktif (Kull.: " + count + "/10)") : ("Kullanim: " + count + "/10");

    // NAME
    const nameSize = this._fitText(ctx, name, maxW, 22, 14, 800);
    ctx.font = "800 " + nameSize + "px system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(this._ellipsis(ctx, name, maxW), r.x + padX, r.y + padY);

    // LINE2
    const pSize = Math.max(12, Math.floor(nameSize * 0.58));
    ctx.font = "700 " + pSize + "px system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(this._ellipsis(ctx, line2, maxW), r.x + padX, r.y + padY + r.h * 0.33);

    // LINE3
    const cSize = Math.max(11, Math.floor(nameSize * 0.52));
    ctx.font = "600 " + cSize + "px system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.fillText(this._ellipsis(ctx, line3, maxW), r.x + padX, r.y + padY + r.h * 0.62);
  }

  _drawPager(ctx, menuRect, page, totalPages) {
    const y = menuRect.y + menuRect.h - 46;

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "700 16px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Sayfa " + (page + 1) + "/" + totalPages, menuRect.x + menuRect.w / 2, y);

    const bw = 44, bh = 30;
    this._pagerPrevRect = { x: menuRect.x + menuRect.w * 0.30 - bw / 2, y: y - bh / 2, w: bw, h: bh };
    this._pagerNextRect = { x: menuRect.x + menuRect.w * 0.70 - bw / 2, y: y - bh / 2, w: bw, h: bh };

    const drawArrow = (rect, dir, enabled) => {
      ctx.save();
      ctx.globalAlpha = enabled ? 1 : 0.35;

      this._drawRoundedBox(ctx, rect.x, rect.y, rect.w, rect.h, 10, "rgba(0,0,0,0.35)", "rgba(255,255,255,0.25)");
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

      ctx.restore();
    };

    drawArrow(this._pagerPrevRect, "left", page > 0);
    drawArrow(this._pagerNextRect, "right", page < totalPages - 1);
  }

  _nextPage() {
    const totalPages = Math.ceil(this._items.length / 10);
    this._page = Math.min(totalPages - 1, this._page + 1);
  }

  _prevPage() {
    this._page = Math.max(0, this._page - 1);
  }

  // -------------------------------
  // Text helpers
  // -------------------------------
  _fitText(ctx, text, maxWidth, startPx, minPx, weight) {
    let size = startPx;
    while (size >= minPx) {
      ctx.font = weight + " " + size + "px system-ui";
      if (ctx.measureText(text).width <= maxWidth) return size;
      size -= 1;
    }
    return minPx;
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

  // -------------------------------
  // Draw helpers
  // -------------------------------
  _drawCover(ctx, img, x, y, w, h) {
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

  _drawRoundedBox(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();

    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  _hit(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  // -------------------------------
  // Items
  // -------------------------------
  _buildItems() {
    const names = [
      "Shadow Kush","Blue Drift","Neon Haze","Lemon Sketch","White Veil",
      "Gelato Flux","ZK Sugar","GSC Prime","Night Sherb","Island Gold",
      "Street Mix","Amber Shard","Viper Crux","Nova Dust","Velvet Stone",
      "Crystal Leaf","Rift Resin","Pulse Powder","Echo Chip","Frost Flake",
      "Kush X","Midnight Mint","Cobalt Cloud","Sour Orbit","Polar Wax",
      "Redline Resin","Ghost Kief","Lava Kief","Quartz Pop","Melted Sugar"
    ];

    const items = [];
    for (let i = 0; i < names.length; i++) {
      let price = 10;
      if (i > 0) price = Math.min(10 + i, 35);
      items.push({ id: "item_" + i, name: names[i], price: price, energyPct: 5 });
    }
    return items;
  }

  // -------------------------------
  // State
  // -------------------------------
  _emitStateChanged() {
    try {
      window.dispatchEvent(new CustomEvent("tc_state_changed", { detail: this.state }));
    } catch (e) {}
  }

  _loadState() {
    try {
      const raw = localStorage.getItem("tc_state");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      yton: 0,
      energy: 10,
      addiction: { resetAt: Date.now(), byId: {} },
    };
  }

  _saveState() {
    try {
      localStorage.setItem("tc_state", JSON.stringify(this.state));
    } catch (e) {}
  }
  }
