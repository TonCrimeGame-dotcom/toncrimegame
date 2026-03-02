export class CoffeeShopScene {
  constructor({ assets, store, input }) {
    this.assets = assets;
    this.store = store;
    this.input = input;

    this.menuOpen = false;

    // tıklanabilir alanlar (render sırasında hesaplanacak)
    this.bookRect = null;
    this.closeRect = null;
  }

  onEnter() {
    this.menuOpen = false;
  }

  update(dt) {
    // mouse/touch click yakalama (projendeki Input sistemine göre iki ihtimal var)
    const clicked =
      (this.input && this.input.justPressed && this.input.justPressed()) ||
      (this.input && this.input.mouse && this.input.mouse.justPressed);

    if (!clicked) return;

    const x = this.input.mouse?.x ?? this.input.x ?? 0;
    const y = this.input.mouse?.y ?? this.input.y ?? 0;

    // Menü kapatma (X)
    if (this.menuOpen && this.closeRect && pointInRect(x, y, this.closeRect)) {
      this.menuOpen = false;
      return;
    }

    // Menü açma (kitap)
    if (!this.menuOpen && this.bookRect && pointInRect(x, y, this.bookRect)) {
      this.menuOpen = true;
      return;
    }
  }

  render(ctx, w, h) {
    // ✅ Indoor background
    const bg = this.assets.getImage("coffeeshop_indoor");
    if (bg) {
      drawCover(ctx, bg, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }

    // Kitap (menü kapalıyken tıklanacak)
    if (!this.menuOpen) {
      const book = this.assets.getImage("coffeeshop_book");
      if (book) {
        const bw = Math.min(w * 0.28, 260);
        const bh = bw * (book.height / book.width);
        const bx = w * 0.38;
        const by = h * 0.33;

        ctx.save();
        ctx.globalAlpha = 0.98;
        ctx.drawImage(book, bx, by, bw, bh);
        ctx.restore();

        // tıklama alanı
        this.bookRect = { x: bx, y: by, w: bw, h: bh };

        // küçük yazı
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "14px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("Kitaba tıkla → Menü aç", bx + bw / 2, by + bh + 18);
      }
      return;
    }

    // ✅ Menü açıkken overlay
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Menü açık görseli
    const menuImg = this.assets.getImage("coffeeshop_menu_open");
    const modalW = Math.min(w * 0.65, 720);
    const modalH = Math.min(h * 0.78, 860);
    const mx = (w - modalW) / 2;
    const my = (h - modalH) / 2;

    // panel
    ctx.save();
    roundRect(ctx, mx, my, modalW, modalH, 18);
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fill();
    ctx.restore();

    if (menuImg) {
      // resim tam sığsın
      const pad = 18;
      const ix = mx + pad;
      const iy = my + pad;
      const iw = modalW - pad * 2;
      const ih = modalH - pad * 2;

      drawContain(ctx, menuImg, ix, iy, iw, ih);
    } else {
      ctx.fillStyle = "#fff";
      ctx.font = "16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Menu image missing", w / 2, h / 2);
    }

    // X butonu
    const cx = mx + modalW - 44;
    const cy = my + 14;
    this.closeRect = { x: cx, y: cy, w: 30, h: 30 };

    ctx.save();
    roundRect(ctx, cx, cy, 30, 30, 10);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "18px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("×", cx + 15, cy + 16);
    ctx.restore();
  }
}

/* ---------- helpers ---------- */

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function drawCover(ctx, img, x, y, w, h) {
  // cover: kırpıp doldurur
  const iw = img.width, ih = img.height;
  const ir = iw / ih;
  const r = w / h;

  let sx = 0, sy = 0, sw = iw, sh = ih;
  if (ir > r) {
    // image wider
    sh = ih;
    sw = ih * r;
    sx = (iw - sw) / 2;
  } else {
    sw = iw;
    sh = iw / r;
    sy = (ih - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawContain(ctx, img, x, y, w, h) {
  // contain: kırpmaz, sığdırır
  const iw = img.width, ih = img.height;
  const s = Math.min(w / iw, h / ih);
  const dw = iw * s;
  const dh = ih * s;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
