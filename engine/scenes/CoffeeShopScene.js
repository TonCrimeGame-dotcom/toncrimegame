// src/scenes/CoffeeShopScene.js

const DAY_MS = 24 * 60 * 60 * 1000;

// ======= Player Persist =======
function loadPlayer() {
  const raw = localStorage.getItem("toncrime_player");
  if (!raw) {
    return {
      name: "Player",
      coin: 500,     // test için
      energy: 50,    // test için
      level: 1,
      xp: 30,
      drugs: {}
    };
  }
  try {
    const p = JSON.parse(raw);
    if (!p.drugs) p.drugs = {};
    return p;
  } catch {
    return {
      name: "Player",
      coin: 500,
      energy: 50,
      level: 1,
      xp: 30,
      drugs: {}
    };
  }
}

function savePlayer(player) {
  localStorage.setItem("toncrime_player", JSON.stringify(player));
}

function nowMs() {
  return Date.now();
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function fmtTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

// ======= Addiction System (per item, 24h reset) =======
function ensureDrugState(player, key) {
  if (!player.drugs) player.drugs = {};
  if (!player.drugs[key]) {
    player.drugs[key] = { uses: 0, windowStart: 0, addictedUntil: 0 };
  }
  return player.drugs[key];
}

function normalizeDrugState(drug) {
  const t = nowMs();

  // addicted bitmişse kaldır
  if (drug.addictedUntil && t >= drug.addictedUntil) {
    drug.addictedUntil = 0;
  }

  // pencere yoksa başlat
  if (!drug.windowStart) drug.windowStart = t;

  // 24 saat geçtiyse sayaç sıfırla
  if (t - drug.windowStart >= DAY_MS) {
    drug.uses = 0;
    drug.windowStart = t;
    if (drug.addictedUntil && t >= drug.addictedUntil) drug.addictedUntil = 0;
  }
}

function isAddicted(drug) {
  normalizeDrugState(drug);
  return !!drug.addictedUntil && nowMs() < drug.addictedUntil;
}

// Enerji kazanımı % (bağımlıysa 2)
function getEnergyGainPercent(player, itemKey, baseEnergyPct) {
  const drug = ensureDrugState(player, itemKey);
  return isAddicted(drug) ? 2 : baseEnergyPct;
}

// Kullanım
function consumeItem(player, itemKey, priceYton, baseEnergyPct) {
  const drug = ensureDrugState(player, itemKey);
  normalizeDrugState(drug);

  if ((player.coin || 0) < priceYton) {
    return { ok: false, reason: "Yetersiz YTON" };
  }

  player.coin -= priceYton;

  drug.uses += 1;

  // 10 kullanım -> bağımlılık 24 saat
  if (!drug.addictedUntil && drug.uses >= 10) {
    drug.addictedUntil = nowMs() + DAY_MS;
  }

  const gainPct = isAddicted(drug) ? 2 : baseEnergyPct;

  // Enerji 0-100 arası varsayıyorum
  player.energy = clamp((player.energy || 0) + gainPct, 0, 100);

  return { ok: true, gainPct, uses: drug.uses, addicted: isAddicted(drug) };
}

// ======= Input Helpers =======
function getPointer(input) {
  // farklı engine input API’leri için tolerans
  const x = input?.x ?? input?.mouseX ?? input?.pointerX ?? 0;
  const y = input?.y ?? input?.mouseY ?? input?.pointerY ?? 0;
  const down =
    (typeof input?.justPressed === "function" && input.justPressed()) ||
    (typeof input?.pressed === "function" && input.pressed()) ||
    (input?.isDown === true);
  return { x, y, down };
}

function inRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// ======= Scene =======
export class CoffeeShopScene {
  constructor({ assets, input, i18n, store, scenes }) {
    this.assets = assets;
    this.input = input;
    this.i18n = i18n;
    this.store = store;   // varsa global store
    this.scenes = scenes;

    this.player = loadPlayer();

    this.menuOpen = false;
    this.lastClickMs = 0;

    // Menü pozisyonları/ölçekler (ekrana göre adaptif)
    this.menuBox = { x: 0, y: 0, w: 0, h: 0 };

    // BG içindeki kitabı tıklanır yapacağız:
    // Bu hitbox % ile hesaplanıyor (responsive)
    // ŞU AN “yeri doğru” dediğin için iyi bir varsayılan koyuyorum.
    // Gerekirse sadece bu 4 değeri oynatırız.
    this.bookHitboxRel = { x: 0.33, y: 0.46, w: 0.22, h: 0.26 }; // 0-1 arası

    // Ürün listesi (enerji % ve fiyat YTON)
    // Minimum fiyat: 10 YTON, minimum enerji: %5
    // Bağımlı olunca otomatik %2’ye düşer.
    this.items = [
      { key: "og_kush",  name: "OG Kush",      price: 70,  energyPct: 8 },
      { key: "island",   name: "Island Gold",  price: 140, energyPct: 12 },
      { key: "nhk",      name: "NHK Herb",     price: 200, energyPct: 18 },
      { key: "espresso", name: "Espresso Cut", price: 50,  energyPct: 5 }, // örnek
      { key: "basic10",  name: "Street Mix",   price: 10,  energyPct: 5 }, // min örnek
    ];

    // Menü resminde “butonlar” görüntünün üzerinde:
    // Burada her item için tıklanabilir satır alanları tanımlıyoruz.
    // Bu satırlar menuBox içine göre hesaplanacak.
    this.itemRects = [];
  }

  onEnter() {
    // Store varsa HUD ile aynı state'i kullanmak için çek
    // (Store yoksa local player kendi içinde çalışır)
    try {
      if (this.store?.get) {
        const p = this.store.get("player");
        if (p) this.player = { ...this.player, ...p, drugs: p.drugs || this.player.drugs };
      }
    } catch {}

    // açılırsa güncelle
    savePlayer(this.player);
  }

  buildRects(w, h) {
    // Menü popup boyutu (ekranın ortasında)
    const mw = Math.floor(w * 0.52);
    const mh = Math.floor(h * 0.72);
    const mx = Math.floor((w - mw) / 2);
    const my = Math.floor((h - mh) / 2);

    this.menuBox = { x: mx, y: my, w: mw, h: mh };

    // Menü içindeki 5 satır buton alanı (örnek)
    // İstersen bunu menü görselindeki gerçek satır yüksekliklerine göre ayarlarız.
    const padX = Math.floor(mw * 0.10);
    const startY = Math.floor(mh * 0.27);
    const rowH = Math.floor(mh * 0.12);
    const colW = Math.floor((mw - padX * 2) / 2);
    const leftX = mx + padX;
    const rightX = mx + padX + colW;

    this.itemRects = [
      { itemKey: this.items[0]?.key, x: leftX,  y: my + startY + rowH * 0, w: colW - 10, h: rowH - 10 },
      { itemKey: this.items[1]?.key, x: rightX, y: my + startY + rowH * 0, w: colW - 10, h: rowH - 10 },
      { itemKey: this.items[2]?.key, x: rightX, y: my + startY + rowH * 1, w: colW - 10, h: rowH - 10 },
      { itemKey: this.items[3]?.key, x: leftX,  y: my + startY + rowH * 1, w: colW - 10, h: rowH - 10 },
      { itemKey: this.items[4]?.key, x: leftX,  y: my + startY + rowH * 2, w: colW - 10, h: rowH - 10 },
    ].filter(r => !!r.itemKey);

    // Close (X) butonu (sağ üst)
    this.closeRect = {
      x: mx + mw - Math.floor(mw * 0.10),
      y: my + Math.floor(mh * 0.04),
      w: Math.floor(mw * 0.06),
      h: Math.floor(mw * 0.06),
    };

    // BG içindeki kitabın hitbox'ı
    this.bookRect = {
      x: Math.floor(w * this.bookHitboxRel.x),
      y: Math.floor(h * this.bookHitboxRel.y),
      w: Math.floor(w * this.bookHitboxRel.w),
      h: Math.floor(h * this.bookHitboxRel.h),
    };
  }

  syncPlayerToStore() {
    try {
      if (this.store?.set) this.store.set("player", this.player);
    } catch {}
    savePlayer(this.player);
  }

  update(dt, t, w, h) {
    this.buildRects(w, h);

    // zaman bazlı normalize (her frame)
    for (const it of this.items) {
      normalizeDrugState(ensureDrugState(this.player, it.key));
    }

    const p = getPointer(this.input);

    // debounce (tek tık = tek işlem)
    if (p.down && nowMs() - this.lastClickMs > 180) {
      this.lastClickMs = nowMs();

      if (!this.menuOpen) {
        // BG içindeki kitap tıklanırsa menü aç
        if (inRect(p.x, p.y, this.bookRect)) {
          this.menuOpen = true;
          return;
        }
      } else {
        // menü açıkken X’e basınca kapa
        if (inRect(p.x, p.y, this.closeRect)) {
          this.menuOpen = false;
          return;
        }

        // item butonlarına basınca satın al/enerji ver
        for (const r of this.itemRects) {
          if (inRect(p.x, p.y, r)) {
            const item = this.items.find(i => i.key === r.itemKey);
            if (!item) continue;

            const res = consumeItem(this.player, item.key, item.price, item.energyPct);
            // sonuçları HUD’a yansıt
            this.syncPlayerToStore();

            // İstersen chat’e yazdırmak için burada hook atılır:
            // if (this.store?.pushChat) this.store.pushChat(`${item.name} kullanıldı...`);

            // yetersiz bakiye mesajı (basit)
            this.lastActionMsg = res.ok
              ? `${item.name}: +%${res.gainPct} enerji`
              : res.reason;

            return;
          }
        }
      }
    }
  }

  render(ctx, w, h) {
    // BG
    const bg =
      this.assets.get?.("coffeeshop") ||
      this.assets.get?.("coffeeshop_indoor") ||
      this.assets.get?.("background");

    if (bg) {
      ctx.drawImage(bg, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }

    // Kitaba tıkla yazısı
    ctx.save();
    ctx.font = "16px system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    ctx.fillText("Kitaba tıkla → Menü aç", w / 2, h * 0.83);
    ctx.restore();

    // Debug istersen hitbox çiz:
    // ctx.strokeStyle = "rgba(0,255,0,0.4)"; ctx.strokeRect(this.bookRect.x,this.bookRect.y,this.bookRect.w,this.bookRect.h);

    if (this.menuOpen) {
      // karartma
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, w, h);

      // menü resmi
      const menuImg =
        this.assets.get?.("coffeeshop_menu") ||
        this.assets.get?.("coffeeshop_menu_open") ||
        this.assets.get?.("menu_open");

      const { x, y, w: mw, h: mh } = this.menuBox;

      // panel arka
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(x, y, mw, mh);

      if (menuImg) {
        ctx.drawImage(menuImg, x, y, mw, mh);
      } else {
        // fallback
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.strokeRect(x, y, mw, mh);
      }

      // Close X
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(this.closeRect.x, this.closeRect.y, this.closeRect.w, this.closeRect.h);
      ctx.fillStyle = "white";
      ctx.font = "18px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("X", this.closeRect.x + this.closeRect.w / 2, this.closeRect.y + this.closeRect.h / 2);
      ctx.restore();

      // ======= BAĞIMLILIK GÖSTERGELERİ (her ürün altında) =======
      ctx.save();
      ctx.font = "14px system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      for (const r of this.itemRects) {
        const item = this.items.find(i => i.key === r.itemKey);
        if (!item) continue;

        const drug = ensureDrugState(this.player, item.key);
        normalizeDrugState(drug);

        const addicted = isAddicted(drug);
        const usesTxt = `Bağımlılık: ${drug.uses}/10`;

        // reset zamanı
        let resetTxt = "";
        if (addicted) {
          resetTxt = `Reset: ${fmtTime(drug.addictedUntil - nowMs())}`;
        } else {
          // pencere resetine kalan süre (istersen göster)
          const remain = (drug.windowStart + DAY_MS) - nowMs();
          resetTxt = `Sayaç reset: ${fmtTime(remain)}`;
        }

        // enerji kazancı (bağımlıysa 2)
        const gainPct = getEnergyGainPercent(this.player, item.key, item.energyPct);
        const gainTxt = `Enerji: +%${gainPct}  |  Fiyat: ${item.price} YTON`;

        const tx = r.x + 8;
        const ty = r.y + r.h + 6;

        // ufak gölge için arka şerit
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(r.x, ty - 2, r.w, 46);

        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fillText(usesTxt, tx, ty);
        ctx.fillText(resetTxt, tx, ty + 16);
        ctx.fillText(gainTxt, tx, ty + 32);
      }

      // Son işlem mesajı
      if (this.lastActionMsg) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(x, y + mh - 42, mw, 42);
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = "16px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.lastActionMsg, x + mw / 2, y + mh - 21);
      }

      ctx.restore();
    }
  }
  }
