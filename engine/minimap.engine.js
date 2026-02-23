/* ===================================================
   TONCRIME MINIMAP ENGINE
   Live World Map Renderer
   =================================================== */

(function(){

if(!window.EVENT){
  console.warn("Minimap waiting...");
  return;
}

const MINIMAP = {

  canvas:null,
  ctx:null,
  size:200,
  scale:0.2,

  player:{x:0,y:0},
  wanted:{},

  /* ===========================================
     INIT
  =========================================== */

  init(){

    this.canvas=document.createElement("canvas");
    this.canvas.width=this.size;
    this.canvas.height=this.size;

    this.canvas.style.position="fixed";
    this.canvas.style.right="20px";
    this.canvas.style.bottom="20px";
    this.canvas.style.background="#111";
    this.canvas.style.border="2px solid gold";
    this.canvas.style.borderRadius="8px";
    this.canvas.style.zIndex="9999";

    document.body.appendChild(this.canvas);

    this.ctx=this.canvas.getContext("2d");

    this.loop();
  },

  /* ===========================================
     DRAW GRID
  =========================================== */

  drawGrid(){

    const c=this.ctx;

    c.strokeStyle="#222";

    for(let i=0;i<10;i++){
      c.beginPath();
      c.moveTo(i*20,0);
      c.lineTo(i*20,200);
      c.stroke();

      c.beginPath();
      c.moveTo(0,i*20);
      c.lineTo(200,i*20);
      c.stroke();
    }
  },

  /* ===========================================
     DRAW PLAYER
  =========================================== */

  drawPlayer(){

    const c=this.ctx;

    c.fillStyle="lime";

    c.beginPath();
    c.arc(
      this.player.x*this.scale,
      this.player.y*this.scale,
      4,0,Math.PI*2
    );

    c.fill();
  },

  /* ===========================================
     DRAW WANTED
  =========================================== */

  drawWanted(){

    const c=this.ctx;

    Object.values(this.wanted).forEach(p=>{

      c.fillStyle="red";

      c.beginPath();
      c.arc(
        p.pos_x*this.scale,
        p.pos_y*this.scale,
        3,0,Math.PI*2
      );

      c.fill();

    });
  },

  /* ===========================================
     RENDER
  =========================================== */

  render(){

    this.ctx.clearRect(0,0,this.size,this.size);

    this.drawGrid();
    this.drawWanted();
    this.drawPlayer();
  },

  /* ===========================================
     LOOP
  =========================================== */

  loop(){

    this.render();

    requestAnimationFrame(()=>this.loop());
  }

};

window.MINIMAP=MINIMAP;


/* ===========================================
   EVENT LINKS
=========================================== */

EVENT.on("world:position",(pos)=>{
  MINIMAP.player=pos;
});

EVENT.on("world:move",(pos)=>{
  MINIMAP.player=pos;
});

EVENT.on("radar:update",(players)=>{
  MINIMAP.wanted=players;
});


/* AUTO START */
setTimeout(()=>{
  MINIMAP.init();
},2000);

console.log("🧭 Minimap Engine Ready");

})();
