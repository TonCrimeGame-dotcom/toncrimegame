/* ======================================================
   TONCRIME - LAYOUT ENGINE (LOCKED VIEWPORT)
   - Full background cover (fixed)
   - Phone-like locked viewport (9:16) centered
   - Stable scale + fonts
   - HTML'e dokunmadan wrapper oluşturur
   ====================================================== */
(() => {
  const BG_SRC_FALLBACK = "assets/background.jpg";
  const ASPECT_W = 9;
  const ASPECT_H = 16;

  function injectCSS() {
    if (document.getElementById("tc-layout-css")) return;

    const style = document.createElement("style");
    style.id = "tc-layout-css";
    style.textContent = `
      /* 1) Beyaz flash / üst bant asla olmasın */
      html, body{
        height:100%;
        margin:0;
        padding:0;
        background:#000 !important;
        overflow:hidden;
      }

      /* 2) Tam ekran sahne (arka plan için) */
      .app{
        position:relative;
        min-height:100vh;
        width:100vw;
        overflow:hidden;
        background:transparent !important;
      }

      /* 3) BG her zaman full screen */
      .app > img.bg,
      img.bg{
        position:fixed !important;
        inset:0 !important;
        width:100vw !important;
        height:100vh !important;
        object-fit:cover !important;
        z-index:-999 !important;
        pointer-events:none !important;
      }

      /* 4) Dış alan karartma (sabit atmosfer) */
      .tc-stage{
        position:fixed;
        inset:0;
        display:flex;
        align-items:center;
        justify-content:center;
        background:rgba(0,0,0,0.60);
        z-index:0;
      }

      /* 5) Telefon ekranı (KİLİTLİ ORAN) */
      .tc-viewport{
        position:relative;
        aspect-ratio:${ASPECT_W}/${ASPECT_H};
        height:min(92vh, 820px);      /* masaüstü: çok büyümesin */
        width:auto;
        max-width:min(92vw, 460px);   /* masaüstü: stabil genişlik */
        border-radius:26px;
        overflow:hidden;

        /* içerik tutarlılığı */
        background:transparent;
        transform:translateZ(0);
      }

      /* 6) “ekran çerçevesi” gibi hafif glow (istersen kapatırız) */
      .tc-viewport::after{
        content:"";
        position:absolute;
        inset:0;
        border-radius:26px;
        pointer-events:none;
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.06) inset,
          0 18px 60px rgba(0,0,0,0.55);
      }

      /* 7) İçerikler sadece viewport içinde akacak */
      .tc-content{
        position:absolute;
        inset:0;
        overflow:hidden;
      }

      /* 8) Yazı/ölçek sabitleme: her sayfada aynı hissiyat */
      .tc-viewport{
        /* viewport genişliğine bağlı stabil font */
        font-size: clamp(12px, 1.35vh, 15px);
      }

      /* 9) Eski "sayfa ortalama" kodları taşmasın */
      body > *:not(.app){ display:none !important; }

      /* 10) HUD/topbar/menu z-index güvenliği (viewport içinde) */
      .tc-content .tc-topbar,
      .tc-content .hud,
      .tc-content .hud-card,
      .tc-content .side-menu,
      .tc-content .sidebar,
      .tc-content .tc-menu{
        position:relative;
        z-index:50;
      }

      /* 11) Menü solda ise viewport dışına taşmasın */
      .tc-content .side-menu,
      .tc-content .sidebar,
      .tc-content .tc-menu{
        max-height:100%;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureAppRoot() {
    let app = document.querySelector(".app");
    if (!app) {
      app = document.createElement("div");
      app.className = "app";

      // body içindeki her şeyi app içine al (bozmadan)
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
    if (!bg.getAttribute("src") || bg.getAttribute("src").trim() === "") {
      bg.src = BG_SRC_FALLBACK;
    }
  }

  function lockViewport(app) {
    // Sahne + viewport yoksa oluştur
    let stage = app.querySelector(".tc-stage");
    if (!stage) {
      stage = document.createElement("div");
      stage.className = "tc-stage";
      app.appendChild(stage);
    }

    let viewport = stage.querySelector(".tc-viewport");
    if (!viewport) {
      viewport = document.createElement("div");
      viewport.className = "tc-viewport";
      stage.appendChild(viewport);
    }

    let content = viewport.querySelector(".tc-content");
    if (!content) {
      content = document.createElement("div");
      content.className = "tc-content";
      viewport.appendChild(content);
    }

    // app içindeki içerikleri tc-content içine taşı (bg hariç)
    const children = Array.from(app.childNodes);
    for (const node of children) {
      if (!(node instanceof Element)) continue;
      if (node.classList.contains("bg")) continue;
      if (node.classList.contains("tc-stage")) continue;
      content.appendChild(node);
    }

    // Eğer içerikler zaten content içindeyse dokunma
    // (ikinci çalışmada bozulma olmasın)
  }

  function boot() {
    injectCSS();
    const app = ensureAppRoot();
    ensureBackground(app);
    lockViewport(app);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
