/* =========================================
   TOPBAR ONLY LOGO PATCH (DOM'A DOKUNMAZ)
   - Barları / yazıları SİLMEZ
   - Sadece logo: ortala + büyüt
   ========================================= */
(function () {
  const STYLE_ID = "tc_topbar_logo_patch_v1";

  function getScale() {
    // html style attribute içinde --tc-scale var (senin ekranda görünüyor)
    const v = getComputedStyle(document.documentElement).getPropertyValue("--tc-scale").trim();
    const n = parseFloat(v);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  function inject() {
    if (document.getElementById(STYLE_ID)) return;

    const scale = getScale();

    // 2 bar yüksekliği hissi için: base 44px iyi (40-48 arası)
    // scale varsa gerçek px = base / scale (çünkü sen sayfayı scale küçültüyorsun)
    const logoH = Math.round(44 / scale);

    const css = `
/* Topbar container'ı hangisi olursa olsun bozma:
   sadece "logo" elemanını hedefleyeceğiz. */

/* 1) LOGO'yu bul (farklı class/id ihtimalleri) */
#tcTopbar img, 
#tc-topbar img,
.tc-topbar img,
.topbar img,
img.tc-logo,
img#tcLogo,
img#logo,
img[alt*="TON"],
img[src*="assets/logo"]{
  height: ${logoH}px !important;
  width: auto !important;
  max-height: none !important;
  max-width: none !important;
  object-fit: contain !important;
  filter: drop-shadow(0 3px 10px rgba(0,0,0,.55)) !important;
}

/* 2) LOGO'yu TAM ORTA'ya al (ama barları ezme)
   - Sadece logo'nun parent'ını ortalamaya çalışır
   - Barların sağ/sol yerleşimi korunur */
#tcTopbar,
#tc-topbar,
.tc-topbar,
.topbar{
  position: relative !important;
}

/* logo'nun en yakın kapsayıcısını merkezle */
#tcTopbar img,
#tc-topbar img,
.tc-topbar img,
.topbar img{
  position: absolute !important;
  left: 50% !important;
  top: 8px !important;
  transform: translateX(-50%) !important;
  z-index: 5 !important;
}

/* Sağdaki bar grubunun üstüne binmesin diye:
   topbar’ın üst padding'ini azıcık arttırır (barlar durur) */
#tcTopbar,
#tc-topbar,
.tc-topbar,
.topbar{
  padding-top: ${Math.round((logoH + 10) * 0.35)}px !important;
}
    `.trim();

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // DOM hazır olunca bas
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }

  // Sayfa içinde render tekrar olursa style zaten duruyor
})();
