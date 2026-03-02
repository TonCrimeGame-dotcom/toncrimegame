function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

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
function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}
function fmtMMSS(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export class HomeScene {
  constructor({ store, input, i18n, assets, scenes }) {
    this.assets = assets;
    this.store = store;
    this.input = input;
    this.i18n = i18n;
    this.scenes = scenes;

    this.carousel = {
      index: 0,
      dragging: false,
      dragStartX: 0,
      dragNowX: 0,
      lastX: 0,
      moved: 0,
      clickCandidate: false,
    };

    this._cardRect = { x: 0, y: 0, w: 0, h: 0 };
  }

  onEnter() {
    this._onKey = (e) => {
      if (e.key.toLowerCase() === "l") {
        const s = this.store.get();
        this.store.set({ lang: s.lang === "tr" ? "en" : "tr" });
      }
    };
    window.addEventListener("keydown", this._onKey);

    const s = this.store.get();
    if (!s.player) {
      this.store.set({
        player: {
          username: "Player",
          level: 1,
          xp: 30,
          xpToNext: 100,
          weaponName: "Silah Yok",
          weaponBonus: "+0%",

          energy: 10,
          energyMax: 10,
          energyIntervalMs: 5 * 60 * 1000,
          lastEnergyAt: Date.now(),
        },
      });
    } else {
      const p = s.player;
      const patch = {};
      if (p.energy == null) patch.energy = 10;
      if (p.energyMax == null) patch.energyMax = 10;
      if (p.energyIntervalMs == null) patch.energyIntervalMs = 5 * 60 * 1000;
      if (p.lastEnergyAt == null) patch.lastEnergyAt = Date.now();
      if (Object.keys(patch).length) this.store.set({ player: { ...p, ...patch } });
    }
  }

  onExit() {
    window.removeEventListener("keydown", this._onKey);
  }

  _tickEnergy() {
    const s = this.store.get();
    const p = s.player;
    if (!p) return;

    const now = Date.now();
    const interval = Math.max(10_000, Number(p.energyIntervalMs || 300000));
    const maxE = Math.max(1, Number(p.energyMax || 10));
    let e = Math.max(0, Math.min(maxE, Number(p.energy || 0)));

    if (e >= maxE) {
      if (p.lastEnergyAt !== now) {
        this.store.set({ player: { ...p, energy: maxE, lastEnergyAt: now } });
      }
      return;
    }

    const elapsed = now - Number(p.lastEnergyAt || now);
    if (elapsed < interval) return;

    const gained = Math.floor(elapsed / interval);
    if (gained <= 0) return;

    const newE = Math.min(maxE, e + gained);
    const newLast = Number(p.lastEnergyAt || now) + gained * interval;
    this.store.set({ player: { ...p, energy: newE, lastEnergyAt: newLast } });
  }

  _spendEnergy(amount) {
    const s = this.store.get();
    const p = s.player;
    if (!p) return false;
    const e = Number(p.energy || 0);
    if (e < amount) return false;
    this.store.set({ player: { ...p, energy: e - amount } });
    return true;
  }

  _carouselItems() {
    return [
      { id: "missions", titleTR: "Görevler", titleEN: "Missions", sceneKey: "missions" },
      { id: "pvp", titleTR: "PvP", titleEN: "PvP", sceneKey: "pvp" },
      { id: "weapons", titleTR: "Silah Kaçakçısı", titleEN: "Arms Dealer", sceneKey: "dealer" },
      { id: "nightclub", titleTR: "Gece Kulübü", titleEN: "Nightclub", sceneKey: "nightclub" },
      { id: "coffeeshop", titleTR: "Coffeeshop", titleEN: "Coffeeshop", sceneKey: "coffeeshop" },
      { id: "xxx", titleTR: "Genel Ev", titleEN: "Brothel", sceneKey: "xxx" },
    ];
  }

  update() {
    this._tickEnergy();

    const c = this.carousel;
    const px = this.input.pointer.x;
    const py = this.input.pointer.y;

    if (this.input.justPressed()) {
      c.dragging = true;
      c.dragStartX = px;
      c.dragNowX = px;
      c.lastX = px;
      c.moved = 0;
      c.clickCandidate = true;
    }

    if (c.dragging && this.input.isDown()) {
      c.dragNowX = px;
      const dx = c.dragNowX - c.lastX;
      c.lastX = c.dragNowX;
      c.moved += Math.abs(dx);
      if (c.moved > 10) c.clickCandidate = false;
    }

    if (c.dragging && this.input.justReleased()) {
      c.dragging = false;

      const items = this._carouselItems();
      const dragDX = c.dragNowX - c.dragStartX;

      const threshold = 45;
      if (dragDX > threshold) c.index = Math.max(0, c.index - 1);
      else if (dragDX < -threshold) c.index = Math.min(items.length - 1, c.index + 1);

      // Kart tıklaması: 1 enerji harca + sahneye git (şimdilik yoksa coin artır)
      if (c.clickCandidate && pointInRect(px, py, this._cardRect)) {
        if (this._spendEnergy(1)) {
          const item = items[c.index];
          try {
            this.scenes.go(item.sceneKey);
          } catch (_) {
            const s = this.store.get();
            this.store.set({ coins: (s.coins ?? 0) + 1 });
          }
        }
      }
    }
  }

  render(ctx, w, h) {
    const state = this.store.get();
    const safe = state?.ui?.safe ?? { x: 0, y: 0, w, h };
    const pad = 14;

    // BG
    const bg = this.assets.getImage("background");
    if (bg) ctx.drawImage(bg, 0, 0, w, h);
    else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, w, h);

    // TOP layout: logo + left/right panels
    const topX = safe.x + pad;
    const topY = safe.y + pad;
    const topW = safe.w - pad * 2;

    const logoImg = this.assets.getImage("logo");
    let logoW = Math.min(240, topW * 0.32);
    let logoH = 60;
    if (logoImg) {
      const ratio = logoImg.height / logoImg.width;
      logoH = Math.min(90, logoW * ratio);
      logoW = logoH / ratio;
    }
    const logoX = safe.x + (safe.w - logoW) / 2;
    const logoY = topY + 6;
    const logoRect = { x: logoX, y: logoY, w: logoW, h: logoH };

    const panelH = logoRect.h;
    const gap = 10;
    const leftMaxW = Math.max(160, (logoRect.x - topX) - gap);
    const rightMaxW = Math.max(160, (safe.x + safe.w - (logoRect.x + logoRect.w)) - gap);
    const leftW = Math.min(260, leftMaxW);
    const rightW = Math.min(280, rightMaxW);

    const leftRect = { x: topX, y: logoRect.y, w: leftW, h: panelH };
    const rightRect = { x: safe.x + safe.w - pad - rightW, y: logoRect.y, w: rightW, h: panelH };

    // LEFT panel
    const player = state.player || {};
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    fillRoundRect(ctx, leftRect.x, leftRect.y, leftRect.w, leftRect.h, 12);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    strokeRoundRect(ctx, leftRect.x + 0.5, leftRect.y + 0.5, leftRect.w - 1, leftRect.h - 1, 12);

    const linePadX = 12;
    const lineY1 = leftRect.y + 18;
    const lineY2 = leftRect.y + leftRect.h / 2;
    const lineY3 = leftRect.y + leftRect.h - 16;

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.font = "14px system-ui";
    ctx.fillText(player.username ?? "Player", leftRect.x + linePadX, lineY1);

    const coinValue = state.coins ?? 0;
    const yton = this.assets.getImage("yton");
    const iconSize = 16;

    let coinTextX = leftRect.x + linePadX;
    if (yton) {
      ctx.drawImage(yton, leftRect.x + linePadX, lineY2 - iconSize + 2, iconSize, iconSize);
      coinTextX = leftRect.x + linePadX + iconSize + 8;
    }
    ctx.font = "13px system-ui";
    ctx.fillText(`Coin: ${coinValue}`, coinTextX, lineY2);

    ctx.font = "12px system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(player.weaponName ?? "Silah Yok", leftRect.x + linePadX, lineY3);
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.fillText(player.weaponBonus ?? "+0%", leftRect.x + linePadX, lineY3 + 14);

    // LOGO
    if (logoImg) ctx.drawImage(logoImg, logoRect.x, logoRect.y, logoRect.w, logoRect.h);

    // RIGHT panel (XP + ENERGY)
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    fillRoundRect(ctx, rightRect.x, rightRect.y, rightRect.w, rightRect.h, 12);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    strokeRoundRect(ctx, rightRect.x + 0.5, rightRect.y + 0.5, rightRect.w - 1, rightRect.h - 1, 12);

    const barPad = 12;
    const barW = rightRect.w - barPad * 2;
    const totalBarsH = 28 + 10 + 28;
    const startY = rightRect.y + Math.floor((rightRect.h - totalBarsH) / 2);
    const barH = 28;

    const xp = Math.max(0, Number(player.xp || 0));
    const xpToNext = Math.max(1, Number(player.xpToNext || 100));
    const xpPct = clamp01(xp / xpToNext);

    const xpX = rightRect.x + barPad;
    const xpY = startY;
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    fillRoundRect(ctx, xpX, xpY, barW, barH, 10);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    fillRoundRect(ctx, xpX, xpY, Math.max(8, barW * xpPct), barH, 10);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "12px system-ui";
    ctx.fillText(`LVL ${player.level ?? 1} • XP ${xp}/${xpToNext}`, xpX + barW / 2, xpY + barH / 2 + 4);

    const e = Math.max(0, Number(player.energy || 0));
    const eMax = Math.max(1, Number(player.energyMax || 10));
    const ePct = clamp01(e / eMax);
    const interval = Math.max(10_000, Number(player.energyIntervalMs || 300000));
    const lastAt = Number(player.lastEnergyAt || Date.now());
    const now = Date.now();
    const untilNext = e >= eMax ? 0 : Math.max(0, interval - (now - lastAt));
    const timeText = e >= eMax ? "FULL" : fmtMMSS(untilNext);

    const enX = xpX;
    const enY = xpY + barH + 10;
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    fillRoundRect(ctx, enX, enY, barW, barH, 10);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    fillRoundRect(ctx, enX, enY, Math.max(8, barW * ePct), barH, 10);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "12px system-ui";
    ctx.fillText(`ENERJİ ${e}/${eMax} • ${timeText}`, enX + barW / 2, enY + barH / 2 + 4);

    // ----- CENTER CAROUSEL (CONTAIN: resim tam görünsün) -----
    const items = this._carouselItems();
    const idx = this.carousel.index;

    const carouselTop = logoRect.y + logoRect.h + 18;
    const carouselBottom = safe.y + safe.h - 18; // alt bar kalktı
    const areaH = Math.max(140, carouselBottom - carouselTop);

    const cardW = Math.min(safe.w * 0.80, 380);
    const cardH = Math.min(areaH * 0.78, 280);

    const cx = safe.x + safe.w / 2;
    const cy = carouselTop + areaH / 2;

    const spacing = cardW + 28;
    const dragDX = this.carousel.dragging ? (this.carousel.dragNowX - this.carousel.dragStartX) : 0;

    const drawCard = (itemIndex) => {
      if (itemIndex < 0 || itemIndex >= items.length) return;

      const item = items[itemIndex];
      const offset = (itemIndex - idx) * spacing + dragDX;

      const dist = Math.abs(itemIndex - idx);
      const scale = dist === 0 ? 1 : 0.92;

      const w2 = cardW * scale;
      const h2 = cardH * scale;
      const x2 = cx - w2 / 2 + offset;
      const y2 = cy - h2 / 2;

      // panel
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      fillRoundRect(ctx, x2, y2, w2, h2, 18);

      // clip
      ctx.save();
      roundRectPath(ctx, x2, y2, w2, h2, 18);
      ctx.clip();

      // image (CONTAIN)
      const img = this.assets.getImage(item.id);
      if (img) {
        const s = Math.min(w2 / img.width, h2 / img.height);
        const dw = img.width * s;
        const dh = img.height * s;
        const dx = x2 + (w2 - dw) / 2;
        const dy = y2 + (h2 - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);

        // overlay text readability
        ctx.fillStyle = "rgba(0,0,0,0.20)";
        ctx.fillRect(x2, y2, w2, h2);
      }

      ctx.restore();

      // border
      ctx.strokeStyle = dist === 0 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)";
      strokeRoundRect(ctx, x2 + 0.5, y2 + 0.5, w2 - 1, h2 - 1, 18);

      // title
      const title = (state.lang ?? "tr") === "tr" ? item.titleTR : item.titleEN;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = dist === 0 ? "18px system-ui" : "16px system-ui";
      ctx.fillText(title, x2 + w2 / 2, y2 + h2 - 22);

      if (itemIndex === idx) this._cardRect = { x: x2, y: y2, w: w2, h: h2 };
    };

    drawCard(idx - 1);
    drawCard(idx);
    drawCard(idx + 1);

    // dots
    const dotsY = Math.min(safe.y + safe.h - 22, cy + cardH / 2 + 18);
    const dotGap = 10;
    const total = (items.length - 1) * dotGap;
    const startX = cx - total / 2;

    for (let i = 0; i < items.length; i++) {
      ctx.beginPath();
      const dx = startX + i * dotGap;
      ctx.arc(dx, dotsY, 3, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = i === idx ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)";
      ctx.fill();
    }
  }
       }
