export class CoffeeShopScene {
  constructor({ assets, i18n, scenes, store, input }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;
    this.store = store;
    this.input = input;

    this.menuOpen = false;

    // BG kitabın tıklama alanı
    this.bgBookHit = { x: 0, y: 0, w: 0, h: 0 };

    // bg cover ölçüleri
    this.bgDraw = { dx: 0, dy: 0, dw: 0, dh: 0 };
  }

  // Input sisteminden mouse/touch pozisyonunu "garanti" çek
  getPointerPos() {
    const i = this.input;
    if (!i) return null;

    // bazen fonksiyon değil obje olur
    if (typeof i.pointer === "function") {
      const p = i.pointer();
      if (p && typeof p.x === "number" && typeof p.y === "number") return p;
    }
    if (i.pointer && typeof i.pointer === "object") {
      const p = i.pointer;
      if (typeof p.x === "number" && typeof p.y === "number") return p;
    }

    // yaygın isimler
    if (i.mouse && typeof i.mouse.x === "number" && typeof i.mouse.y === "number") {
      return { x: i.mouse.x, y: i.mouse.y };
    }
    if (i.pos && typeof i.pos.x === "number" && typeof i.pos.y === "number") {
      return { x: i.pos.x, y: i.pos.y };
    }

    // düz x/y
    if (typeof i.x === "number" && typeof i.y === "number") {
      return { x: i.x, y: i.y };
    }
    if (typeof i.mx === "number" && typeof i.my === "number") {
      return { x: i.mx, y: i.my };
    }

    return null;
  }

  pointInRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  update(dt) {
    const i = this.input;
    if (!i) return;

    // senin engine’de bu çalışıyor: justPressed()
    const pressed = typeof i.justPressed === "function" ? i.justPressed() : false;
    if (!pressed) return;

    const p = this.getPointerPos();
    if (!p) return;

    const mx = p.x, my = p.y;

    // Menü açıksa her tıkta kapat (istersen sadece X yaparız)
    if (this.menuOpen) {
      this.menuOpen = false;
      return;
    }

    // BG kitap hitbox
    if (this.pointInRect(mx, my, this.bgBookHit)) {
      this.menuOpen = true;
    }
  }

  render(ctx, w, h) {
    // BG
    const bg = this.assets.get ? this.assets.get("coffeeshop_bg") : null;

    if (bg) {
      const bw = bg.width, bh = bg.height;
      const scale = Math.max(w / bw, h / bh);
      const dw = bw * scale;
      const dh = bh * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;

      this.bgDraw = { dx, dy, dw, dh };
      ctx.drawImage(bg, dx, dy, dw, dh);

      // ✅ Kitap hitbox (oranlar)
      // Eğer tıklama tam oturmazsa bu oranları ayarlayacağız.
      const book = {
        x: 0.20,
        y: 0.42,
        w: 0.26,
        h: 0.32,
      };

      this.bgBookHit = {
        x: dx + dw * book.x,
        y: dy + dh * book.y,
        w: dw * book.w,
        h: dh * book.h,
      };

      // Alt yazı
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Kitaba tıkla → Menü aç", w / 2, h - 90);

      // Debug görmek istersen aç:
      // ctx.strokeStyle = "rgba(0,255,0,0.6)";
      // ctx.lineWidth = 2;
      // ctx.strokeRect(this.bgBookHit.x, this.bgBookHit.y, this.bgBookHit.w, this.bgBookHit.h);
    } else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }

    // Menü modal
    if (this.menuOpen) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, w, h);

      const menuImg = this.assets.get ? this.assets.get("coffeeshop_menu") : null;
      if (menuImg) {
        const maxW = w * 0.75;
        const maxH = h * 0.8;

        const s = Math.min(maxW / menuImg.width, maxH / menuImg.height);
        const dw = menuImg.width * s;
        const dh = menuImg.height * s;

        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;

        ctx.drawImage(menuImg, dx, dy, dw, dh);

        // X butonu (şimdilik görsel)
        const bx = dx + dw - 44;
        const by = dy + 12;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.beginPath();
        ctx.roundRect(bx, by, 32, 32, 8);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "18px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("✕", bx + 16, by + 22);
      }
    }
  }
}
