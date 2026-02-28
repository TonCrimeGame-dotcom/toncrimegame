/* ======================================================
   TONCRIME - LAYOUT ENGINE
   (HTML bozmadan: full-bg + sayfa zemini sabitle)
   ====================================================== */
(() => {
  const BG_SRC_FALLBACK = "assets/background.jpg";

  function injectCSS() {
    if (document.getElementById("tc-layout-css")) return;

    const style = document.createElement("style");
    style.id = "tc-layout-css";
    style.textContent = `
      /* Beyaz boşluk/flash asla olmasın */
      html, body{
        height: 100%;
        margin: 0;
        padding: 0;
        background: #000 !important;
        overflow-x: hidden;
      }

      /* App mutlaka viewport'u kaplasın */
      .app{
        position: relative;
        min-height: 100vh;
        background: transparent !important;
        overflow: hidden;
      }

      /* BG her zaman full screen */
      .app > img.bg,
      img.bg{
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        object-fit: cover !important;
        z-index: -999 !important;
        pointer-events: none !important;
      }

      /* BG üstüne hafif karartma (ekran tutarlı) */
      .app::before{
        content: "";
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.35);
        z-index: -998;
        pointer-events: none;
      }

      /* Menü/HUD/topbar vs. z-index güvenliği */
      .tc-topbar, .hud, .hud-card, .side-menu, .sidebar, .tc-menu{
        position: relative;
        z-index: 50;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureAppRoot() {
    let app = document.querySelector(".app");
    if (!app) {
      app = document.createElement("div");
      app.className = "app";

      // body içindekileri app içine al (bozmadan)
      const nodes = Array.from(document.body.childNodes);
      for (const n of nodes) app.appendChild(n);
      document.body.appendChild(app);
    }
    return app;
  }

  function ensureBackground(app) {
    let bg = app.querySelector("img.bg") || document.querySelector("img.bg");
    if (!bg) {
      bg = document.createElement("img");
      bg.className = "bg";
      bg.alt = "bg";
      bg.src = BG_SRC_FALLBACK;
      app.prepend(bg);
    }

    // src boşsa fallback ver
    if (!bg.getAttribute("src") || bg.getAttribute("src").trim() === "") {
      bg.src = BG_SRC_FALLBACK;
    }
  }

  function boot() {
    injectCSS();
    const app = ensureAppRoot();
    ensureBackground(app);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
