/* Ver.20.4 試合カテゴリー正式対応版 */
(function(){
 const CATS=['U-12','U-11','U-10','U-9'];
 function cat(v){return CATS.includes(String(v||'').trim())?String(v).trim():'カテゴリー未設定'}
 function playerCat(v){const s=String(v||'').trim().toUpperCase().replace(/\s/g,'');if(['U-12','U12','6年','6年生','小学6年'].includes(s))return'U-12';if(['U-11','U11','5年','5年生','小学5年'].includes(s))return'U-11';if(['U-10','U10','4年','4年生','小学4年'].includes(s))return'U-10';if(['U-9','U9','3年','3年生','小学3年'].includes(s))return'U-9';return'カテゴリー未設定'}
 function options(all=true){return (all?'<option value="">すべて</option>':'<option value="">選択してください</option>')+CATS.map(x=>`<option value="${x}">${x}</option>`).join('')+(all?'<option value="カテゴリー未設定">カテゴリー未設定</option>':'')}
 function installUI(){
  const grid=document.querySelector('#entryForm .grid');
  if(grid&&!document.getElementById('matchCategory')){const d=document.createElement('div');d.className='match-category-field';d.innerHTML='<label>カテゴリー <b class="required-mark">必須</b></label><select id="matchCategory" onchange="onMatchCategoryChange()">'+options(false)+'</select>';grid.prepend(d)}
  const toolbar=document.querySelector('#matches .toolbar');
  if(toolbar&&!document.getElementById('matchCategoryFilter')){const d=document.createElement('div');d.className='field';d.innerHTML='<label>カテゴリー</label><select id="matchCategoryFilter" onchange="renderMatches()">'+options(true)+'</select>';toolbar.prepend(d)}
  const at=document.querySelector('#analytics .toolbar');
  if(at&&!document.getElementById('analysisCategory')){const d=document.createElement('div');d.className='field';d.innerHTML='<label>カテゴリー</label><select id="analysisCategory" onchange="renderAnalytics()">'+options(true)+'</select>';at.prepend(d)}
 }
 window.onMatchCategoryChange=function(){renderRecordInputs();if(typeof renderMatchEvaluationInputs==='function')renderMatchEvaluationInputs()};
 const oldRefresh=window.refreshFilters;
 window.refreshFilters=function(){if(oldRefresh)oldRefresh();installUI()};
 window.renderMatches=function(){installUI();const season=$('matchSeason')?.value||'',q=$('matchSearch')?.value.trim().toLowerCase()||'',category=$('matchCategoryFilter')?.value||'';const list=matches.filter(m=>(!season||String(m.season)===season)&&(!category||cat(m.category)===category)&&(!q||`${m.competition} ${m.opponent} ${m.venue} ${cat(m.category)}`.toLowerCase().includes(q)));$('matchList').innerHTML=list.map(m=>{const count=records.filter(r=>String(r.match_id)===String(m.id)&&r.played).length;return `<div class="card match-category-card"><div class="match-row"><div><b>${esc(m.match_date)}</b> <span class="match-category-badge ${cat(m.category)==='カテゴリー未設定'?'is-unset':''}">${esc(cat(m.category))}</span> ${esc(m.competition||'通常試合')}<div class="muted">${esc(m.venue||'')} / 出場 ${count}名</div></div><div><span class="score ${resultClass(m)}">${m.goals_for||0}-${m.goals_against||0}</span> ${esc(m.opponent||'')} ${isStaff()?`<button class="light" onclick="openMatchEdit('${m.id}')">編集</button> <button class="danger" onclick="deleteMatch('${m.id}')">削除</button>`:''}</div></div></div>`}).join('')||'<p class="muted">該当する試合がありません。</p>'};
 window.renderRecordInputs=function(){
  if(!isStaff())return;
  installUI();
  const chosen=$('matchCategory')?.value||'';
  const existing=new Map(records.filter(r=>String(r.match_id)===String(editingMatchId)).map(r=>[String(r.player_id),r]));
  const chosenIndex=CATS.indexOf(chosen);
  const includeStepUp=document.getElementById('includeStepUpPlayers')?.checked||false;
  const eligible=p=>{
   const pc=playerCat(p.grade),pi=CATS.indexOf(pc);
   if(existing.has(String(p.id)))return true;
   if(!chosen)return false;
   if(pc===chosen)return true;
   return includeStepUp&&chosenIndex>=0&&pi>chosenIndex;
  };
  const list=players.filter(p=>(p.status==='現役'||existing.has(String(p.id)))&&eligible(p)).sort((a,b)=>{
   const ac=playerCat(a.grade),bc=playerCat(b.grade);
   const ar=ac===chosen?0:1,br=bc===chosen?0:1;
   return ar-br||CATS.indexOf(ac)-CATS.indexOf(bc)||String(a.name).localeCompare(String(b.name),'ja');
  });
  const sameCount=list.filter(p=>playerCat(p.grade)===chosen).length;
  const stepCount=list.filter(p=>playerCat(p.grade)!==chosen&&!existing.has(String(p.id))).length;
  const controls=chosen?`<div class="stepup-controls"><label class="stepup-toggle"><input id="includeStepUpPlayers" type="checkbox" ${includeStepUp?'checked':''} onchange="renderRecordInputs();if(typeof renderMatchEvaluationInputs==='function')renderMatchEvaluationInputs()"><span>下カテゴリーのステップアップ選手も表示</span></label><div class="stepup-help"><b>${esc(chosen)}</b> 所属 ${sameCount}名${includeStepUp?` ＋ ステップアップ候補 ${stepCount}名`:''}</div></div>`:'';
  $('recordInputs').innerHTML=`<div class="category-entry-guide">${chosen?`試合カテゴリーは <b>${esc(chosen)}</b> です。選手の所属カテゴリーは変更されません。`:'先にカテゴリーを選択してください。'}</div>${controls}<div class="player-entry muted"><div>選手</div><div>出場</div><div>時間</div><div>得点</div><div class="extra">アシスト</div><div class="extra">黄</div><div class="extra">赤</div><div class="extra">MVP</div></div>`+(chosen?list.map(p=>{
   const r=existing.get(String(p.id))||{},pc=playerCat(p.grade),isStep=pc!==chosen;
   return `<div class="player-entry ${isStep?'is-stepup-player':''}" data-player="${p.id}"><div><b>${esc(p.name)}</b><div class="muted"><span class="player-origin-category">所属 ${esc(pc)}</span> ${isStep?`<span class="stepup-badge">⬆ ${esc(chosen)}へステップアップ</span>`:''} ${esc(p.position||'')}</div></div><div><input class="played" type="checkbox" onchange="renderMatchEvaluationInputs()" ${r.played?'checked':''}></div><div><input class="minutes" type="number" min="0" value="${r.minutes||0}"></div><div><input class="goals" type="number" min="0" value="${r.goals||0}"></div><div class="extra"><input class="assists" type="number" min="0" value="${r.assists||0}"></div><div class="extra"><input class="yellow" type="number" min="0" value="${r.yellow||0}"></div><div class="extra"><input class="red" type="number" min="0" value="${r.red||0}"></div><div class="extra"><input class="mvp" type="checkbox" ${r.mvp?'checked':''}></div></div>`
  }).join(''):'')
 };
 async function saveMatchWithRecords(){if(!isStaff())return;const date=$('matchDate').value,opp=$('opponent').value.trim(),category=$('matchCategory')?.value||'';if(!date||!opp||!category){showMessage('カテゴリー・試合日・対戦相手を入力してください。');return}const btn=$('saveMatchBtn');btn.disabled=true;const match={match_date:date,category,competition:$('competition').value.trim(),opponent:opp,venue:$('venue').value.trim(),goals_for:+$('goalsFor').value||0,goals_against:+$('goalsAgainst').value||0,season:+date.slice(0,4),memo:$('matchMemo').value.trim(),created_by:session.user.id};let matchId=editingMatchId;if(matchId){const up=await sb.from('matches').update(match).eq('id',matchId);if(up.error){showMessage(up.error.message);btn.disabled=false;return}const del=await sb.from('records').delete().eq('match_id',matchId);if(del.error){showMessage('既存選手記録の削除エラー：'+del.error.message);btn.disabled=false;return}}else{const ins=await sb.from('matches').insert(match).select().single();if(ins.error){showMessage(ins.error.message);btn.disabled=false;return}matchId=ins.data.id}const rows=[...document.querySelectorAll('.player-entry[data-player]')].map(el=>({match_id:matchId,player_id:el.dataset.player,played:el.querySelector('.played').checked,minutes:+el.querySelector('.minutes').value||0,goals:+el.querySelector('.goals').value||0,assists:+el.querySelector('.assists').value||0,yellow:+el.querySelector('.yellow').value||0,red:+el.querySelector('.red').value||0,mvp:el.querySelector('.mvp').checked,created_by:session.user.id})).filter(x=>x.played||x.goals||x.assists||x.yellow||x.red||x.mvp);if(rows.length){const rr=await sb.from('records').insert(rows);if(rr.error){showMessage('試合は保存しましたが選手記録でエラー：'+rr.error.message);btn.disabled=false;return}}
 const evalRows=[...document.querySelectorAll('.match-eval-input[data-player]')].map(el=>({
  player_id:String(el.dataset.player),match_id:String(matchId),
  attack:+el.querySelector('.eval-attack').value||3,
  defense:+el.querySelector('.eval-defense').value||3,
  passing:+el.querySelector('.eval-passing').value||3,
  dribbling:+el.querySelector('.eval-dribbling').value||3,
  shooting:+el.querySelector('.eval-shooting').value||3,
  decision_making:+el.querySelector('.eval-decision').value||3,
  work_rate:+el.querySelector('.eval-work').value||3,
  communication:+el.querySelector('.eval-communication').value||3,
  good_points:el.querySelector('.eval-good').value.trim(),
  improvement_points:el.querySelector('.eval-improve').value.trim(),
  next_goal:el.querySelector('.eval-goal').value.trim(),
  created_by:session.user.id,updated_at:new Date().toISOString()
 }));
 if(evalRows.length){
  const er=await sb.from('player_match_evaluations').upsert(evalRows,{onConflict:'player_id,match_id'});
  if(er.error){showMessage('試合は保存しましたが評価保存でエラー：'+er.error.message);btn.disabled=false;return}
 }
 detailCache.clear();
 showMessage(editingMatchId?'試合・選手記録・評価を更新しました。':'試合・選手記録・評価を保存しました。','ok');cancelMatchEdit(false);btn.disabled=false;await loadAll();showPage('matches')}
 window.openMatchEdit=function(id){if(!isStaff())return;installUI();const m=matches.find(x=>String(x.id)===String(id));if(!m)return;editingMatchId=id;$('matchCategory').value=CATS.includes(m.category)?m.category:'';$('matchDate').value=m.match_date||'';$('competition').value=m.competition||'';$('opponent').value=m.opponent||'';$('venue').value=m.venue||'';$('goalsFor').value=m.goals_for||0;$('goalsAgainst').value=m.goals_against||0;$('matchMemo').value=m.memo||'';$('saveMatchBtn').textContent='試合を更新';$('cancelMatchEditBtn').classList.remove('hidden');renderRecordInputs();showPage('entry');loadMatchEvaluationsForEdit(id)};
 const oldAnalysis=window.analysisMatches;
 window.analysisMatches=function(){const base=oldAnalysis?oldAnalysis():matches,category=$('analysisCategory')?.value||'';return category?base.filter(m=>cat(m.category)===category):base};
 document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{installUI();renderMatches();renderRecordInputs()},250));
})();
