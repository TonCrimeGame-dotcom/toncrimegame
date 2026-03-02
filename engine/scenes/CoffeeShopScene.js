// src/scenes/CoffeeShopScene.js
// Menü görseli: src/assets/coffeeshop_menu.png
// Arka plan:    src/assets/coffeeshop.png
// (Opsiyonel)   src/assets/coffeeshop_book.png  (bu kod çizmez)

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function now() {
  return Date.now();
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function ensurePlayerState() {
  const s = loadJSON("tc_player", null);
  if (s && typeof s === "object") return s;

  const init = {
    name: "Player",
    yton: 500,
    energy: 5,     // 0-10
    energyMax: 10,
    xp: 30,
    level: 1,
  };
  saveJSON("tc_player", init);
  return init;
}

function ensureDrugState() {
  // bağımlılık: aynı ürünü 10 kullanım sonrası -> enerji kazancı %2’ye düşer
  // 24 saat sonra reset
  const d = loadJSON("tc_drugs", null);
  if (d && typeof d === "object") return d;

  const init = {
    // key: { uses: number, firstUseAt: ms, addictedUntil: ms }
  };
  saveJSON("tc_drugs", init);
  return init;
}

function getDrugMeta(drugs, key) {
  if (!drugs[key]) drugs[key] = { uses: 0, firstUseAt: 0, addictedUntil: 0 };
  return drugs[key];
}

function isAddicted(meta) {
  return meta.addictedUntil && meta.addictedUntil > now();
}

function updateAddiction(meta) {
  // 24 saat reset mantığı:
  // Eğer ilk kullanımdan 24 saat geçtiyse kullanımı sıfırla
  if (meta.firstUseAt && now() - meta.firstUseAt >= 24 * 60 * 60 * 1000) {
    meta.uses = 0;
    meta.firstUseAt = 0;
    meta.addictedUntil = 0;
  }

  // 10 kullanım sonrası addicted 24 saat
  if (meta.uses >= 10 && !isAddicted(meta)) {
    meta.addictedUntil = now() + 24 * 60 * 60 * 1000;
  }
}

function formatLeft(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export class CoffeeShopScene {
  constructor({ assets, i18n, scenes }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;

    this.player = ensurePlayerState();
    this.drugs = ensureDrugState();

    this.menuOpen = false;
    this.page = 0; // 0..n

    // 30 ürün (kurgusal / piyasadan “çok uzaklaşmadan” gibi duran isimler)
    // Fiyatlar oyun içi YTON (gerçek piyasaya dayandırma yok)
    // Enerji kazancı: temel %5; bağımlıysa %2
    this.items = [
      { key: "og_kush", name: "OG Kush", price: 10, energyPct: 5 },
      { key: "purple_haze", name: "Purple Haze", price: 12, energyPct: 5 },
      { key: "lemon_skunk", name: "Lemon Skunk", price: 13, energyPct: 5 },
      { key: "white_widow", name: "White Widow", price: 14, energyPct: 5 },
      { key: "blue_dream", name: "Blue Dream", price: 15, energyPct: 5 },
      { key: "gelato_41", name: "Gelato 41", price: 16, energyPct: 5 },
      { key: "zkittlez", name: "Zkittlez", price: 16, energyPct: 5 },
      { key: "gsc", name: "GSC", price: 17, energyPct: 5 },

      { key: "diamond_dust", name: "Diamond Dust", price: 18, energyPct: 5 },
      { key: "glass_shards", name: "Glass Shards", price: 18, energyPct: 5 },
      { key: "neon_crystal", name: "Neon Crystal", price: 19, energyPct: 5 },
      { key: "midnight_rock", name: "Midnight Rock", price: 19, energyPct: 5 },
      { key: "street_mdm", name: "Street MDM", price: 20, energyPct: 5 },
      { key: "soft_powder", name: "Soft Powder", price: 20, energyPct: 5 },
      { key: "hard_powder", name: "Hard Powder", price: 21, energyPct: 5 },
      { key: "pure_powder", name: "Pure Powder", price: 22, energyPct: 5 },

      { key: "red_crystal", name: "Red Crystal", price: 22, energyPct: 5 },
      { key: "ice_kristal", name: "Ice Kristal", price: 23, energyPct: 5 },
      { key: "gold_flake", name: "Gold Flake", price: 24, energyPct: 5 },
      { key: "black_tar", name: "Black Tar", price: 25, energyPct: 5 },
      { key: "silver_line", name: "Silver Line", price: 26, energyPct: 5 },
      { key: "night_snow", name: "Night Snow", price: 27, energyPct: 5 },
      { key: "acid_drop", name: "Acid Drop", price: 28, energyPct: 5 },
      { key: "astro_tabs", name: "Astro Tabs", price: 29, energyPct: 5 },

      { key: "retro_pills", name: "Retro Pills", price: 30, energyPct: 5 },
      { key: "neon_pills", name: "Neon Pills", price: 32, energyPct: 5 },
      { key: "shadow_tabs", name: "Shadow Tabs", price: 34, energyPct: 5 },
      { key: "velvet_powder", name: "Velvet Powder", price: 36, energyPct: 5 },
      { key: "chrome_dust", name: "Chrome Dust", price: 38, energyPct: 5 },
      { key: "ultra_crystal", name: "Ultra Crystal", price: 40, energyPct: 5 },
    ];

    // menüde aynı anda 8 ürün (sol 4 + sağ 4)
    this.PAGE_SIZE = 8;

    // tıklama alanları (yüzde) — gerekirse mikro ayar yaparsın
    // Arka plandaki büyük kitabın yaklaşık alanı
    this.BOOK_HIT = { x: 0.23, y: 0.40, w: 0.30, h: 0.38 };

    // Menü popup konumu/ölçeği
    this.MENU_RECT = { x: 0.18, y: 0.10, w: 0.44, h: 0.82 }; // ekranın sol-orta kısmı

    // Kutuların merkezleri (menu rect içinde yüzdesel)
    // Sol sayfa 4 kutu, sağ sayfa 4 kutu
    this.BOX_LAYOUT = {
      leftX: 0.25,
      rightX: 0.75,
      startY: 0.30,
      gapY: 0.14,
    };

    // close butonu (menü üst sağ)
    this.CLOSE_HIT = { x: 0.86, y: 0.06, w: 0.10, h: 0.08 }; // menu rect içinde yüzde

    // sayfa okları (menü alt)
    this.PREV_HIT = { x: 0.10, y: 0.92, w: 0.18, h: 0.07 };
    this.NEXT_HIT = { x: 0.72, y: 0.92, w: 0.18, h: 0.07 };

    // canvas click listener (engine input’a bağlı kalmıyoruz)
    this._clickHandler = null;
  }

  async onEnter() {
    // Canvas bul (engine fark etmeksizin)
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    // Tek sefer bağla
    if (!this._clickHandler) {
      this._clickHandler = (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = canvas.width / rect.width;
        const sy = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * sx;
        const y = (e.clientY - rect.top) * sy;
        this._handleClick(x, y, canvas.width, canvas.height);
      };
      canvas.addEventListener("click", this._clickHandler);
    }
  }

  onExit() {
    const canvas = document.querySelector("canvas");
    if (canvas && this._clickHandler) {
      canvas.removeEventListener("click", this._clickHandler);
      this._clickHandler = null;
    }
  }

  _rectAbsFromPct(pctRect, W, H) {
    return {
      x: pctRect.x * W,
      y: pctRect.y * H,
      w: pctRect.w * W,
      h: pctRect.h * H,
    };
  }

  _rectAbsInside(menuAbs, pctRect) {
    return {
      x: menuAbs.x + pctRect.x * menuAbs.w,
      y: menuAbs.y + pctRect.y * menuAbs.h,
      w: pctRect.w * menuAbs.w,
      h: pctRect.h * menuAbs.h,
    };
  }

  _inRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  _maxPage() {
    return Math.max(0, Math.ceil(this.items.length / this.PAGE_SIZE) - 1);
  }

  _handleClick(x, y, W, H) {
    // bağımlılık reset kontrolünü her tıklamada da güncelle
    for (const k of Object.keys(this.drugs)) updateAddiction(this.drugs[k]);
    saveJSON("tc_drugs", this.drugs);

    const bookAbs = this._rectAbsFromPct(this.BOOK_HIT, W, H);

    // Menü kapalıysa: kitap alanına tıklandıysa aç
    if (!this.menuOpen) {
      if (this._inRect(x, y, bookAbs)) {
        this.menuOpen = true;
      }
      return;
    }

    // Menü açıksa: menu rect içinde işle
    const menuAbs = this._rectAbsFromPct(this.MENU_RECT, W, H);

    // Menü dışına tıklarsan kapat
    if (!this._inRect(x, y, menuAbs)) {
      this.menuOpen = false;
      return;
    }

    // Close
    const closeAbs = this._rectAbsInside(menuAbs, this.CLOSE_HIT);
    if (this._inRect(x, y, closeAbs)) {
      this.menuOpen = false;
      return;
    }

    // Prev / Next
    const prevAbs = this._rectAbsInside(menuAbs, this.PREV_HIT);
    const nextAbs = this._rectAbsInside(menuAbs, this.NEXT_HIT);

    if (this._inRect(x, y, prevAbs)) {
      this.page = clamp(this.page - 1, 0, this._maxPage());
      return;
    }
    if (this._inRect(x, y, nextAbs)) {
      this.page = clamp(this.page + 1, 0, this._maxPage());
      return;
    }

    // Ürün kutuları
    const visible = this._getVisibleItems();
    const boxes = this._getBoxes(menuAbs);

    for (let i = 0; i < boxes.length; i++) {
      const r = boxes[i];
      if (!visible[i]) continue;
      if (this._inRect(x, y, r)) {
        this._buy(visible[i]);
        return;
      }
    }
  }

  _getVisibleItems() {
    const start = this.page * this.PAGE_SIZE;
    return this.items.slice(start, start + this.PAGE_SIZE);
  }

  _getBoxes(menuAbs) {
    // 8 kutu: sol 4 + sağ 4
    // Kutuların rectangle’ı: yazı merkezini baz alıyoruz, kutu boyutu sabit yüzde
    const boxW = menuAbs.w * 0.40;
    const boxH = menuAbs.h * 0.10;

    const cxL = menuAbs.x + this.BOX_LAYOUT.leftX * menuAbs.w;
    const cxR = menuAbs.x + this.BOX_LAYOUT.rightX * menuAbs.w;
    const startY = menuAbs.y + this.BOX_LAYOUT.startY * menuAbs.h;
    const gap = this.BOX_LAYOUT.gapY * menuAbs.h;

    const boxes = [];

    for (let r = 0; r < 4; r++) {
      const cy = startY + r * gap;
      boxes.push({ x: cxL - boxW / 2, y: cy - boxH / 2, w: boxW, h: boxH });
    }
    for (let r = 0; r < 4; r++) {
      const cy = startY + r * gap;
      boxes.push({ x: cxR - boxW / 2, y: cy - boxH / 2, w: boxW, h: boxH });
    }
    return boxes;
  }

  _buy(item) {
    // enerji kazancı: normal %5, bağımlıysa %2
    const meta = getDrugMeta(this.drugs, item.key);
    updateAddiction(meta);

    if (!meta.firstUseAt) meta.firstUseAt = now();

    const addicted = isAddicted(meta);
    const energyPct = addicted ? 2 : item.energyPct;

    if (this.player.yton < item.price) {
      // paran yok -> hiçbir şey yapma (istersen chat’e yazdırırız sonra)
      return;
    }

    // ödeme
    this.player.yton -= item.price;

    // enerji ekle (% üzerinden)
    const gain = Math.max(1, Math.floor((this.player.energyMax * energyPct) / 100));
    this.player.energy = clamp(this.player.energy + gain, 0, this.player.energyMax);

    // kullanım arttır
    meta.uses += 1;
    updateAddiction(meta);

    saveJSON("tc_player", this.player);
    saveJSON("tc_drugs", this.drugs);
  }

  update(dt) {
    // bağımlılık otomatik reset kontrolü
    let changed = false;
    for (const k of Object.keys(this.drugs)) {
      const before = JSON.stringify(this.drugs[k]);
      updateAddiction(this.drugs[k]);
      if (JSON.stringify(this.drugs[k]) !== before) changed = true;
    }
    if (changed) saveJSON("tc_drugs", this.drugs);
  }

  render(ctx, W, H) {
    // bg: coffeeshop.png
    const bg = this.assets.get?.("coffeeshop_bg") || this.assets.get?.("coffeeshop") || this.assets.images?.coffeeshop_bg || this.assets.images?.coffeeshop;
    if (bg) {
      // cover
      const scale = Math.max(W / bg.width, H / bg.height);
      const dw = bg.width * scale;
      const dh = bg.height * scale;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      ctx.drawImage(bg, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, W, H);
    }

    // Menü açık değilse sadece sahne (extra yazı yok!)
    if (!this.menuOpen) return;

    // Menü overlay
    const menuAbs = this._rectAbsFromPct(this.MENU_RECT, W, H);

    // hafif karartma
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, W, H);

    // menu image: coffeeshop_menu.png
    const menuImg =
      this.assets.get?.("coffeeshop_menu") ||
      this.assets.images?.coffeeshop_menu;

    if (menuImg) {
      ctx.drawImage(menuImg, menuAbs.x, menuAbs.y, menuAbs.w, menuAbs.h);
    } else {
      // fallback panel
      ctx.fillStyle = "rgba(20,20,25,0.92)";
      ctx.fillRect(menuAbs.x, menuAbs.y, menuAbs.w, menuAbs.h);
      ctx.strokeStyle = "rgba(255,215,0,0.6)";
      ctx.lineWidth = 3;
      ctx.strokeRect(menuAbs.x, menuAbs.y, menuAbs.w, menuAbs.h);
    }

    // Ürün yazılarını kutuların ORTASINA oturt
    const visible = this._getVisibleItems();
    const boxes = this._getBoxes(menuAbs);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < boxes.length; i++) {
      const item = visible[i];
      if (!item) continue;

      const r = boxes[i];
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;

      const meta = getDrugMeta(this.drugs, item.key);
      updateAddiction(meta);

      const addicted = isAddicted(meta);
      const energyPct = addicted ? 2 : item.energyPct;

      // glow
      ctx.shadowColor = "rgba(255,215,0,0.85)";
      ctx.shadowBlur = 10;

      // isim
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px serif";
      ctx.fillText(item.name, cx, cy - 10);

      // fiyat + enerji
      ctx.font = "16px serif";
      ctx.fillText(`${item.price} YTON | +%${energyPct}`, cx, cy + 12);

      // kullanım / bağımlılık küçük satır
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "12px system-ui";
      if (addicted) {
        const left = meta.addictedUntil - now();
        ctx.fillText(`Bağımlılık: ${formatLeft(left)}`, cx, cy + 30);
      } else {
        ctx.fillText(`Kullanım: ${meta.uses}/10`, cx, cy + 30);
      }
    }

    // sayfa göstergesi
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Sayfa ${this.page + 1}/${this._maxPage() + 1}`, menuAbs.x + menuAbs.w * 0.50, menuAbs.y + menuAbs.h * 0.95);

    // (opsiyonel) kapatma X metni yok; görselde varsa tıklanabilir alan hazır
  }
  }
