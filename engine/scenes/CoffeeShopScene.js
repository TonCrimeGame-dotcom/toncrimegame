// src/scenes/CoffeeShopScene.js

const DAY_MS = 24 * 60 * 60 * 1000;
// DEBUG = true yaparsan tıklanabilir alanları hafif çizer
const DEBUG = false;

function loadPlayer() {
  const raw = localStorage.getItem("toncrime_player");
  if (!raw) {
    return { coin: 500, energy: 50, drugs: {} };
  }
  const p = JSON.parse(raw);
  if (!p.drugs) p.drugs = {};
  return p;
}

function savePlayer(p) {
  localStorage.setItem("toncrime_player", JSON.stringify(p));
}

function now() {
  return Date.now();
}

function ensureDrug(player, key) {
  if (!player.drugs[key]) {
    player.drugs[key] = { uses: 0, windowStart: now(), addictedUntil: 0 };
  }
  return player.drugs[key];
}

function normalize(drug) {
  const t = now();

  // 24 saat dolduysa reset
  if (t - drug.windowStart >= DAY_MS) {
    drug.uses = 0;
    drug.windowStart = t;
    drug.addictedUntil = 0;
  }

  // addicted süresi dolduysa kaldır
  if (drug.addictedUntil && t >= drug.addictedUntil) {
    drug.addictedUntil = 0;
  }
}

function isAddicted(drug) {
  normalize(drug);
  return drug.addictedUntil && now() < drug.addictedUntil;
}

function formatTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function inRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export class CoffeeShopScene {
  constructor({ assets }) {
    this.assets = assets;

    this.player = loadPlayer();
    this.menuOpen = false;

    // tıklama kuyruğu (canvas click ile dolduracağız)
    this._click = null;
    this._bound = false;
    this._onCanvasClick = null;

    // render içinde her frame güncellediğimiz rect'ler
    this.bookRect = null;
    this.menuRect = null;
    this.closeRect = null;

    // Menü ürünleri (oyun içi, gerçek fiyat vb. yok)
    this.items = [
      { key: "og_kush", name: "OG Kush", price: 70, energy: 8 },
      { key: "island_gold", name: "Island Gold", price: 140, energy: 12 },
      { key: "nhk_herb", name: "NHK Herb", price: 200, energy: 18 },
      { key: "street_mix", name: "Street Mix", price: 10, energy: 5 },
    ];
  }

  // Scene içine girince canvas'a click listener bağla
  _bindCanvasClick(ctx) {
    if (this._bound) return;
    const canvas = ctx?.canvas;
    if (!canvas) return;

    this._onCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      this._click = { x, y };
    };

    canvas.addEventListener("click", this._onCanvasClick);
    this._bound = true;
  }

  // İstersen ileride scene çıkışında temizlemek için kullanırsın
  _unbindCanvasClick(ctx) {
    if (!this._bound) return;
    const canvas = ctx?.canvas;
    if (!canvas) return;
    canvas.removeEventListener("click", this._onCanvasClick);
    this._bound = false;
    this._onCanvasClick = null;
  }

  consume(item) {
    const drug = ensureDrug(this.player, item.key);
    normalize(drug);

    if (this.player.coin < item.price) return;

    this.player.coin -= item.price;
    drug.uses += 1;

    // 10 kullanım sonrası 24 saat bağımlılık
    if (!drug.addictedUntil && drug.uses >= 10) {
      drug.addictedUntil = now() + DAY_MS;
    }

    // enerji kazancı bağımlıyken %2 sabit
    const gain = isAddicted(drug) ? 2 : item.energy;
    this.player.energy = Math.min(100, this.player.energy + gain);

    savePlayer(this.player);
  }

  update() {
    // click yoksa çık
    if (!this._click) return;
    const { x, y } = this._click;
    this._click = null;

    // Rect'ler render sırasında hesaplanır; ilk frame'de null olabilir
    if (!this.bookRect || !this.menuRect || !this.closeRect) return;

    if (!this.menuOpen) {
      // kitap tıklanınca menü aç
      if (inRect(x, y, this.bookRect)) {
        this.menuOpen = true;
      }
      return;
    }

    // Menü açıkken:
    // Kapatma (X) alanı
    if (inRect(x, y, this.closeRect)) {
      this.menuOpen = false;
      return;
    }

    // Menüde satır tıklama
    // Menü içindeki tıklama bölgelerini menuRect'e göre oransal hesaplıyoruz:
    // 4 satır: başlangıç %18, aralık %11, yükseklik %7 (menü görseline uygun)
    const mx = this.menuRect.x;
    const my = this.menuRect.y;
    const mw = this.menuRect.w;
    const mh = this.menuRect.h;

    const rowX = mx + mw * 0.10;
    const rowW = mw * 0.80;
    const rowH = mh * 0.07;
    const startY = my + mh * 0.28;
    const gap = mh * 0.11;

    for (let i = 0; i < this.items.length; i++) {
      const ry = startY + i * gap;
      const r = { x: rowX, y: ry, w: rowW, h: rowH };
      if (inRect(x, y, r)) {
        this.consume(this.items[i]);
        return;
      }
    }
  }

  render(ctx, w, h) {
    // click listener'ı burada bağlayalım (ctx lazım)
    this._bindCanvasClick(ctx);

    // BG
    const bg = this.assets.get("coffeeshop_bg");
    if (bg) ctx.drawImage(bg, 0, 0, w, h);
    else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }

    // ✅ BG üzerindeki kitap tıklama alanı (oransal — çözünürlükten bağımsız)
    // Bu oranlar senin son ekran görüntündeki kitaba göre ayarlı.
    this.bookRect = {
      x: w * 0.20,
      y: h * 0.30,
      w: w * 0.45,
      h: h * 0.58,
    };

    // Menü rect (ortalanmış)
    const menuW = Math.min(w * 0.62, 900);
    const menuH = Math.min(h * 0.78, 980);
    const menuX = (w - menuW) / 2;
    const menuY = (h - menuH) / 2;

    this.menuRect = { x: menuX, y: menuY, w: menuW, h: menuH };
    this.closeRect = {
      x: menuX + menuW * 0.90,
      y: menuY + menuH * 0.04,
      w: menuW * 0.07,
      h: menuW * 0.07,
    };

    if (!this.menuOpen) {
      // ❌ Artık alttaki “Kitaba tıkla → Menü aç” yazısı yok
      if (DEBUG) {
        ctx.save();
        ctx.fillStyle = "rgba(0,255,0,0.15)";
        ctx.fillRect(this.bookRect.x, this.bookRect.y, this.bookRect.w, this.bookRect.h);
        ctx.restore();
      }
      return;
    }

    // Menü overlay
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, w, h);

    const menuImg = this.assets.get("coffeeshop_menu");
    if (menuImg) {
      ctx.drawImage(menuImg, menuX, menuY, menuW, menuH);
    } else {
      // Menü görseli yoksa fallback panel
      ctx.fillStyle = "rgba(20,20,20,0.9)";
      ctx.fillRect(menuX, menuY, menuW, menuH);
    }

    // Ürün overlay yazıları
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px system-ui";
    ctx.textAlign = "left";

    const rowX = menuX + menuW * 0.10;
    const startY = menuY + menuH * 0.28;
    const gap = menuH * 0.11;

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const drug = ensureDrug(this.player, item.key);
      normalize(drug);

      const addicted = isAddicted(drug);
      const gain = addicted ? 2 : item.energy;

      const y1 = startY + i * gap + 8;
      ctx.fillText(`${item.name} | ${item.price} YTON | +%${gain} Enerji`, rowX, y1);

      ctx.font = "13px system-ui";
      ctx.fillText(`Kullanım: ${drug.uses}/10`, rowX, y1 + 20);

      if (addicted) {
        ctx.fillText(`Bağımlılık reset: ${formatTime(drug.addictedUntil - now())}`, rowX, y1 + 38);
      }
      ctx.font = "16px system-ui";

      if (DEBUG) {
        const r = { x: rowX, y: startY + i * gap, w: menuW * 0.80, h: menuH * 0.07 };
        ctx.save();
        ctx.fillStyle = "rgba(0,255,0,0.12)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.restore();
      }
    }

    // Close (X) alanı debug
    if (DEBUG) {
      ctx.save();
      ctx.fillStyle = "rgba(255,0,0,0.18)";
      ctx.fillRect(this.closeRect.x, this.closeRect.y, this.closeRect.w, this.closeRect.h);
      ctx.restore();
    }
  }
  }
