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
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
}

export class HomeScene {
  constructor({ store, input, i18n, assets, scenes }) {
    this.assets = assets;
    this.store = store;
    this.input = input;
    this.i18n = i18n;
    this.scenes = scenes;

    this._tabs = [];
  }

  onEnter() {
    // Dil değiştir (L)
    this._onKey = (e) => {
      if (e.key.toLowerCase() === "l") {
        const s = this.store.get();
        this.store.set({ lang: s.lang === "tr" ? "en" : "tr" });
      }
    };
    window.addEventListener("keydown", this._onKey);

    // Player defaultları
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

          // ENERGY
          energy: 10,
          energyMax: 10,
          energyIntervalMs: 5 * 60 * 1000, // 5 dakika
          lastEnergyAt: Date.now(), // son dolum referansı
        },
      });
    } else {
      // eksik enerji alanları varsa ekle
      const p = s.player;
      const patch = {};
      if (p.energy == null) patch.energy = 10;
      if (p.energyMax == null) patch.energyMax = 10;
      if (p.energyIntervalMs == null) patch.energyIntervalMs = 5 * 60 * 1000;
      if (p.lastEnergyAt == null) patch.lastEnergyAt = Date.now();
      if (Object.keys(patch).length) {
        this.store.set({ player: { ...p, ...patch } });
      }
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
    const interval = Math.max(10_000, Number(p.energyIntervalMs || 300000)); // min 10sn güvenlik
    const maxE = Math.max(1, Number(p.energyMax || 10));
    let e = Math.max(0, Math.min(maxE, Number(p.energy || 0)));

    if (e >= maxE) {
      // full ise referansı şimdiye çek (geri sayım düzgün dursun)
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
    // lastEnergyAt'i kalan süreyi koruyacak şekilde ileri taşı
    const newLast = Number(p.lastEnergyAt || now) + gained * interval;

    this.store.set({
      player: {
        ...p,
        energy: newE,
        lastEnergyAt: newLast,
      },
    });
  }

  update() {
    // enerji regen tick
    this._tickEnergy();

    if (this.input.justPressed()) {
      const { x, y } = this.input.pointer;

      // alt menü tıklama
      for (const t of this._tabs) {
        if (pointInRect(x, y, t.rect)) {
          this.scenes.go(t.sceneKey);
          return;
        }
      }

      // coin artır (test)
      const s = this.store.get();
      this.store.set({ coins: (s.coins ?? 0) + 1 });
    }
  }

  render(ctx, w, h) {
    const state = this.store.get();
    const safe = state?.ui?.safe ?? { x: 0, y: 0, w, h };
    const pad = 14;

    // ----- BG -----
    const bg = this.assets.getImage("background");
    if (bg) ctx.drawImage(bg, 0, 0, w, h);
    else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, w, h);

    // ----- TOP LAYOUT: logo + left/right panels within logo height -----
    const topX = safe.x + pad;
    const topY = safe.y + pad;
    const topW = safe.w - pad * 2;

    const logoImg = this.assets.getImage("logo");

    let logoW = Math.min(240, topW * 0.32);
    let logoH = 60;

    if (logoImg) {
      const ratio = logoImg.height / logoImg.width;
      logoH = logoW * ratio;
      logoH = Math.min(90, logoH);
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

    // ----- Left Panel -----
    const player = state.player || {};
    const username = player.username ?? "Player";
    const weaponName = player.weaponName ?? "Silah Yok";
    const weaponBonus = player.weaponBonus ?? "+0%";

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
    ctx.fillText(username, leftRect.x + linePadX, lineY1);

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
    ctx.fillText(`${weaponName}`, leftRect.x + linePadX, lineY3);
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.fillText(`${weaponBonus}`, leftRect.x + linePadX, lineY3 + 14);

    // ----- Logo -----
    if (logoImg) {
      ctx.drawImage(logoImg, logoRect.x, logoRect.y, logoRect.w, logoRect.h);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "24px system-ui";
      ctx.fillText(this.i18n.t("home_title"), safe.x + safe.w / 2, logoRect.y + 32);
    }

    // ----- Right Panel (XP + ENERGY) -----
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    fillRoundRect(ctx, rightRect.x, rightRect.y, rightRect.w, rightRect.h, 12);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    strokeRoundRect(ctx, rightRect.x + 0.5, rightRect.y + 0.5, rightRect.w - 1, rightRect.h - 1, 12);

    const barPad = 12;
    const barW = rightRect.w - barPad * 2;

    // 2 bar üst üste: panel yüksekliğine sığdır
    const totalBarsH = 28 + 10 + 28; // xp + gap + energy
    const startY = rightRect.y + Math.floor((rightRect.h - totalBarsH) / 2);

    // XP BAR
    const xp = Math.max(0, Number(player.xp || 0));
    const xpToNext = Math.max(1, Number(player.xpToNext || 100));
    const xpPct = clamp01(xp / xpToNext);

    const xpX = rightRect.x + barPad;
    const xpY = startY;
    const barH = 28;

    ctx.fillStyle = "rgba(255,255,255,0.10)";
    fillRoundRect(ctx, xpX, xpY, barW, barH, 10);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    fillRoundRect(ctx, xpX, xpY, Math.max(8, barW * xpPct), barH, 10);

    const lvl = player.level ?? 1;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "12px system-ui";
    ctx.fillText(`LVL ${lvl} • XP ${xp}/${xpToNext}`, xpX + barW / 2, xpY + barH / 2 + 4);

    // ENERGY BAR
    const e = Math.max(0, Number(player.energy || 0));
    const eMax = Math.max(1, Number(player.energyMax || 10));
    const ePct = clamp01(e / eMax);

    const interval = Math.max(10_000, Number(player.energyIntervalMs || 300000));
    const lastAt = Number(player.lastEnergyAt || Date.now());
    const now = Date.now();
    const untilNext = e >= eMax ? 0 : Math.max(0, interval - (now - lastAt));

    const enX = xpX;
    const enY = xpY + barH + 10;

    ctx.fillStyle = "rgba(255,255,255,0.10)";
    fillRoundRect(ctx, enX, enY, barW, barH, 10);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    fillRoundRect(ctx, enX, enY, Math.max(8, barW * ePct), barH, 10);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "12px system-ui";

    const timeText = e >= eMax ? "FULL" : fmtMMSS(untilNext);
    ctx.fillText(`ENERJİ ${e}/${eMax} • ${timeText}`, enX + barW / 2, enY + barH / 2 + 4);

    // ----- CTA -----
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.textAlign = "center";
    ctx.font = "16px system-ui";
    ctx.fillText(this.i18n.t("tap_to_earn"), safe.x + safe.w / 2, safe.y + safe.h * 0.55);

    // ----- Bottom tabs -----
    const barSafeH = 58;
    const bottomY = safe.y + safe.h - barSafeH;

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(safe.x, bottomY, safe.w, barSafeH);

    const tabs = [
      { key: "tab_missions", sceneKey: "missions" },
      { key: "tab_dealer", sceneKey: "dealer" },
      { key: "tab_pvp", sceneKey: "pvp" },
      { key: "tab_clan", sceneKey: "clan" },
    ];

    const tabGap = 10;
    const tabPad = 12;
    const tabW = Math.floor((safe.w - tabPad * 2 - tabGap * (tabs.length - 1)) / tabs.length);
    const tabH = 38;
    const ty = bottomY + Math.floor((barSafeH - tabH) / 2);

    this._tabs = [];
    ctx.font = "13px system-ui";
    ctx.textAlign = "center";

    tabs.forEach((t, i) => {
      const tx = safe.x + tabPad + i * (tabW + tabGap);
      const rect = { x: tx, y: ty, w: tabW, h: tabH };

      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(this.i18n.t(t.key), rect.x + rect.w / 2, rect.y + rect.h / 2 + 5);

      this._tabs.push({ rect, sceneKey: t.sceneKey });
    });

    // Dil ipucu
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.textAlign = "left";
    ctx.font = "12px system-ui";
    ctx.fillText(`Lang: ${state.lang ?? "tr"} (L)`, safe.x + 12, bottomY - 10);
  }
      }
