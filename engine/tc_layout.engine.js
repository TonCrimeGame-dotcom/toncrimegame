(() => {
  // Bu motor: sahneyi sabitler -> senin görselindeki gibi
  const DESIGN_W = 390;  // telefon genişliği
  const DESIGN_H = 844;  // 9:16

  function injectCSS() {
    if (document.getElementById("tc-layout-css")) return;

    const css = `
:root{
  --tc-design-w:${DESIGN_W};
  --tc-design-h:${DESIGN_H};
  --tc-scale:1;
}

/* dış dünya: tamamen siyah */
#tc-shell{
  position:fixed;
  inset:0;
  display:grid;
  place-items:center;
  background:#05060a;
}

/* telefon sahnesi */
#tc-stage{
  width: calc(var(--tc-design-w) * 1px);
  height: calc(var(--tc-design-h) * 1px);
  transform: scale(var(--tc-scale));
  transform-origin: top left;
  position:relative;
  overflow:hidden;
  background:#000; /* sahnenin defaultu siyah, arkaplanı sen basarsın */
}

/* içerik root */
#tc-root{
  position:absolute;
  inset:0;
  overflow:hidden;
}

/* sahne içinde arkaplan resmi için helper */
.tc-bg{
  position:absolute;
  inset:0;
  background-position:center;
  background-size:cover;
  background-repeat:no-repeat;
}

/* üst UI katmanı */
.tc-ui{
  position:absolute;
  inset:0;
  pointer-events:none; /* default */
}
.tc-ui *{ pointer-events:auto; }

/* küçük güvenli padding */
.tc-pad{
  position:absolute;
  inset:0;
  padding: 10px;
  box-sizing:border-box;
}

/* Debug kapalı */
#tc-debug{ display:none; }
`;
    const style = document.createElement("style");
    style.id = "tc-layout-css";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function build() {
    // varsa yeniden kurma
    if (document.getElementById("tc-shell")) return;

    const shell = document.createElement("div");
    shell.id = "tc-shell";

    const stage = document.createElement("div");
    stage.id = "tc-stage";

    const root = document.createElement("div");
    root.id = "tc-root";

    stage.appendChild(root);
    shell.appendChild(stage);
    document.body.appendChild(shell);

    window.TC_LAYOUT = {
      shell, stage, root,
      setBackground(url){
        let bg = stage.querySelector(".tc-bg");
        if (!bg){
          bg = document.createElement("div");
          bg.className = "tc-bg";
          stage.insertBefore(bg, root);
        }
        bg.style.backgroundImage = `url('${url}')`;
      },
      clear(){
        root.innerHTML = "";
      },
      mount(node){
        root.appendChild(node);
      },
      mountHTML(html){
        const w = document.createElement("div");
        w.innerHTML = html;
        while (w.firstChild) root.appendChild(w.firstChild);
      }
    };
  }

  function calcScale() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = Math.min(vw / DESIGN_W, vh / DESIGN_H);
    // desktop çok büyümesin
    const capped = Math.min(s, 1.05);
    document.documentElement.style.setProperty("--tc-scale", String(capped));
  }

  function init() {
    injectCSS();
    build();
    calcScale();

    let t;
    const onR = () => { clearTimeout(t); t = setTimeout(calcScale, 50); };
    window.addEventListener("resize", onR, { passive:true });
    window.addEventListener("orientationchange", onR, { passive:true });
    if (window.visualViewport) window.visualViewport.addEventListener("resize", onR, { passive:true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
