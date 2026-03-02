export class Assets {
  constructor() {
    this.images = new Map();
  }

  async loadImages(list) {
    const tasks = list.map(({ key, src }) => this._loadImage(key, src));
    await Promise.all(tasks);
  }

  getImage(key) {
    return this.images.get(key) || null;
  }

  _loadImage(key, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        resolve();
      };
      img.onerror = () => reject(new Error(`Image load failed: ${src}`));
      img.src = src;
    });
  }
}
