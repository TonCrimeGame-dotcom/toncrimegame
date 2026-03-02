function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function fillRoundRect(ctx, x, y, w, h, r) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fill();
}
function strokeRoundRect(ctx, x, y, w, h, r) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.stroke();
}
function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export class CoffeeShopScene {
  constructor({ store, input, i18n, assets, scenes }) {
    this.store = store;
    this.input = input;
    this.i18n = i18n;
    this.assets = assets; // bg için kullanacağız: assets.getImage("coffeeshop")
    this.scenes = scenes;

    this.bookImg = new Image();
    this.bookImg.src = "./src/assets/coffeeshop_book.png";

    this.menuImg = new Image();
    this.menuImg.src = "./src/assets/coffeeshop_menu.png";

    this.isMenuOpen = false;

    this.bookRect = { x: 0, y: 0, w: 0, h: 0 };
    this.menuRect = { x: 0, y: 0, w: 0, h: 0 };
    this.closeRect = { x: 0, y: 0, w: 0, h: 0 };

    this.btnRects = []; // menü item buton alanları (render’da hesaplanır)

    this.toast = { text: "", until: 0 };
  }

  onEnter() {
    // player alanları yoksa tamamla (resetleme yok)
    const s = this.store.get();
    const p = s.player || {};
    const patch = {};
    if (p.energy == null) patch.energy = 10;
    if (p.energyMax == null) patch.energyMax = 10;
    if (p.username == null) patch.username = "Player";
    if (p.level == null) patch.level = 1;
    if (p.xp == null) patch.xp = 0;
    if (p.xpToNext == null) patch.xpToNext = 100;
    if (Object.keys(patch).length) this.store.set({ player: { ...p, ...patch } });
  }

  _toast(text, ms = 1400) {
    this.toast.text = text;
    this.toast.until = Date.now() + ms;
  }

  _addEnergy(amount) {
    const s = this.store.get();
    const p = s.player || {};
    const e = Number(p.energy || 0);
    const maxE = Math.max(1, Number(p.energyMax || 10));
    const newE = clamp(e + amount, 0, maxE);
    this.store.set({ player: { ...p, energy: newE } });
  }

  _spendYton(cost) {
    const s = this.store.get();
    const coins = Number(s.coins || 0);
    if (coins < cost) return false;
    this.store.set({ coins: coins - cost });
    return true;
  }

  _items() {
    // Menü görselindeki yazılar: “buton” olacak.
    // Enerji kazanımları: örnek (istersen sonra değiştiririz)
    return [
      { id: "espresso", label: "Espresso", cost: 50, energyGain: 1 },
      { id: "americano", label: "Americano", cost: 100, energyGain: 2 },
      { id: "darkroast", label: "Dark Roast", cost: 200, energyGain: 4 },
      { id: "ogkush", label: "OG Kush", cost: 70, energyGain: 1 },
      { id: "islandgold", label: "Island Gold", cost: 140, energyGain: 2 },
      { id: "nhkherb", label: "NHk Herb", cost: 200, energyGain: 4 },
    ];
  }

  update() {
    const px = this.input.pointer.x;
    const py = this.input.pointer.y;

    if (!this.input.justPressed()) return;

    // Menü kapalıyken: kitaba basınca aç
    if (!this.isMenuOpen) {
      if (pointInRect(px, py, this.bookRect)) {
        this.isMenuOpen = true;
        this._toast("Menü açıldı", 900);
      }
      return;
    }

    // Menü açıkken: X ile kapat
    if (pointInRect(px, py, this.closeRect)) {
      this.isMenuOpen = false;
      return;
    }

    // Menü açıkken: butonlar
    for (const b of this.btnRects) {
      if (pointInRect(px, py, b.rect)) {
        // satın al
        if (!this._spendYton(b.cost)) {
          this._toast("Yetersiz YTON", 1200);
          return;
        }
        this._addEnergy(b.energyGain);
        this._toast(`Satın alındı: ${b.label} (+${b.energyGain} enerji)`, 1400);
        return;
      }
    }

    // Menü dışında bir yere basınca kapatmak istersen:
    // if (!pointInRect(px, py, this.menuRect)) this.isMenuOpen = false;
  }

  render(ctx, w, h) {
    const s = this.store.get();
    const safe = s?.ui?.safe ?? { x: 0, y: 0, w, h };

    // BG (coffeeshop.png)
    const bg = this.assets.getImage("coffeeshop");
    if (bg) ctx.drawImage(bg, 0, 0, w, h);
    else {
      ctx.fillStyle = "#101018";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("coffeeshop.jpg yüklenmedi", w / 2, h / 2);
    }

    // Hafif karartma
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0, 0, w, h);

    // Üst HUD ve alt chat için boşluk
    const HUD_TOP_RESERVED = 96;
    const CHAT_BOTTOM_RESERVED = 74;

    const usableTop = safe.y + HUD_TOP_RESERVED;
    const usableBottom = safe.y + safe.h - CHAT_BOTTOM_RESERVED;

    // Kitap (kapak)
    const bookW = Math.min(safe.w * 0.52, 300);
    const bookH = bookW * 1.35;
    const bookX = safe.x + safe.w / 2 - bookW / 2;
    const bookY = usableTop + (usableBottom - usableTop) * 0.46 - bookH / 2;

    this.bookRect = { x: bookX, y: bookY, w: bookW, h: bookH };

    // kitap glow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    fillRoundRect(ctx, bookX, bookY, bookW, bookH, 18);
    ctx.restore();

    if (this.bookImg.complete && this.bookImg.naturalWidth > 0) {
      ctx.save();
      roundRectPath(ctx, bookX, bookY, bookW, bookH, 18);
      ctx.clip();
      // contain
      const img = this.bookImg;
      const sFit = Math.min(bookW / img.width, bookH / img.height);
      const dw = img.width * sFit;
      const dh = img.height * sFit;
      const dx = bookX + (bookW - dw) / 2;
      const dy = bookY + (bookH - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      fillRoundRect(ctx, bookX, bookY, bookW, bookH, 18);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("coffeeshop_book.png", bookX + bookW / 2, bookY + bookH / 2);
    }

    // kitaba basma ipucu
    if (!this.isMenuOpen) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      const tipW = Math.min(320, safe.w * 0.74);
      const tipH = 34;
      const tipX = safe.x + safe.w / 2 - tipW / 2;
      const tipY = bookY + bookH + 10;
      fillRoundRect(ctx, tipX, tipY, tipW, tipH, 12);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Kitaba tıkla → Menü aç", tipX + tipW / 2, tipY + 22);
    }

    // ===== Menü (overlay) =====
    this.btnRects = [];

    if (this.isMenuOpen) {
      // arka karartma
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, w, h);

      const menuW = Math.min(safe.w * 0.92, 520);
      const menuH = Math.min((usableBottom - usableTop) * 0.92, 520);
      const menuX = safe.x + safe.w / 2 - menuW / 2;
      const menuY = usableTop + (usableBottom - usableTop) / 2 - menuH / 2;

      this.menuRect = { x: menuX, y: menuY, w: menuW, h: menuH };

      // panel bg
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      fillRoundRect(ctx, menuX, menuY, menuW, menuH, 18);

      // menu image
      if (this.menuImg.complete && this.menuImg.naturalWidth > 0) {
        ctx.save();
        roundRectPath(ctx, menuX, menuY, menuW, menuH, 18);
        ctx.clip();

        const img = this.menuImg;
        const sFit = Math.min(menuW / img.width, menuH / img.height);
        const dw = img.width * sFit;
        const dh = img.height * sFit;
        const dx = menuX + (menuW - dw) / 2;
        const dy = menuY + (menuH - dh) / 2;

        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        fillRoundRect(ctx, menuX, menuY, menuW, menuH, 18);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "14px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("coffeeshop_menu.png", menuX + menuW / 2, menuY + menuH / 2);
      }

      // X kapat
      const xSize = 34;
      const xX = menuX + menuW - xSize - 10;
      const xY = menuY + 10;
      this.closeRect = { x: xX, y: xY, w: xSize, h: xSize };

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      fillRoundRect(ctx, xX, xY, xSize, xSize, 10);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      strokeRoundRect(ctx, xX + 0.5, xY + 0.5, xSize - 1, xSize - 1, 10);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "18px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("×", xX + xSize / 2, xY + 23);

      // ✅ Buton bölgeleri: menü görseline göre oranlı alanlar
      // Bu koordinatlar menü görselindeki 6 “ürün satırı”na denk gelecek şekilde tasarlandı.
      // Eğer senin menü görselinde biraz kayarsa, oranları ufak düzeltiriz.
      const items = this._items();

      // Menü içerik alanı (yaklaşık)
      const leftColX = menuX + menuW * 0.10;
      const rightColX = menuX + menuW * 0.54;
      const colW = menuW * 0.36;

      const rowY0 = menuY + menuH * 0.33;
      const rowGap = menuH * 0.18;
      const rowH = menuH * 0.13;

      // Sol kolon 3 item
      const left = [items[0], items[1], items[2]];
      // Sağ kolon 3 item
      const right = [items[3], items[4], items[5]];

      const makeBtn = (it, x, y) => {
        const r = { x, y, w: colW, h: rowH };
        this.btnRects.push({ ...it, rect: r });

        // görünmez tıklama alanını hafif belli et (istersen kapatırız)
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        fillRoundRect(ctx, r.x, r.y, r.w, r.h, 12);
        ctx.strokeStyle = "rgba(255,255,255,0.10)";
        strokeRoundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 12);
      };

      for (let i = 0; i < 3; i++) {
        makeBtn(left[i], leftColX, rowY0 + i * rowGap);
        makeBtn(right[i], rightColX, rowY0 + i * rowGap);
      }
    }

    // ===== Toast =====
    if (this.toast.text && Date.now() < this.toast.until) {
      const tw = Math.min(420, safe.w * 0.86);
      const th = 38;
      const tx = safe.x + safe.w / 2 - tw / 2;
      const ty = usableBottom - th - 10;

      ctx.fillStyle = "rgba(0,0,0,0.65)";
      fillRoundRect(ctx, tx, ty, tw, th, 12);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(this.toast.text, tx + tw / 2, ty + 24);
    }
  }
  }
