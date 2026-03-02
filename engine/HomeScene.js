export class HomeScene {
  constructor({ store, input, i18n, assets }) {
    this.assets = assets;
    this.store = store;
    this.input = input;
    this.i18n = i18n;
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
    if (this.input.justPressed()) {
      const s = this.store.get();
      this.store.set({ coins: s.coins + 1 });
    }
  }

  render(ctx, w, h) {
    // Background image
    const bg = this.assets.getImage("background");
    if (bg) {
      ctx.drawImage(bg, 0, 0, w, h);
    } else {
      // fallback
      ctx.fillStyle = "#0b0b0f";
      ctx.fillRect(0, 0, w, h);
    }

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "28px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(this.i18n.t("home_title"), w / 2, 70);

    // Coin
    const { coins, lang } = this.store.get();
    ctx.font = "18px system-ui";
    ctx.fillText(`${this.i18n.t("coins")}: ${coins}`, w / 2, 110);

    // CTA
    ctx.font = "16px system-ui";
    ctx.fillText(this.i18n.t("tap_to_earn"), w / 2, h / 2);

    // Language hint
    ctx.font = "14px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`Lang: ${lang} (L)`, 16, h - 20);
  }
}
