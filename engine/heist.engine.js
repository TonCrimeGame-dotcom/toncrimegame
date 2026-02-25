/* ===================================================
   TONCRIME HEIST ENGINE (PRO CORE)
   =================================================== */

(function(){

if(!window.HEIST) window.HEIST = {};

const HE = window.HEIST;

/* ===================================================
   CONFIG
   =================================================== */

HE.CONFIG = {
  GRID_COLS: 3,
  GRID_ROWS: 3,
  MAX_RISK: 100,
  BASE_TIME: 20000, // 20s
  LEVEL_SCALING: true
};

/* ===================================================
   INTERNAL STATE
   =================================================== */

HE.state = {
  seed: null,
  scene: null,
  risk: 0,
  timeLeft: 0,
  difficulty: 1,
  realTargetId: null,
  objects: []
};

/* ===================================================
   UTILS
   =================================================== */

function seededRandom(seed){
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function rand(seedObj, max){
  seedObj.value++;
  return Math.floor(seededRandom(seedObj.value) * max);
}

/* ===================================================
   DIFFICULTY SYSTEM
   =================================================== */

HE.getDifficulty = function(level){

  if(level < 10) return 1;
  if(level < 20) return 2;
  if(level < 40) return 3;
  return 4;
};

/* ===================================================
   GRID SYSTEM
   =================================================== */

HE.generateGrid = function(){

  const grid = [];

  for(let r=0; r<HE.CONFIG.GRID_ROWS; r++){
    for(let c=0; c<HE.CONFIG.GRID_COLS; c++){
      grid.push({ row:r, col:c, occupied:false });
    }
  }

  return grid;
};

/* ===================================================
   TARGET POOLS
   =================================================== */

HE.TARGETS = {
  bank: ["safe","key","usb","card"],
  crypto: ["usb","server","harddisk"],
  inside: ["key","badge","card"],
  vip: ["vault","panel","fingerprint"]
};

/* ===================================================
   SCENE GENERATOR
   =================================================== */

HE.generateScene = function(params){

  const {
    level,
    missionType,
    seed,
    isPremium=false,
    weaponBonus=0
  } = params;

  HE.state.seed = seed || Date.now();
  const seedObj = { value: HE.state.seed };

  HE.state.difficulty = HE.getDifficulty(level);
  HE.state.risk = 0;

  const grid = HE.generateGrid();
  const objects = [];

  // Determine prop count by difficulty
  const propCount = 3 + HE.state.difficulty * 2;

  // Select real target
  const pool = HE.TARGETS[missionType] || HE.TARGETS.bank;
  const realIndex = rand(seedObj, pool.length);
  const realType = pool[realIndex];

  HE.state.realTargetId = "obj_real";

  // Place real target
  let gridIndex = rand(seedObj, grid.length);
  grid[gridIndex].occupied = true;

  objects.push({
    id:"obj_real",
    type: realType,
    grid: grid[gridIndex],
    isReal:true
  });

  // Place fake props
  for(let i=0;i<propCount;i++){

    let gi;
    do{
      gi = rand(seedObj, grid.length);
    }while(grid[gi].occupied);

    grid[gi].occupied = true;

    objects.push({
      id:"obj_fake_"+i,
      type: pool[rand(seedObj,pool.length)],
      grid: grid[gi],
      isReal:false
    });
  }

  HE.state.objects = objects;

  // Time calculation
  let baseTime = HE.CONFIG.BASE_TIME;

  if(HE.state.difficulty === 2) baseTime -= 5000;
  if(HE.state.difficulty === 3) baseTime -= 8000;
  if(HE.state.difficulty === 4) baseTime -= 12000;

  if(isPremium) baseTime *= 1.3;
  if(weaponBonus) baseTime *= (1 + weaponBonus);

  HE.state.timeLeft = baseTime;

  HE.state.scene = {
    missionType,
    objects
  };

  return HE.state.scene;
};

/* ===================================================
   INTERACTION ENGINE
   =================================================== */

HE.clickObject = function(objectId){

  const obj = HE.state.objects.find(o=>o.id===objectId);
  if(!obj) return { result:"invalid" };

  if(obj.isReal){
    return { result:"win", risk:HE.state.risk };
  }

  // Wrong click
  HE.addRisk();
  return { result:"wrong", risk:HE.state.risk };
};

/* ===================================================
   RISK ENGINE
   =================================================== */

HE.addRisk = function(){

  const increase = 5 + Math.floor(Math.random()*10);
  HE.state.risk += increase;

  if(HE.state.risk >= HE.CONFIG.MAX_RISK){
    HE.state.risk = HE.CONFIG.MAX_RISK;
  }
};

HE.isFailed = function(){
  return HE.state.risk >= HE.CONFIG.MAX_RISK;
};

/* ===================================================
   TIMER SYSTEM
   =================================================== */

HE.tick = function(delta){

  HE.state.timeLeft -= delta;

  if(HE.state.timeLeft <= 0){
    HE.state.timeLeft = 0;
    return { result:"timeout" };
  }

  return { result:"running", time:HE.state.timeLeft };
};

/* ===================================================
   PvP SYNC SUPPORT
   =================================================== */

HE.generateFromMatch = function(matchId, params){
  return HE.generateScene({
    ...params,
    seed: matchId
  });
};

console.log("🔥 Heist Engine Ready");

})();
