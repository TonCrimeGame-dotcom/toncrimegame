export class Assets {
  constructor() {
    this.images = new Map();
    this.promises = [];
  }

  // --- Yükleme (tek resim) ---
  loadImage(key, src) {
    const img = new Image();

    const p = new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Image failed: ${src}`));
    });

    img.src = src;

    this.images.set(key, img);
    this.promises.push(p);

    return img;
  }

  // --- Alias'lar (main.js / scene'ler farklı isim çağırabilir) ---
  image(key, src) {
    return this.loadImage(key, src);
  }

  addImage(key, src) {
    return this.loadImage(key, src);
  }

  // --- Get ---
  getImage(key) {
    return this.images.get(key);
  }

  get(key) {
    return this.images.get(key);
  }

  // --- BootScene'nin beklediği: hepsini yükle ---
  async loadImages() {
    await Promise.all(this.promises);
  }

  async ready() {
    await Promise.all(this.promises);
  }
}
