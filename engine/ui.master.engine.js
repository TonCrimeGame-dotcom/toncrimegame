/* ===================================================
   AUTO UI BOOTSTRAP (FIX BLANK PAGE)
=================================================== */

(function(){

function bootUI(){

  // BODY hazır mı?
  if(!document.body) {
    setTimeout(bootUI,100);
    return;
  }

  /* ROOT APP */
  let app=document.getElementById("app");

  if(!app){
    app=document.createElement("div");
    app.id="app";
    document.body.appendChild(app);
  }

  /* BASIC LAYOUT */
  app.innerHTML=`
    <div id="layout" style="
      display:grid;
      grid-template-columns: 260px 1fr;
      min-height:100vh;
      background:#111;
      color:#fff;
      font-family:Arial;
    ">

      <div id="sidebar" style="
        background:#151515;
        padding:20px;
        border-right:1px solid #222;
      ">
        <h2 style="color:gold">TonCrime</h2>
        <p>🏠 Ana Sayfa</p>
        <p>⚔ PvP</p>
        <p>🏢 Mekanlar</p>
        <p>👥 Clan</p>
      </div>

      <div style="padding:20px">

        <div id="stats" style="
          background:#1b1b1b;
          padding:15px;
          border-radius:10px;
          margin-bottom:15px;
        ">
          Yükleniyor...
        </div>

        <div id="content"></div>

      </div>
    </div>
  `;

  console.log("🧩 UI Auto Layout Created");

}

document.addEventListener("DOMContentLoaded",bootUI);

})();
