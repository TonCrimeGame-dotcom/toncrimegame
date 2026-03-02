export class BootScene {
  constructor({ assets, i18n, scenes }) {
    this.assets = assets;
    this.i18n = i18n;
    this.scenes = scenes;
    this._done = false;
  }

  async onEnter() {
    this._done = false;

    // Örnek asset listesi: senin görsellerinle dolduracağız
    await this.assets.loadImages([
      // { key: "bg", src: "./assets/ui/bg.png" },
    ]);

    this._done = true;
    this.scenes.go("home");
  }

  render(ctx, w, h) {
    ctx.fillStyle = "#0b0b0f";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(this.i18n.t("loading"), w / 2, h / 2);

    if (!this._done) {
      ctx.font = "12px system-ui";
      ctx.fillText("(assets loading)", w / 2, h / 2 + 26);
    }
  }
}
