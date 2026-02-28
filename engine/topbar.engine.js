/* =========================
   TOPBAR ENGINE PATCH (ONLY)
   - Logo SABIT büyük
   - Tam ORTA
   - 2 bar yüksekliği kadar
   - Konum sabit (kıpırdamaz)
   ========================= */

(function () {
  const TOPBAR_ID = "tc-topbar";
  const STYLE_ID  = "tc-topbar-style";
  const LOGO_SRC  = "assets/logo.png";

  function ensureTopbarCSS() {
    if (document.getElementById(STYLE_ID)) return;

    const css = `
/* TOPBAR: sabit + ortalanmış container */
#${TOPBAR_ID}{
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: min(420px, calc(100vw - 24px));
  z-index: 9999;

  display: grid;
  grid-template-columns: 1fr auto 1fr; /* sol | logo | sağ */
  align-items: start;
  gap: 10px;

  pointer-events: none;
}
#${TOPBAR_ID} > *{ pointer-events: auto; }

/* Sol / Orta / Sağ hizalar */
#${TOPBAR_ID} .tb-left{ justify-self: start; text-align:left; }
#${TOPBAR_ID} .tb-center{ justify-self: center; display:flex; justify-content:center; }
#${TOPBAR_ID} .tb-right{ justify-self: end; text-align:right; }

/* LOGO: sabit büyük (2 bar yüksekliği) */
#${TOPBAR_ID} .tb-logo{
  height: 42px;   /* 2 bar hissi: 40-46 arası oynat */
  width: auto;
  display: block;
  transform: none !important;
  filter: drop-shadow(0 3px 10px rgba(0,0,0,0.55));
}
    `.trim();

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function ensureTopbarDOM() {
    let root = document.getElementById(TOPBAR_ID);
    if (root) return root;

    root = document.createElement("div");
    root.id = TOPBAR_ID;

    // Sadece iskelet: sol / orta (logo) / sağ
    root.innerHTML = `
      <div class="tb-left" id="tbLeft"></div>

      <div class="tb-center">
        <img class="tb-logo" id="tbLogo" src="${LOGO_SRC}" alt="TonCrime">
      </div>

      <div class="tb-right" id="tbRight"></div>
    `;

    document.body.appendChild(root);
    return root;
  }

  // Eğer sende zaten topbar basan bir fonksiyon varsa,
  // aşağıdaki init’i o fonksiyonun en sonuna çağır.
  function initTopbar() {
    ensureTopbarCSS();
    ensureTopbarDOM();
  }

  // Sayfa yüklenince garanti et
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTopbar);
  } else {
    initTopbar();
  }

  // Eğer SPA gibi yeniden basılıyorsa:
  // periyodik kontrol (hafif)
  setInterval(() => {
    if (!document.getElementById(TOPBAR_ID)) initTopbar();
  }, 1000);
})();
