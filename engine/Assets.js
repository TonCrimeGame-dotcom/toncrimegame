export class Assets {
  constructor() {
    this.images = new Map();
    this.promises = [];
  }

  image(key, src) {
    return this.loadImage(key, src);
  }

  addImage(key, src) {
    return this.loadImage(key, src);
  }

  loadImage(key, src) {
    const img = new Image();

    const p = new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
    });

    img.src = src;

    this.images.set(key, img);
    this.promises.push(p);

    return img;
  }

  getImage(key) {
    return this.images.get(key);
  }

  // ✅ BOOTSCENE BUNU BEKLİYOR
  async loadImages() {
    await Promise.all(this.promises);
  }

  async ready() {
    await Promise.all(this.promises);
  }
}
