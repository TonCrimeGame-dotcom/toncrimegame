export class Assets {
  constructor() {
    this.images = new Map();
    this.promises = [];
  }

  // ✅ main.js adaptörü bu 3 ismi de arıyor, hepsini destekleyelim:
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

  // (Opsiyonel) preload bitmesini beklemek istersen
  async ready() {
    await Promise.allSettled(this.promises);
  }
}
