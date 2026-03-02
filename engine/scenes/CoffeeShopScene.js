export class CoffeeShopScene {
  constructor({ assets, i18n, scenes, store, input }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;
    this.store = store;
    this.input = input;

    this.menuOpen = false;

    // kitap tıklama alanı (ekranda ortada duracak)
    this.bookRect = { x: 0, y: 0, w: 0, h: 0 };
  }

  onEnter() {
    // refresh sonrası da menü açık/kapalı durumu hatırlansın istersen:
    // this.menuOpen = !!this.store.get("coffeeshop_menu_open");
  }

  onExit() {
    // this.store.set("coffeeshop_menu_open", this.menuOpen);
  }

  update(dt) {
    // Mouse/touch click yakalama
    if (this.input && this.input.justPressed && this.input.justPressed()) {
      const p = this.input.pointer ? this.input.pointer() : null;
      if (!p) return;

      const mx = p.x, my = p.y;

      // menü açıksa dışarı tıklayınca kapatma + sağ üst X alanı
      if (this.menuOpen) {
        // basit: menü arka planına tıklayınca kapansın
        // (istersen sadece X'e basınca kapatırız)
        this.menuOpen = false;
        // this.store.set("coffeeshop_menu_open", this.menuOpen);
        return;
      }

      // menü kapalıyken kitaba tıklanınca aç
      if (this.pointInRect(mx, my, this.bookRect)) {
        this.menuOpen = true;
        // this.store.set("coffeeshop_menu_open", this.menuOpen);
      }
    }
  }

  pointInRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  render(ctx, w, h) {
    // 1) Background (coffeeshop.png)
    const bg = this.assets.get ? this.assets.get("coffeeshop_bg") : null;
    if (bg) {
      // cover çizim (oran koru, ekranı tamamen kapla)
      const bw = bg.width, bh = bg.height;
      const scale = Math.max(w / bw, h / bh);
      const dw = bw * scale;
      const dh = bh * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(bg, dx, dy, dw, dh);
    } else {
      // bg yoksa siyah bas
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }

    // 2) Kitap (coffeeshop_book.png) ortada
    const book = this.assets.get ? this.assets.get("coffeeshop_book") : null;
    if (book) {
      const targetW = Math.min(260, w * 0.35);
      const ratio = book.height / book.width;
      const targetH = targetW * ratio;

      const x = (w - targetW) / 2;
      const y = (h - targetH) / 2;

      this.bookRect = { x, y, w: targetW, h: targetH };

      ctx.drawImage(book, x, y, targetW, targetH);

      // alt yazı
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Kitaba tıkla → Menü aç", w / 2, y + targetH + 28);
    }

    // 3) Menü açıkken (coffeeshop_menu.png) modal göster
    if (this.menuOpen) {
      // karartma
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

        // sağ üst kapatma butonu (X)
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
