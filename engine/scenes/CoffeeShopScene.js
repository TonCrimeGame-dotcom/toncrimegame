export class CoffeeShopScene {
  constructor({ assets, i18n, scenes, store, input }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;
    this.store = store;
    this.input = input;

    this.menuOpen = false;

    // BG üstündeki kitabın tıklama alanı (ekrana göre hesaplanacak)
    this.bgBookHit = { x: 0, y: 0, w: 0, h: 0 };

    // Son render'da kullanılan bg cover ölçüleri (hitbox hesabı için)
    this.bgDraw = { dx: 0, dy: 0, dw: 0, dh: 0 };
  }

  update(dt) {
    if (this.input && this.input.justPressed && this.input.justPressed()) {
      const p = this.input.pointer ? this.input.pointer() : null;
      if (!p) return;

      const mx = p.x, my = p.y;

      // Menü açıksa tıklayınca kapat (istersen sadece X yaparız)
      if (this.menuOpen) {
        this.menuOpen = false;
        return;
      }

      // BG üzerindeki kitap bölgesine tıklayınca menü aç
      if (this.pointInRect(mx, my, this.bgBookHit)) {
        this.menuOpen = true;
      }
    }
  }

  pointInRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  render(ctx, w, h) {
    // 1) Background (coffeeshop.png) - cover
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

      // ✅ BG üzerindeki kitabın hitbox'ını ayarla
      // Bu oranlar bg resmine göredir (0..1). Şu an tahmini verdim.
      // Eğer tıklama tam oturmazsa oranları birlikte ince ayarlarız.
      const book = {
        x: 0.32, // soldan oran
        y: 0.33, // yukarıdan oran
        w: 0.22, // genişlik oran
        h: 0.30, // yükseklik oran
      };

      this.bgBookHit = {
        x: dx + dw * book.x,
        y: dy + dh * book.y,
        w: dw * book.w,
        h: dh * book.h,
      };

      // DEBUG: hitbox’ı görmek istersen aç
      // ctx.strokeStyle = "rgba(0,255,0,0.6)";
      // ctx.lineWidth = 2;
      // ctx.strokeRect(this.bgBookHit.x, this.bgBookHit.y, this.bgBookHit.w, this.bgBookHit.h);

      // Alt yazı (kitap çizmeden sadece yönlendirme)
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Kitaba tıkla → Menü aç", w / 2, h - 90);
    } else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }

    // 2) Menü açıkken modal
    if (this.menuOpen) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, w, h);

      const menuImg = this.assets.get ? this.assets.get("coffeeshop_menu") : null;
      if (menuImg) {
        const maxW = w * 0.75;
        const maxH = h * 0.8;

        const scale = Math.min(maxW / menuImg.width, maxH / menuImg.height);
        const dw = menuImg.width * scale;
        const dh = menuImg.height * scale;

        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;

        ctx.drawImage(menuImg, dx, dy, dw, dh);

        // X butonu görsel
        const bx = dx + dw - 40;
        const by = dy + 10;
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.beginPath();
        ctx.roundRect(bx, by, 30, 30, 8);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "18px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("✕", bx + 15, by + 21);
      }
    }
  }
}
