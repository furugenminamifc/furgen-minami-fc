/* Ver.20.0.4 選手カテゴリー・ポジション整理 */
(function(){
 const CATEGORY_ORDER=['U-12','U-11','U-10','U-9','未設定'];
 function categoryOf(value){
  const v=String(value||'').trim().toUpperCase().replace(/\s/g,'');
  if(['U-12','U12','6年','6年生','小学6年'].includes(v))return 'U-12';
  if(['U-11','U11','5年','5年生','小学5年'].includes(v))return 'U-11';
  if(['U-10','U10','4年','4年生','小学4年'].includes(v))return 'U-10';
  if(['U-9','U9','3年','3年生','小学3年'].includes(v))return 'U-9';
  return '未設定';
 }
 function positionOf(value){
  const v=String(value||'').trim().toUpperCase().replace(/[・／/\s]/g,'');
  if(!v)return '';
  const gp=/GP|GK|GOALKEEPER|ゴールキーパー/.test(v);
  const fp=/FP|FW|MF|DF|FIELDPLAYER|フィールド/.test(v);
  if(gp&&fp)return 'FP・GP';
  if(gp)return 'GP';
  return 'FP';
 }
 function setCategoryFilter(value){
  const el=document.getElementById('playerCategoryFilter');
  if(!el)return;
  el.value=value==='すべて'?'':value;
  if(typeof resetPlayerPage==='function')resetPlayerPage();
 }
 window.setPlayerCategoryFilter=setCategoryFilter;
 function renderSummary(){
  const box=document.getElementById('playerCategorySummary');
  if(!box||!Array.isArray(players))return;
  const status=document.getElementById('statusFilter')?.value||'';
  const base=players.filter(p=>!status||p.status===status);
  const counts=Object.fromEntries(CATEGORY_ORDER.map(c=>[c,0]));
  base.forEach(p=>counts[categoryOf(p.grade)]++);
  const selected=document.getElementById('playerCategoryFilter')?.value||'';
  box.innerHTML=`<button class="player-category-chip ${!selected?'is-active':''}" onclick="setPlayerCategoryFilter('すべて')">すべて<span>${base.length}</span></button>`+
   CATEGORY_ORDER.map(c=>`<button class="player-category-chip ${selected===c?'is-active':''}" onclick="setPlayerCategoryFilter('${c}')">${c}<span>${counts[c]}</span></button>`).join('');
 }
 window.renderPlayers=function(){
  const q=document.getElementById('playerSearch')?.value.trim().toLowerCase()||'';
  const status=document.getElementById('statusFilter')?.value||'';
  const category=document.getElementById('playerCategoryFilter')?.value||'';
  const position=document.getElementById('playerPositionFilter')?.value||'';
  let list=players.filter(p=>{
   const cat=categoryOf(p.grade),pos=positionOf(p.position);
   return (!status||p.status===status)&&(!category||cat===category)&&(!position||pos===position)&&
    (!q||`${p.name} ${cat} ${pos} ${p.number||''}`.toLowerCase().includes(q));
  });
  list.sort((a,b)=>CATEGORY_ORDER.indexOf(categoryOf(a.grade))-CATEGORY_ORDER.indexOf(categoryOf(b.grade))||String(a.name).localeCompare(String(b.name),'ja'));
  const pages=Math.max(1,Math.ceil(list.length/PLAYER_PAGE_SIZE));if(playerPage>pages)playerPage=pages;
  const start=(playerPage-1)*PLAYER_PAGE_SIZE,shown=list.slice(start,start+PLAYER_PAGE_SIZE);
  let current='';
  const rows=[];
  shown.forEach(p=>{
   const cat=categoryOf(p.grade),pos=positionOf(p.position)||'未設定',t=totals(p);
   if(cat!==current){current=cat;const count=list.filter(x=>categoryOf(x.grade)===cat).length;rows.push(`<tr class="player-category-row"><td colspan="9">${esc(cat)}<span class="category-count">${count}名</span></td></tr>`)}
   rows.push(`<tr><td><button class="player-link" onclick="openPlayerDetail('${p.id}')"><div class="player-name">${p.photo_url?`<img class="avatar" src="${esc(p.photo_url)}" alt="" loading="lazy" decoding="async">`:`<span class="avatar"></span>`}<span><b>${esc(p.name)}</b>${p.number?` #${esc(p.number)}`:''}</span></div></button></td><td><span class="player-category-badge ${cat==='未設定'?'is-unset':''}">${esc(cat)}</span></td><td><span class="player-position-badge">${esc(pos)}</span></td><td>${esc(p.status)}</td><td>${t.apps}</td><td>${t.goals}</td><td>${t.assists}</td><td>${t.minutes}</td><td><button class="light" onclick="openPlayerDetail('${p.id}')">詳細</button>${isStaff()?` <button class="light" onclick="openPlayerModal('${p.id}')">編集</button> <button class="danger" onclick="deletePlayer('${p.id}')">削除</button>`:''}</td></tr>`);
  });
  document.getElementById('playerBody').innerHTML=rows.join('')||'<tr><td colspan="9" class="muted">該当する選手がいません。</td></tr>';
  const pager=document.getElementById('playerPager');
  if(pager)pager.innerHTML=list.length?`<div class="pager-info">${list.length}人中 ${start+1}〜${Math.min(start+PLAYER_PAGE_SIZE,list.length)}人を表示</div><div class="pager-buttons"><button class="light" onclick="changePlayerPage(${playerPage-1})" ${playerPage<=1?'disabled':''}>‹ 前へ</button><span>${playerPage} / ${pages}</span><button class="light" onclick="changePlayerPage(${playerPage+1})" ${playerPage>=pages?'disabled':''}>次へ ›</button></div>`:'';
  renderSummary();
 };
 const originalOpen=window.openPlayerModal;
 if(typeof originalOpen==='function')window.openPlayerModal=function(id=''){
  originalOpen(id);
  const p=players.find(x=>String(x.id)===String(id));
  const cat=document.getElementById('editGrade'),pos=document.getElementById('editPosition');
  if(cat)cat.value=p?categoryOf(p.grade)==='未設定'?'':categoryOf(p.grade):'';
  if(pos)pos.value=p?positionOf(p.position):'';
 };
 document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{renderSummary();if(typeof renderPlayers==='function')renderPlayers()},150)});
})();
