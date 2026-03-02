// src/scenes/CoffeeShopScene.js

const DAY_MS = 24 * 60 * 60 * 1000;

function loadPlayer() {
  const raw = localStorage.getItem("toncrime_player");
  if (!raw) {
    return {
      coin: 500,
      energy: 50,
      drugs: {}
    };
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
    player.drugs[key] = {
      uses: 0,
      windowStart: now(),
      addictedUntil: 0
    };
  }
  return player.drugs[key];
}

function normalize(drug) {
  const t = now();

  if (drug.addictedUntil && t >= drug.addictedUntil) {
    drug.addictedUntil = 0;
  }

  if (t - drug.windowStart >= DAY_MS) {
    drug.uses = 0;
    drug.windowStart = t;
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

export class CoffeeShopScene {
  constructor({ assets, input }) {
    this.assets = assets;
    this.input = input;

    this.player = loadPlayer();
    this.menuOpen = false;

    this.items = [
      { key: "og_kush", name: "OG Kush", price: 70, energy: 8 },
      { key: "island", name: "Island Gold", price: 140, energy: 12 },
      { key: "nhk", name: "NHK Herb", price: 200, energy: 18 },
      { key: "street", name: "Street Mix", price: 10, energy: 5 },
    ];
  }

  consume(item) {
    const drug = ensureDrug(this.player, item.key);
    normalize(drug);

    if (this.player.coin < item.price) return;

    this.player.coin -= item.price;
    drug.uses++;

    if (!drug.addictedUntil && drug.uses >= 10) {
      drug.addictedUntil = now() + DAY_MS;
    }

    const gain = isAddicted(drug) ? 2 : item.energy;
    this.player.energy = Math.min(100, this.player.energy + gain);

    savePlayer(this.player);
  }

  update() {
    if (!this.input?.justPressed?.()) return;

    const x = this.input.x;
    const y = this.input.y;

    // Kitap tıklama alanı (BG üzerindeki)
    const bookRect = {
      x: 500,
      y: 450,
      w: 300,
      h: 350
    };

    if (!this.menuOpen) {
      if (
        x >= bookRect.x &&
        x <= bookRect.x + bookRect.w &&
        y >= bookRect.y &&
        y <= bookRect.y + bookRect.h
      ) {
        this.menuOpen = true;
      }
      return;
    }

    // Menü açıkken item tıklama
    let startY = 350;
    for (let i = 0; i < this.items.length; i++) {
      const itemY = startY + i * 80;
      if (y >= itemY && y <= itemY + 60) {
        this.consume(this.items[i]);
      }
    }

    // Menü kapama alanı
    if (x > 1200 && y < 200) {
      this.menuOpen = false;
    }
  }

  render(ctx, w, h) {
    const bg = this.assets.get("coffeeshop_bg");
    if (bg) ctx.drawImage(bg, 0, 0, w, h);

    if (!this.menuOpen) {
      ctx.fillStyle = "white";
      ctx.font = "20px system-ui";
      ctx.fillText("Kitaba tıkla → Menü aç", w / 2 - 100, h - 120);
      return;
    }

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, w, h);

    const menu = this.assets.get("coffeeshop_menu");
    if (menu) ctx.drawImage(menu, 350, 200, 800, 900);

    ctx.fillStyle = "white";
    ctx.font = "16px system-ui";

    let startY = 350;
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const drug = ensureDrug(this.player, item.key);
      normalize(drug);

      const addicted = isAddicted(drug);
      const gain = addicted ? 2 : item.energy;

      ctx.fillText(
        `${item.name} | Fiyat: ${item.price} YTON | Enerji: +%${gain}`,
        420,
        startY + i * 80
      );

      ctx.fillText(
        `Bağımlılık: ${drug.uses}/10`,
        420,
        startY + i * 80 + 20
      );

      if (addicted) {
        ctx.fillText(
          `Reset: ${formatTime(drug.addictedUntil - now())}`,
          420,
          startY + i * 80 + 40
        );
      }
    }
  }
        }
