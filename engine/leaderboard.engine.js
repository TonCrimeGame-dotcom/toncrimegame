/* ===================================================
   TONCRIME LIVE LEADERBOARD ENGINE
   =================================================== */

(function(){

const BOARD={};

BOARD.render=async function(){

const root=document.getElementById("tc-content");

const {data}=await db
.from("users")
.select("id,nickname,level,yton")
.order("yton",{ascending:false})
.limit(20);

root.innerHTML=`
<h2>🏆 Liderler</h2>

${data.map((u,i)=>`
<div class="card">
#${i+1} ${u.nickname}
<br>Level ${u.level}
<br>💰 ${Number(u.yton).toFixed(2)} YTON
</div>
`).join("")}
`;

};

EVENT.on("page:enter",p=>{
if(p==="leaderboard") BOARD.render();
});

window.LEADERBOARD=BOARD;

})();
