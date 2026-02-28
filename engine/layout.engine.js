(() => {
  const DESIGN_W = 390;   // iPhone 12/13 miniapp için güzel taban
  const DESIGN_H = 844;   // 9:16 sahne (390x844)

  function ensureBaseCSS() {
    if (document.getElementById("tc-layout-base-css")) return;

    const css = `
:root{
  --tc-design-w:${DESIGN_W};
  --tc-design-h:${DESIGN_H};
  --tc-scale:1;
  --tc-safe-top: env(safe-area-inset-top, 0px);
  --tc-safe-right: env(safe-area-inset-right, 0px);
  --tc-safe-bottom: env(safe-area-inset-bottom, 0px);
  --tc-safe-left: env(safe-area-inset-left, 0px);
}

/* SAYFA KİLİDİ */
html, body{
  width:100%;
  height:100%;
  margin:0;
  padding:0;
  overflow:hidden;
  background:#05060a;           /* asla beyaz olmasın */
  touch-action: manipulation;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

/* KAPSAYICI: ortala + siyah arkaplan */
#tc-shell{
  position:fixed;
  inset:0;
  display:grid;
  place-items:center;
  background:#05060a;
}

/* SAHNE: 9:16 sabit tasarım, scale ile sığar */
#tc-stage{
  width: calc(var(--tc-design-w) * 1px);
  height: calc(var(--tc-design-h) * 1px);
  transform: scale(var(--tc-scale));
  transform-origin: top left;
  position:relative;
  overflow:hidden;

  /* İstersen sahnenin kenarlarını gör diye aç:
  border-radius: 22px;
  box-shadow: 0 20px 70px rgba(0,0,0,0.65);
  */
}

/* SAHNE İÇİ ROOT: tüm motorlar buraya basacak */
#tc-root{
  position:absolute;
  inset:0;
  overflow:hidden;
}

/* Safe area padding helper */
.tc-safe{
  position:absolute;
  inset:0;
  padding:
    calc(8px + var(--tc-safe-top))
    calc(8px + var(--tc-safe-right))
    calc(8px + var(--tc-safe-bottom))
    calc(8px + var(--tc-safe-left));
  box-sizing:border-box;
}

/* Debug kapat */
#tc-debug{
  position:absolute;
  left:10px;
  bottom:10px;
  z-index:9999;
  font-size:12px;
  opacity:.75;
  display:none;
}
`;
    const style = document.createElement("style");
    style.id = "tc-layout-base-css";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildDOM() {
    // Eski sayfalardaki .app vs. varsa bozmasın ama kullanmayacağız.
    // Biz kendi kilitli root'umuzu kuracağız.
    let shell = document.getElementById("tc-shell");
    if (shell) return;

    shell = document.createElement("div");
    shell.id = "tc-shell";

    const stage = document.createElement("div");
    stage.id = "tc-stage";

    const root = document.createElement("div");
    root.id = "tc-root";
    root.className = "tc-safe"; // safe-area padding

    const dbg = document.createElement("div");
    dbg.id = "tc-debug";

    stage.appendChild(root);
    stage.appendChild(dbg);
    shell.appendChild(stage);

    // Body'ye ekle
    document.body.appendChild(shell);

    // Dış motorların kullanması için global referans
    window.TC_LAYOUT = window.TC_LAYOUT || {};
    window.TC_LAYOUT.root = root;
    window.TC_LAYOUT.stage = stage;
  }

  function calcScale() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Sahne boyutuna sığacak scale
    const sx = vw / DESIGN_W;
    const sy = vh / DESIGN_H;
    const scale = Math.min(sx, sy);

    // Çok büyütüp desktopta piksel piksel olmasın diye üst limit istersen koy:
    const capped = Math.min(scale, 1.15); // mobilde 1'e yakın, desktopta hafif büyüsün
    document.documentElement.style.setProperty("--tc-scale", String(capped));

    // Debug
    const dbg = document.getElementById("tc-debug");
    if (dbg) dbg.textContent = `vw:${vw} vh:${vh} scale:${capped.toFixed(3)}`;
  }

  function lockResize() {
    let t = null;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(calcScale, 50);
    };
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    // Telegram webview bazen visualViewport oynatır:
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onResize, { passive: true });
    }
  }

  function exposeMountHelpers() {
    // Motorlar buraya basacak: window.TC_LAYOUT.mount(node) veya mountHTML(html)
    window.TC_LAYOUT = window.TC_LAYOUT || {};

    window.TC_LAYOUT.clear = () => {
      const root = window.TC_LAYOUT.root;
      if (!root) return;
      root.innerHTML = "";
    };

    window.TC_LAYOUT.mount = (node) => {
      const root = window.TC_LAYOUT.root;
      if (!root) return;
      root.appendChild(node);
    };

    window.TC_LAYOUT.mountHTML = (html) => {
      const root = window.TC_LAYOUT.root;
      if (!root) return;
      const wrap = document.createElement("div");
      wrap.innerHTML = html;
      while (wrap.firstChild) root.appendChild(wrap.firstChild);
    };
  }

  function init() {
    ensureBaseCSS();
    buildDOM();
    exposeMountHelpers();
    calcScale();
    lockResize();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
