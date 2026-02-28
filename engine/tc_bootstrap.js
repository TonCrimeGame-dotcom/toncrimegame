(() => {
  // Bu dosya EN ÖNCE yüklenmeli.
  // Amaç: sayfadaki eski HUD/topbar/app/duplicate sidebar vs ne varsa kaldırmak ve
  // sadece yeni motorun kökünü bırakmak.

  const REMOVE_SELECTORS = [
    ".hud-card", ".hud", ".tc-topbar", ".topbar", ".time-pill", ".online-pill",
    ".tc-logo", ".logo",
    ".app", "#app", "#rootApp", "#game",
    "#topbar", "#hud", "#hudCard",
  ];

  const KEEP_SELECTORS = [
    "#sidebar", ".sidebar", "#overlay", ".overlay" // slide menu için bunları tut
  ];

  function isKeep(node) {
    if (!(node instanceof Element)) return false;
    return KEEP_SELECTORS.some(sel => node.matches(sel));
  }

  function nukeOld() {
    // 1) Duplicate sidebar/overlay varsa teke düşür
    const sidebars = document.querySelectorAll("#sidebar, .sidebar");
    sidebars.forEach((el, i) => { if (i > 0) el.remove(); });

    const overlays = document.querySelectorAll("#overlay, .overlay");
    overlays.forEach((el, i) => { if (i > 0) el.remove(); });

    // 2) HUD/topbar/app vb. ne varsa kaldır
    REMOVE_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!isKeep(el)) el.remove();
      });
    });

    // 3) Body içine yanlışlıkla basılan direkt child'ları temizle (sidebar/overlay hariç)
    // Ama layout motorunun koyacağı tc-shell gelirse onu bırakacağız.
    [...document.body.children].forEach(ch => {
      if (ch.id === "tc-shell") return;
      if (isKeep(ch)) return;

      // script/style/link/meta dokunma
      const tag = ch.tagName?.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "link" || tag === "meta") return;

      // boşsa veya eski UI container'ıysa kaldır
      if (
        ch.classList.contains("hud-card") ||
        ch.classList.contains("hud") ||
        ch.classList.contains("app") ||
        ch.id === "app" ||
        ch.id === "topbar" ||
        ch.id === "hud"
      ) ch.remove();
    });
  }

  function lockHtmlBody() {
    // Beyaz ekranı kökten bitir
    const css = `
html, body{
  width:100% !important;
  height:100% !important;
  margin:0 !important;
  padding:0 !important;
  overflow:hidden !important;
  background:#05060a !important;
}
`;
    const style = document.createElement("style");
    style.id = "tc-bootstrap-lock";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function init() {
    lockHtmlBody();
    nukeOld();

    // Eski motorlar sonradan DOM basarsa tekrar temizle:
    const mo = new MutationObserver(() => {
      // tc-shell varsa dokunma, sadece eski HUD/topbar/app tekrar gelirse kaldır
      nukeOld();
    });

    mo.observe(document.body, { childList: true, subtree: true });
    window.TC_BOOTSTRAP = { nukeOld };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
