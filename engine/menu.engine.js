(() => {

  function createMenu() {
    if (document.getElementById("tc-menu")) return;

    const stage = document.getElementById("tc-stage");

    const overlay = document.createElement("div");
    overlay.id = "tc-menu-overlay";

    const menu = document.createElement("div");
    menu.id = "tc-menu";

    menu.innerHTML = `
      <div class="menu-header">MENU</div>
      <div class="menu-item" onclick="openLeaderboard()">Leaderboard</div>
      <div class="menu-item">Görevler</div>
      <div class="menu-item">PvP</div>
      <div class="menu-item">Ayarlar</div>
    `;

    stage.appendChild(overlay);
    stage.appendChild(menu);

    overlay.onclick = closeMenu;
  }

  window.openMenu = function() {
    document.getElementById("tc-menu").classList.add("open");
    document.getElementById("tc-menu-overlay").classList.add("open");
  }

  window.closeMenu = function() {
    document.getElementById("tc-menu").classList.remove("open");
    document.getElementById("tc-menu-overlay").classList.remove("open");
  }

  createMenu();

})();
