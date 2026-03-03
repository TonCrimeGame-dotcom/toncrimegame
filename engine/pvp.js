// TONCRIME PVP SYSTEM

const TonCrimePVP = (() => {

  const CFG = {
    cols: 3,
    rows: 4,
    iconSize: 64,
    padding: 10,
    spawnMinMs: 350,
    spawnMaxMs: 700,
    ttlMinMs: 900,
    ttlMaxMs: 1400,
    missSelfDmg: 4
  };

  const ACTIONS = [
    { id:"yumruk", dmg:10, emoji:"👊" },
    { id:"tekme",  dmg:15, emoji:"🦶" },
    { id:"tokat",  dmg:6,  emoji:"🖐️" },
    { id:"kafa",   dmg:20, emoji:"🤕" }
  ];

  let arena, statusEl, enemyFill, meFill, enemyHpTxt, meHpTxt;

  let running = false;
  let enemyHp = 100;
  let meHp = 100;
  let occupied;
  let timers = new Set();

  function init(config){
    arena = document.getElementById(config.arenaId);
    statusEl = document.getElementById(config.statusId);
    enemyFill = document.getElementById(config.enemyFillId);
    meFill = document.getElementById(config.meFillId);
    enemyHpTxt = document.getElementById(config.enemyHpTextId);
    meHpTxt = document.getElementById(config.meHpTextId);

    occupied = new Array(CFG.cols * CFG.rows).fill(false);
    updateBars();
  }

  function setStatus(txt){
    if(statusEl) statusEl.textContent = "PvP • " + txt;
  }

  function updateBars(){
    enemyHpTxt.textContent = enemyHp;
    meHpTxt.textContent = meHp;
    enemyFill.style.transform = `scaleX(${enemyHp/100})`;
    meFill.style.transform = `scaleX(${meHp/100})`;
  }

  function randInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickFreeZone(){
    const free = [];
    for(let i=0;i<occupied.length;i++){
      if(!occupied[i]) free.push(i);
    }
    if(!free.length) return null;
    return free[randInt(0, free.length-1)];
  }

  function zoneToXY(zoneIndex){
    const rect = arena.getBoundingClientRect();
    const col = zoneIndex % CFG.cols;
    const row = Math.floor(zoneIndex / CFG.cols);

    const cellW = rect.width / CFG.cols;
    const cellH = rect.height / CFG.rows;

    const maxX = Math.max(0, cellW - CFG.iconSize - CFG.padding);
    const maxY = Math.max(0, cellH - CFG.iconSize - CFG.padding);

    const x = col * cellW + CFG.padding + Math.random()*maxX;
    const y = row * cellH + CFG.padding + Math.random()*maxY;

    return {x,y};
  }

  function clearAllTimers(){
    for(const id of timers) clearTimeout(id);
    timers.clear();
  }

  function removeAction(el, zoneIndex){
    occupied[zoneIndex] = false;
    el.remove();
  }

  function spawnOne(){
    if(!running) return;

    const zoneIndex = pickFreeZone();
    if(zoneIndex === null) return;

    const action = ACTIONS[randInt(0, ACTIONS.length-1)];
    const {x,y} = zoneToXY(zoneIndex);

    const el = document.createElement("div");
    el.className = "action";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.innerHTML = `<div class="emoji">${action.emoji}</div>`;

    occupied[zoneIndex] = true;
    arena.appendChild(el);

    let removed = false;

    const ttl = randInt(CFG.ttlMinMs, CFG.ttlMaxMs);

    const missTimer = setTimeout(() => {
      if(removed) return;
      removed = true;
      removeAction(el, zoneIndex);
      meHp -= CFG.missSelfDmg;
      updateBars();
      setStatus("Kaçırdın!");
    }, ttl);

    timers.add(missTimer);

    el.addEventListener("pointerdown", (e)=>{
      e.preventDefault();
      if(removed) return;
      removed = true;
      clearTimeout(missTimer);
      removeAction(el, zoneIndex);

      enemyHp -= action.dmg;
      updateBars();
      setStatus(action.id + " -" + action.dmg);
    });
  }

  function loopSpawn(){
    if(!running) return;
    spawnOne();
    const next = randInt(CFG.spawnMinMs, CFG.spawnMaxMs);
    const t = setTimeout(loopSpawn, next);
    timers.add(t);
  }

  function start(){
    if(running) return;
    running = true;
    setStatus("Başladı");
    loopSpawn();
  }

  function stop(){
    running = false;
    clearAllTimers();
    arena.querySelectorAll(".action").forEach(n=>n.remove());
    occupied.fill(false);
  }

  function reset(){
    stop();
    enemyHp = 100;
    meHp = 100;
    updateBars();
    setStatus("Hazır");
  }

  return { init, start, stop, reset };

})();
