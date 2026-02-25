class BookEngine {
    constructor(wrapperId, options){
        this.wrapper = document.getElementById(wrapperId);
        this.camera = options.camera;
        this.openImg = options.openImg;
        this.closedImg = options.closedImg;
        this.imageElement = options.imageElement;
        this.menuElement = options.menuElement;
        this.isOpen = false;

        this.wrapper.addEventListener("click", ()=> this.toggle());
    }

    toggle(){
        if(!this.isOpen){
            this.imageElement.src = this.openImg;
            this.wrapper.classList.add("open");
            this.camera.classList.add("zoom");
            this.menuElement.classList.add("show");
        } else {
            this.imageElement.src = this.closedImg;
            this.wrapper.classList.remove("open");
            this.camera.classList.remove("zoom");
            this.menuElement.classList.remove("show");
        }
        this.isOpen = !this.isOpen;
    }
}
