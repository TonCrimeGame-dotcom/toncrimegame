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

    // Default stateler yoksa ekle (main.js değiştirmeden de çalışsın)
    const s = this.store.get();
    if (!s.player) {
      this.store.set({
        player: {
          username: "Player",
          level: 1,
          xp: 0,
          xpToNext: 100,
          weaponName: "Silah Yok",
          weaponBonus: "+0%",
        },
      });
    }
  }

  onExit() {
    window.removeEventListener("keydown", this._onKey);
  }

  update() {
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

    // gece hissi
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, w, h);

    // ----- TOP LAYOUT: logo + left/right panels within logo height -----
    const topX = safe.x + pad;
    const topY = safe.y + pad;
    const topW = safe.w - pad * 2;

    const logoImg = this.assets.getImage("logo");

    // Logo boyutlandırma (safe-area içinde, üstte)
    let logoW = Math.min(240, topW * 0.32);
    let logoH = 60;

    if (logoImg) {
      const ratio = logoImg.height / logoImg.width;
      logoH = logoW * ratio;
      // aşırı büyümesin
      logoH = Math.min(90, logoH);
      logoW = logoH / ratio;
    }

    const logoX = safe.x + (safe.w - logoW) / 2;
    const logoY = topY + 6;

    // Logo rect = referans alan
    const logoRect = { x: logoX, y: logoY, w: logoW, h: logoH };

    // Panel'ler logo yüksekliğini geçmesin
    const panelH = logoRect.h;

    // Panel genişliği: kalan alanın yarısı, ama min/max sınırla
    const gap = 10;
    const leftMaxW = Math.max(160, (logoRect.x - topX) - gap);
    const rightMaxW = Math.max(160, (safe.x + safe.w - (logoRect.x + logoRect.w)) - gap);

    const leftW = Math.min(260, leftMaxW);
    const rightW = Math.min(260, rightMaxW);

    const leftRect = {
      x: topX,
      y: logoRect.y,
      w: leftW,
      h: panelH,
    };

    const rightRect = {
      x: safe.x + safe.w - pad - rightW,
      y: logoRect.y,
      w: rightW,
      h: panelH,
    };

    // ----- Draw Left Panel (username, coin+icon, weapon) -----
    const player = state.player || {
      username: "Player",
      level: 1,
      xp: 0,
      xpToNext: 100,
      weaponName: "Silah Yok",
      weaponBonus: "+0%",
    };

    // panel bg
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    fillRoundRect(ctx, leftRect.x, leftRect.y, leftRect.w, leftRect.h, 12);

    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    strokeRoundRect(ctx, leftRect.x + 0.5, leftRect.y + 0.5, leftRect.w - 1, leftRect.h - 1, 12);

    const linePadX = 12;
    const lineY1 = leftRect.y + 18;
    const lineY2 = leftRect.y + leftRect.h / 2;
    const lineY3 = leftRect.y + leftRect.h - 16;

    // username
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.font = "14px system-ui";
    ctx.fillText(player.username, leftRect.x + linePadX, lineY1);

    // coin + icon
    const coinValue = state.coins ?? 0;
    const yton = this.assets.getImage("yton");
    const iconSize = 16;

    let coinTextX = leftRect.x + linePadX;
    if (yton) {
      ctx.drawImage(yton, leftRect.x + linePadX, lineY2 - iconSize + 2, iconSize, iconSize);
      coinTextX = leftRect.x + linePadX + iconSize + 8;
    }
    ctx.font = "13px system-ui";
    ctx.fillText(`${this.i18n.t("coins")}: ${coinValue}`, coinTextX, lineY2);

    // weapon info (alt alta)
    ctx.font = "12px system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(`${player.weaponName}`, leftRect.x + linePadX, lineY3);
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.fillText(`${player.weaponBonus}`, leftRect.x + linePadX, lineY3 + 14);

    // ----- Draw Logo (center) -----
    if (logoImg) {
      ctx.drawImage(logoImg, logoRect.x, logoRect.y, logoRect.w, logoRect.h);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "24px system-ui";
      ctx.fillText(this.i18n.t("home_title"), safe.x + safe.w / 2, logoRect.y + 32);
    }

    // ----- Draw Right Panel (XP + Level bar) -----
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    fillRoundRect(ctx, rightRect.x, rightRect.y, rightRect.w, rightRect.h, 12);

    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    strokeRoundRect(ctx, rightRect.x + 0.5, rightRect.y + 0.5, rightRect.w - 1, rightRect.h - 1, 12);

    // XP bar geometry (bar panel içinde, yazılar barın içinde)
    const barPad = 12;
    const barX = rightRect.x + barPad;
    const barY = rightRect.y + Math.floor(rightRect.h / 2) - 14;
    const barW = rightRect.w - barPad * 2;
    const barH = 28;

    const xp = Math.max(0, Number(player.xp || 0));
    const xpToNext = Math.max(1, Number(player.xpToNext || 100));
    const pct = Math.max(0, Math.min(1, xp / xpToNext));

    // bar bg
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    fillRoundRect(ctx, barX, barY, barW, barH, 10);

    // bar fill
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    fillRoundRect(ctx, barX, barY, Math.max(8, barW * pct), barH, 10);

    // text inside bar (center)
    const levelText = `LVL ${player.level ?? 1}`;
    const xpText = `XP ${xp}/${xpToNext}`;

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "12px system-ui";
    ctx.fillText(`${levelText}  •  ${xpText}`, barX + barW / 2, barY + barH / 2 + 4);

    // ----- CTA (orta) -----
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.textAlign = "center";
    ctx.font = "16px system-ui";
    ctx.fillText(this.i18n.t("tap_to_earn"), safe.x + safe.w / 2, safe.y + safe.h * 0.55);

    // ----- Bottom tabs (safe-area içinde) -----
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

    // Dil ipucu (safe içinde)
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.textAlign = "left";
    ctx.font = "12px system-ui";
    ctx.fillText(`Lang: ${state.lang ?? "tr"} (L)`, safe.x + 12, bottomY - 10);
  }
      }
