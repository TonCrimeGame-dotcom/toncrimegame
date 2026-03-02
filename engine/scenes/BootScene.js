export class BootScene {
  constructor({ assets, i18n, scenes }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;
  }

  async onEnter() {
    await this.assets.loadImages([
      { key: "background", src: "./src/assets/ui/background.jpg" },

      // Logo yolu: sende src/assets/logo.png varsayımı
      { key: "logo", src: "./src/assets/logo.png" },

      // Coin icon (yton)
      { key: "yton", src: "./src/assets/yton.png" },
    ]);

    this.scenes.go("home");
  }

  render(ctx, w, h) {
    ctx.fillStyle = "#0b0b0f";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(this.i18n.t("loading"), w / 2, h / 2);
  }
}
