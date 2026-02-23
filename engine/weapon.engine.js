/* ===================================================
   TONCRIME WEAPON ENGINE
   PvP Speed Modifier System
   =================================================== */

(function(){

const WEAPONS = {

list:{

/* ---------- MELEE ---------- */

"Fists":0,
"Baseball Bat":0.02,
"Knife":0.03,

/* ---------- PISTOLS ---------- */

"Glock 17":0.05,
"Beretta M9":0.05,
"Desert Eagle":0.07,
"Colt 1911":0.06,
"FN Five-seveN":0.06,

/* ---------- SMG ---------- */

"MP5":0.08,
"Uzi":0.07,
"P90":0.09,
"Vector":0.10,

/* ---------- SHOTGUN ---------- */

"Remington 870":0.06,
"SPAS-12":0.08,

/* ---------- RIFLES ---------- */

"AK-47":0.12,
"M4A1":0.11,
"FAMAS":0.10,
"AUG":0.11,
"SCAR-L":0.12,

/* ---------- SNIPERS ---------- */

"Dragunov":0.15,
"AWP":0.20,
"Barrett M82":0.18,

/* ---------- SPECIAL ---------- */

"Crossbow":0.09,
"Golden Gun":0.13,
"Prototype X":0.16

},

/* ======================================
   GET BONUS
====================================== */

getBonus(weaponName){

return this.list[weaponName] || 0;

},

/* ======================================
   APPLY SPEED
====================================== */

apply(time,weapon){

const bonus=this.getBonus(weapon);

/* faster = smaller time */
return Math.floor(time*(1-bonus));

}

};

window.WEAPONS=WEAPONS;

console.log("🔫 Weapon Engine Ready");

})();
