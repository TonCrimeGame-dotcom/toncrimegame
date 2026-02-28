(() => {
  const DESIGN_W = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--tc-design-w")) || 390;
  const DESIGN_H = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--tc-design-h")) || 844;

  function computeScale() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Telegram miniapp: içerik asla taşmasın -> min scale
    const s = Math.min(vw / DESIGN_W, vh / DESIGN_H);

    // Aşırı küçük/büyük uçları biraz kitle (isteğe bağlı)
    const clamped = Math.max(0.5, Math.min(1.25, s));

    document.documentElement.style.setProperty("--tc-scale", String(clamped));
  }

  computeScale();
  window.addEventListener("resize", computeScale);
  window.addEventListener("orientationchange", computeScale);

  // Telegram WebApp varsa viewport/gesture değişimlerinde de tetikle
  try {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.onEvent("viewportChanged", computeScale);
    }
  } catch {}
})();
