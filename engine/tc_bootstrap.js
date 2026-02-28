(() => {
  // 1) Önce eski/çakışan şeyleri temizle (duplicate sidebar/overlay vs.)
  const killIds = ["tc-shell", "tc-stage", "tc-app", "tc-topbar"];
  killIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  // Eski projenden kalma duplicate menü/overlay varsa (güvenli temizleme)
  // Not: Sadece birden fazla varsa temizliyoruz.
  const dedupe = (selector) => {
    const els = Array.from(document.querySelectorAll(selector));
    if (els.length > 1) els.slice(1).forEach(e => e.remove());
  };
  dedupe("#sidebar");
  dedupe("#overlay");

  // 2) Shell + Stage + App oluştur
  const shell = document.createElement("div");
  shell.id = "tc-shell";

  const stage = document.createElement("div");
  stage.id = "tc-stage";

  const app = document.createElement("div");
  app.id = "tc-app";

  stage.appendChild(app);
  shell.appendChild(stage);
  document.body.appendChild(shell);

  // Debug (istersen kaldır)
  window.TC = window.TC || {};
  window.TC.shell = shell;
  window.TC.stage = stage;
  window.TC.app = app;
})();
