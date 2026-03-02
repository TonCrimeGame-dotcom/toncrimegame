function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export class HomeScene {
  constructor({ store, input, i18n, assets, scenes }) {
    this.assets = assets;
    this.store = store;
    this.input = input;
    this.i18n = i18n;
    this.scenes = scenes;

    this._tabs = []; // clickable rects
  }

  onEnter() {
    this._onKey = (e) => {
      if (e.key.toLowerCase() === "l") {
        const s = this.store.get();
        this.store.set({ lang: s.lang === "tr" ? "en" : "tr" });
      }
    };
    window.addEventListener("keydown", this._onKey);
  }

  onExit() {
    window.removeEventListener("keydown", this._onKey);
  }

  update() {
    // Tap to earn
    if (this.input.justPressed()) {
      // önce alt menüye tıklandı mı?
      const { x, y } = this.input.pointer;
      for (const t of this._tabs) {
        if (pointInRect(x, y, t.rect)) {
          this.scenes.go(t.sceneKey);
          return;
        }
      }

      // değilse coin artır
      const s = this.store.get();
      this.store.set({ coins: s.coins + 1 });
    }
  }

  render(ctx, w, h) {
    // ----- BG -----
    const bg = this.assets.getImage("background");
    if (bg) ctx.drawImage(bg, 0, 0, w, h);
    else {
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }

    // hafif karartma (gece hissi)
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, w, h);

    // ----- TOP UI -----
    const pad = 16;

    // coin sol üst
    const { coins, lang } = this.store.get();
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`${this.i18n.t("coins")}: ${coins}`, pad, 28);

    // logo üst orta
    const logo = this.assets.getImage("logo");
    if (logo) {
      const maxW = Math.min(260, w * 0.55);
      const scale = maxW / logo.width;
      const drawW = logo.width * scale;
      const drawH = logo.height * scale;
      ctx.drawImage(logo, (w - drawW) / 2, 18, drawW, drawH);
    } else {
      // fallback text
      ctx.font = "28px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(this.i18n.t("home_title"), w / 2, 70);
    }

    // CTA orta
    ctx.font = "16px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(this.i18n.t("tap_to_earn"), w / 2, h / 2);

    // Dil ipucu
    ctx.font = "13px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`Lang: ${lang} (L)`, pad, h - 64);

    // ----- BOTTOM TABS -----
    const barH = 58;
    const y = h - barH;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, y, w, barH);

    const tabs = [
      { key: "tab_missions", sceneKey: "missions" },
      { key: "tab_dealer", sceneKey: "dealer" },
      { key: "tab_pvp", sceneKey: "pvp" },
      { key: "tab_clan", sceneKey: "clan" },
    ];

    const gap = 10;
    const tabW = Math.floor((w - pad * 2 - gap * (tabs.length - 1)) / tabs.length);
    const tabH = 38;
    const ty = y + Math.floor((barH - tabH) / 2);

    this._tabs = [];
    ctx.font = "13px system-ui";
    ctx.textAlign = "center";

    tabs.forEach((t, i) => {
      const tx = pad + i * (tabW + gap);
      const rect = { x: tx, y: ty, w: tabW, h: tabH };

      // button bg
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

      // button border
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);

      // text
      ctx.fillStyle = "#ffffff";
      ctx.fillText(this.i18n.t(t.key), rect.x + rect.w / 2, rect.y + rect.h / 2 + 5);

      this._tabs.push({ rect, sceneKey: t.sceneKey });
    });

    // küçük not: home'a dönüş şimdilik tarayıcı geri ile veya refresh
    // (istersen bir "Ana" butonu da ekleriz)
  }
}
