export class Assets {
  constructor() {
    this.images = {};
  }

  image(key, src) {
    const img = new Image();
    img.src = src;
    this.images[key] = img;
  }

  getImage(key) {
    return this.images[key];
  }
}
