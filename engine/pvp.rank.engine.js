/* ================= PVP RANK ENGINE =================
   KURAL: Bu dosyada player oluşturmak YASAK.
   Sadece: const player = window.player;
   Amaç: ELO + Win/Loss + Streak + Leaderboard (localStorage)
====================================================== */

const player = window.player;

(function () {
  if (!player) {
    console.error("[PVP-RANK] window.player yok. player.engine.js window.player set etmeli.");
    return;
  }

  const LS_KEY = "pvp_leaderboard_v1";
  const LS_ME  = "pvp_me_v1";

  function nowISO() { return new Date().toISOString(); }
  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function getUsername(){
    return player.username || "Player01";
  }

  function loadBoard(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    }catch(e){
      return [];
    }
  }

  function saveBoard(arr){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(arr)); }catch(e){}
  }

  function loadMe(){
    try{
      const raw = localStorage.getItem(LS_ME);
      const obj = raw ? JSON.parse(raw) : null;
      if (obj && typeof obj === "object") return obj;
    }catch(e){}
    return {
      username: getUsername(),
      elo: 1000,
      wins: 0,
      losses: 0,
      streak: 0,       // +win streak, -lose streak
      last: null
    };
  }

  function saveMe(me){
    try{ localStorage.setItem(LS_ME, JSON.stringify(me)); }catch(e){}
  }

  function ensureSeed(board){
    if (board.length > 0) return board;

    // Fake seed
    const bots = [
      { username:"Shadow#221", elo:1120, wins:14, losses:9, streak:2, last: nowISO() },
      { username:"Viper#992",  elo:1085, wins:11, losses:7, streak:1, last: nowISO() },
      { username:"Razor#404",  elo:1040, wins:9,  losses:8, streak:-1,last: nowISO() },
      { username:"Ghost#777",  elo:1010, wins:8,  losses:8, streak:0, last: nowISO() },
      { username:"Titan#100",  elo:980,  wins:6,  losses:9, streak:-2,last: nowISO() },
      { username:"Zero#650",   elo:960,  wins:5,  losses:8, streak:1, last: nowISO() },
    ];
    saveBoard(bots);
    return bots;
  }

  function upsert(board, entry){
    const idx = board.findIndex(x => x.username === entry.username);
    if (idx >= 0) board[idx] = entry;
    else board.push(entry);
    return board;
  }

  function calcEloDelta(myElo, opElo, win){
    // Basit ELO (K=24)
    const K = 24;
    const expected = 1 / (1 + Math.pow(10, (opElo - myElo) / 400));
    const score = win ? 1 : 0;
    const delta = Math.round(K * (score - expected));
    return delta;
  }

  function recordMatch({ win, opponentName, opponentLevel }) {
    let me = loadMe();
    me.username = getUsername();

    // Rakip ELO: level'e göre yaklaşık üret
    const opElo = clamp(900 + (Number(opponentLevel || 1) * 12), 900, 1500);
    const delta = calcEloDelta(me.elo, opElo, win);

    me.elo = clamp(me.elo + delta, 0, 99999);
    if (win) {
      me.wins += 1;
      me.streak = me.streak >= 0 ? me.streak + 1 : 1;
    } else {
      me.losses += 1;
      me.streak = me.streak <= 0 ? me.streak - 1 : -1;
    }
    me.last = {
      at: nowISO(),
      win,
      delta,
      opponentName: opponentName || "Rakip",
      opponentLevel: Number(opponentLevel || 1),
      opponentElo: opElo
    };

    saveMe(me);

    // Board güncelle
    let board = ensureSeed(loadBoard());
    board = upsert(board, {
      username: me.username,
      elo: me.elo,
      wins: me.wins,
      losses: me.losses,
      streak: me.streak,
      last: me.last?.at || nowISO()
    });

    // Botlar biraz dalgalansın
    board = board.map(x => {
      if (x.username === me.username) return x;
      const drift = Math.random() < 0.25 ? (Math.random() < 0.5 ? -6 : 6) : 0;
      const elo = clamp((x.elo ?? 1000) + drift, 800, 1600);
      return { ...x, elo };
    });

    // sırala
    board.sort((a,b) => (b.elo ?? 0) - (a.elo ?? 0));
    saveBoard(board);

    render();
    return { me, delta, opElo };
  }

  function render(){
    const me = loadMe();
    const board = ensureSeed(loadBoard()).slice().sort((a,b) => (b.elo ?? 0) - (a.elo ?? 0)).slice(0, 10);

    const meEl = document.getElementById("lbMe");
    const listEl = document.getElementById("lbList");
    if (!meEl || !listEl) return;

    meEl.textContent = `ELO: ${me.elo} • W/L: ${me.wins}/${me.losses} • Streak: ${me.streak}`;

    listEl.innerHTML = "";
    board.forEach((x, i) => {
      const row = document.createElement("div");
      row.className = "lb-row" + (x.username === me.username ? " me" : "");
      row.innerHTML = `
        <div class="lb-rank">#${i+1}</div>
        <div class="lb-name">${x.username}</div>
        <div class="lb-elo">${x.elo}</div>
      `;
      listEl.appendChild(row);
    });
  }

  // UI CSS (global.css'e dokunmadan)
  const style = document.createElement("style");
  style.textContent = `
    .pvp-leaderboard{
      position:absolute;
      left:50%;
      top:calc(50% + 210px);
      transform:translate(-50%,0);
      width:320px;
      max-width:calc(100% - 30px);
      background:rgba(0,0,0,0.40);
      border:1px solid rgba(255,215,0,0.22);
      border-radius:16px;
      padding:10px 10px 8px;
      color:#fff;
      z-index:39;
      backdrop-filter: blur(6px);
    }
    .lb-head{
      display:flex;
      align-items:center;
      justify-content:space-between;
      margin-bottom:8px;
      gap:10px;
    }
    .lb-title{
      color:gold;
      font-weight:900;
      letter-spacing:.4px;
      font-size:12px;
    }
    .lb-me{
      font-size:11px;
      color:#eaeaea;
      opacity:.95;
      text-align:right;
      white-space:nowrap;
    }
    .lb-list{
      max-height:135px;
      overflow:auto;
      border-radius:12px;
    }
    .lb-row{
      display:flex;
      align-items:center;
      gap:8px;
      padding:7px 8px;
      border-radius:12px;
      background:rgba(255,255,255,0.06);
      margin-bottom:6px;
      font-size:11px;
    }
    .lb-row.me{
      border:1px solid rgba(255,215,0,0.35);
      background:rgba(255,215,0,0.08);
    }
    .lb-rank{ width:34px; color:gold; font-weight:900; }
    .lb-name{ flex:1; color:#fff; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
    .lb-elo{ width:52px; text-align:right; color:#dcdcdc; font-weight:800; }
  `;
  document.head.appendChild(style);

  // API
  window.PvPRank = {
    recordMatch,
    render,
    loadMe
  };

  document.addEventListener("DOMContentLoaded", () => {
    ensureSeed(loadBoard());
    render();
  });
})();
