/* Ver.22.8 試合会場モード完成版 */
(function(){
'use strict';
const KEY='furugen_live_match_v228';
const ARCHIVE_KEY='furugen_live_match_archive_v228';
const PAGE='live24', MODAL='live24Modal';
const CATS=['U-12','U-11','U-10','U-9'];
let S=null,timer=null;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now=()=>Date.now();
const today=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`};
const isCoach=()=>{try{
  if(typeof isStaff==='function' && isStaff()) return true;
  if(window.currentUserRole && ['admin','coach'].includes(String(window.currentUserRole).toLowerCase())) return true;
  const bodyText=(document.body?.innerText||'');
  if(bodyText.includes('権限：admin') || bodyText.includes('権限: admin') || bodyText.includes('（管理者）')) return true;
  return false;
}catch(_){return false}};
const msg=(t,type='warn')=>{try{typeof showMessage==='function'?showMessage(t,type):alert(t)}catch(_){alert(t)}};

function normCat(v){
  const s=String(v||'').toUpperCase().replace(/\s/g,'');
  if(['U-12','U12','6年','6年生','小学6年'].includes(s))return'U-12';
  if(['U-11','U11','5年','5年生','小学5年'].includes(s))return'U-11';
  if(['U-10','U10','4年','4年生','小学4年'].includes(s))return'U-10';
  if(['U-9','U9','3年','3年生','小学3年'].includes(s))return'U-9';
  return'未設定';
}
function roster(){
  try{
    const src=(typeof players!=='undefined'&&Array.isArray(players))?players:(Array.isArray(window.players)?window.players:[]);
    return src.map((p,i)=>({
      id:String(p.id||p.player_id||p.uuid||i),
      name:String(p.name||p.player_name||p.full_name||'').trim(),
      category:normCat(p.grade||p.category||p.age_category||p.school_year),
      position:String(p.position||p.positions||p.role||'未設定'),
      photo:String(p.photo_url||p.image_url||p.avatar_url||p.photo||p.image||''),
      status:String(p.status||'現役')
    })).filter(p=>p.name&&['現役','active','在籍','所属',''].includes(p.status));
  }catch(e){console.error(e);return[]}
}
function eligible(cat){
  const ci=CATS.indexOf(cat);
  return roster().filter(p=>{const pi=CATS.indexOf(p.category);return pi===ci||pi>ci})
    .sort((a,b)=>CATS.indexOf(a.category)-CATS.indexOf(b.category)||a.name.localeCompare(b.name,'ja'));
}
function load(){try{S=JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){S=null}}
function save(){try{S?localStorage.setItem(KEY,JSON.stringify(S)):localStorage.removeItem(KEY)}catch(e){console.error(e)}}
function archive(){
  if(!S)return;
  try{
    const a=JSON.parse(localStorage.getItem(ARCHIVE_KEY)||'[]');
    a.unshift({...JSON.parse(JSON.stringify(S)),archivedAt:new Date().toISOString()});
    localStorage.setItem(ARCHIVE_KEY,JSON.stringify(a.slice(0,50)));
  }catch(e){console.error(e)}
}
function snap(label){
  if(!S)return;
  const c=JSON.parse(JSON.stringify(S)); delete c.history;
  S.history=Array.isArray(S.history)?S.history:[];
  S.history.push({label:label||'操作',state:c});
  if(S.history.length>30)S.history.shift();
}
function undo(){
  if(!S||!Array.isArray(S.history)||!S.history.length)return msg('取り消せる操作がありません。');
  const h=S.history.pop(),keep=S.history; S=h.state; S.history=keep; save(); render();
  msg(`「${h.label}」を取り消しました。`,'ok');
}
function elapsed(){return !S?0:Number(S.elapsedMs||0)+(S.running?Math.max(0,now()-Number(S.runStartedAt||now())):0)}
function fmt(ms){const n=Math.max(0,Math.floor(ms/1000));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function mins(ms){return Math.max(0,Math.round(Number(ms||0)/60000))}
function ensureFloatingButton(){
  let f=document.getElementById('live24Floating');
  if(!f){
    f=document.createElement('button');
    f.id='live24Floating';
    f.className='live24-floating';
    f.textContent='🏟 試合会場モード';
    f.onclick=open;
    document.body.appendChild(f);
  }
}
function ensure(){
  ensureFloatingButton();
  let nav=$('live24Nav');
  if(!nav){
    nav=document.createElement('button'); nav.id='live24Nav'; nav.textContent='🏟 試合会場モード';
    nav.onclick=open;
    const n=document.querySelector('nav');
    if(n){const login=[...n.querySelectorAll('button')].find(b=>b.textContent.includes('コーチログイン'));n.insertBefore(nav,login||null)}
  }
  nav?.classList.remove('coach-only-hidden');
  let p=$(PAGE);
  if(!p){p=document.createElement('section');p.id=PAGE;p.className='page';document.querySelector('main')?.appendChild(p)}
  if(!$(MODAL)){const m=document.createElement('div');m.id=MODAL;m.className='live24-modal hidden';document.body.appendChild(m)}
}
function open(){
  ensure();
  if(!isCoach())return msg('試合会場モードはコーチログイン後に利用できます。');
  if(typeof showPage==='function')showPage(PAGE);
  render();
}
function progress(step){
  return `<div class="live24-progress">${['試合情報','スタメン','開始前確認','ライブ記録','成績保存'].map((x,i)=>`<span class="${i<=step?'on':''}">${i+1}. ${x}</span>`).join('')}</div>`;
}
function avatar(p){return p.photo?`<img src="${esc(p.photo)}" alt="">`:`<span class="live24-avatar">👤</span>`}
function setup(){
  return `<div class="live24-card">
  <header><div><small>🏟 MATCH DAY LIVE</small><h2>Ver.22.8 試合会場モード完成版</h2></div><b>${today()}</b></header>
  <div class="live24-body">${progress(0)}
    <div class="live24-grid">
      <label>カテゴリー<select id="v24cat">${CATS.map(x=>`<option>${x}</option>`).join('')}</select></label>
      <label>対戦相手<input id="v24opp" placeholder="例：MOSTRO"></label>
      <label>大会名<input id="v24comp" placeholder="例：TRM"></label>
      <label>会場<input id="v24venue" placeholder="例：古堅南小学校"></label>
      <label>人数制<select id="v24count"><option value="8">8人制</option><option value="11">11人制</option><option value="custom">自由人数</option></select></label>
      <label id="v24customCountWrap" class="hidden">人数<input id="v24customCount" type="number" min="1" max="18" value="8"></label>
      <label>試合時間<select id="v24format"><option value="single-15">15分1本</option><option value="single-20" selected>20分1本</option><option value="single-25">25分1本</option><option value="half-15">15分ハーフ</option><option value="half-20">20分ハーフ</option><option value="custom-single">自由入力・1本</option><option value="custom-half">自由入力・前後半</option></select></label>
      <label id="v24customMinutesWrap" class="hidden">1本／1ハーフ（分）<input id="v24minutes" type="number" min="1" max="90" value="20"></label>
    </div>
    <label class="live24-checkline"><input id="v24auto" type="checkbox" checked> 試合終了時、通常の試合入力へ転記し選手成績へ反映する</label>
    <div class="live24-feature-list"><span>⚡ ワンタップ入力</span><span>⚽ 得点・アシスト</span><span>🔄 交代</span><span>🟨 警告</span><span>⏱ 出場時間自動集計</span></div>
    <div class="live24-actions"><button type="button" class="primary" data-v24="select">スタメン選択へ</button>${S?'<button type="button" class="danger" data-v24="reset">途中記録を削除</button>':''}</div>
  </div></div>`;
}
function count(){const v=$('v24count')?.value||'8';return v==='custom'?Math.max(1,Math.min(18,Number($('v24customCount')?.value||8))):Number(v)}
function format(){const v=$('v24format')?.value||'single-20',c=Math.max(1,Math.min(90,Number($('v24minutes')?.value||20)));const m={'single-15':['single',15,'15分1本'],'single-20':['single',20,'20分1本'],'single-25':['single',25,'25分1本'],'half-15':['half',15,'15分ハーフ'],'half-20':['half',20,'20分ハーフ'],'custom-single':['single',c,`${c}分1本`],'custom-half':['half',c,`${c}分ハーフ`]};return m[v]||m['single-20']}
function rememberSetup(){
  try{
    localStorage.setItem('furugen_live_setup_v2281', JSON.stringify({
      category:$('v24cat')?.value||'U-12',
      opponent:$('v24opp')?.value||'',
      competition:$('v24comp')?.value||'',
      venue:$('v24venue')?.value||'',
      count:$('v24count')?.value||'8',
      format:$('v24format')?.value||'single-20',
      auto:!!$('v24auto')?.checked
    }));
  }catch(_){}
}
function restoreSetup(){
  try{
    const d=JSON.parse(localStorage.getItem('furugen_live_setup_v2281')||'null');
    if(!d)return;
    setTimeout(()=>{
      if($('v24cat'))$('v24cat').value=d.category||'U-12';
      if($('v24opp'))$('v24opp').value=d.opponent||'';
      if($('v24comp'))$('v24comp').value=d.competition||'';
      if($('v24venue'))$('v24venue').value=d.venue||'';
      if($('v24count'))$('v24count').value=d.count||'8';
      if($('v24format'))$('v24format').value=d.format||'single-20';
      if($('v24auto'))$('v24auto').checked=d.auto!==false;
    },0);
  }catch(_){}
}
function beginSelection(){
  rememberSetup();
  const cat=$('v24cat')?.value,opp=$('v24opp')?.value.trim(),comp=$('v24comp')?.value.trim(),venue=$('v24venue')?.value.trim();
  if(!opp)return msg('対戦相手を入力してください。');
  const [type,periodMinutes,label]=format(),starterCount=count(),list=eligible(cat);
  if(list.length<starterCount)return msg(`候補選手が${list.length}名です。スタメン${starterCount}名を選べません。`);
  S={version:'22.8',phase:'selection',date:today(),category:cat,opponent:opp,competition:comp,venue,matchType:type,periodMinutes,formatLabel:label,starterCount,autoSave:!!$('v24auto')?.checked,period:type==='half'?'前半':'1本',periodNo:1,started:false,running:false,runStartedAt:null,elapsedMs:0,gf:0,ga:0,lineup:{},stats:{},events:[],history:[],memo:'',shots:0,finalized:false};
  list.forEach(p=>{S.lineup[p.id]=false;S.stats[p.id]={...p,played:false,activeMs:0,onAt:null,goals:0,assists:0,shots:0,yellow:0,red:0}});
  save();render();
}
function selection(){
  const ids=Object.keys(S.stats),chosen=ids.filter(id=>S.lineup[id]);
  return `<div class="live24-card"><header><div><small>STEP 2 / スタメン選択</small><h2>${esc(S.category)} vs ${esc(S.opponent)}</h2></div><b>${chosen.length}/${S.starterCount}名</b></header>
  <div class="live24-body">${progress(1)}
  <div class="live24-select-grid">${ids.map(id=>{const p=S.stats[id],on=S.lineup[id];return `<button type="button" class="live24-select-player ${on?'selected':''}" data-v24player="${esc(id)}">${avatar(p)}<span><b>${esc(p.name)}</b><small>${esc(p.category)} / ${esc(p.position)}</small></span><em>${on?'✓ 選択':'未選択'}</em></button>`}).join('')}</div>
  <div class="live24-sticky"><strong>選択 ${chosen.length} / ${S.starterCount}名</strong><div class="live24-actions"><button type="button" data-v24="back">戻る</button><button type="button" class="primary" data-v24="confirm" ${chosen.length===S.starterCount?'':'disabled'}>開始前確認へ</button></div></div></div></div>`;
}
function line(id,kind){
  const p=S.stats[id], liveMin=mins((p.activeMs||0)+(p.onAt?now()-p.onAt:0));
  return `<div class="live24-player ${kind}">${avatar(p)}<span><b>${esc(p.name)}</b><small>${esc(p.category)} / ${esc(p.position)}${kind==='live'?` ・ ${liveMin}分`:''}</small></span>${kind==='live'?`<button type="button" data-v24sub="${esc(id)}">🔄 交代</button>`:''}</div>`;
}
function ready(){
  const on=Object.keys(S.lineup).filter(id=>S.lineup[id]),off=Object.keys(S.lineup).filter(id=>!S.lineup[id]);
  return `<div class="live24-card"><header><div><small>STEP 3 / 試合開始前確認</small><h2>${esc(S.category)} vs ${esc(S.opponent)}</h2></div><b>${esc(S.formatLabel)}</b></header>
  <div class="live24-body">${progress(2)}<div class="live24-ready-banner">「▶ 試合開始」を押した瞬間から、タイマーと出場時間を同時に計測します。</div>
  <div class="live24-summary"><div>大会<b>${esc(S.competition||'未入力')}</b></div><div>会場<b>${esc(S.venue||'未入力')}</b></div><div>スタメン<b>${S.starterCount}名</b></div><div>形式<b>${esc(S.formatLabel)}</b></div></div>
  <div class="live24-rosters"><section><h3>スタメン</h3>${on.map(id=>line(id,'starter')).join('')}</section><section><h3>ベンチ</h3>${off.map(id=>line(id,'bench')).join('')||'<p>ベンチなし</p>'}</section></div>
  <div class="live24-actions center"><button type="button" data-v24="edit">スタメンを変更</button><button type="button" class="kickoff" data-v24="kickoff">▶ ${S.period==='後半'?'後半開始':'試合開始'}</button><button type="button" class="danger" data-v24="reset">試合を取消</button></div></div></div>`;
}
function live(){
  const on=Object.keys(S.lineup).filter(id=>S.lineup[id]),off=Object.keys(S.lineup).filter(id=>!S.lineup[id]),e=elapsed(),limit=S.periodMinutes*60000,over=e>=limit;
  return `<div class="live24-card live"><header><div><small>🔴 LIVE MATCH</small><h2>${esc(S.category)} vs ${esc(S.opponent)}</h2></div><b>${esc(S.period)} / ${S.running?'進行中':'一時停止'}</b></header>
  <div class="live24-body">${progress(3)}${over?'<div class="live24-warning live24-timer-over">設定時間を超えています。試合終了または前半終了を押してください。</div>':''}
  <div class="live24-score"><div><b>古堅南FC</b><strong>${S.gf}</strong></div><div><span>${fmt(e)}</span><small>目安 ${fmt(limit)}</small></div><div><b>${esc(S.opponent)}</b><strong>${S.ga}</strong></div></div>
  <div class="live24-controls"><button type="button" data-v24="toggle">${S.running?'⏸ 一時停止':'▶ 再開'}</button>${S.matchType==='half'&&S.period==='前半'?'<button type="button" data-v24="halftime">⏹ 前半終了</button>':''}<button type="button" class="danger" data-v24="finish">■ 試合終了</button></div>
  <div class="live24-event-buttons">
    <button type="button" class="goal" data-v24event="goal">⚽<span>得点</span></button>
    <button type="button" class="assist" data-v24event="assist">🎯<span>アシスト</span></button>
    <button type="button" class="shot" data-v24event="shot">💥<span>シュート</span></button>
    <button type="button" class="opp" data-v24event="oppgoal">🥅<span>相手得点</span></button>
    <button type="button" class="yellow" data-v24event="yellow">🟨<span>警告</span></button>
    <button type="button" class="red" data-v24event="red">🟥<span>退場</span></button>
    <button type="button" class="memo" data-v24="memo">📝<span>メモ</span></button>
    <button type="button" class="undo" data-v24="undo">↩️<span>取り消し</span></button>
  </div>
  <div class="live24-rosters live-grid"><section><h3>出場中 ${on.length}名</h3>${on.map(id=>line(id,'live')).join('')}</section><section><h3>ベンチ ${off.length}名</h3>${off.map(id=>line(id,'bench')).join('')||'<p>ベンチなし</p>'}</section><section class="timeline"><h3>記録タイムライン</h3>${S.events.map(x=>`<div><b>${esc(x.time)}</b><span>${esc(x.text)}</span></div>`).join('')||'<p>まだ記録はありません。</p>'}</section></div></div></div>`;
}
function playerRows(){
  return Object.values(S.stats).filter(p=>p.played||p.goals||p.assists||p.yellow||p.red).sort((a,b)=>b.activeMs-a.activeMs).map(p=>
    `<tr><td>${esc(p.name)}</td><td>${mins(p.activeMs)}分</td><td>${p.goals||0}</td><td>${p.assists||0}</td><td>${p.yellow||0}</td><td>${p.red||0}</td></tr>`
  ).join('');
}
function saveView(){
  return `<div class="live24-card"><header><div><small>STEP 5 / 成績保存</small><h2>試合記録の確認</h2></div><b>${S.gf} - ${S.ga}</b></header>
  <div class="live24-body">${progress(4)}
  <div class="live24-save-result"><h3>古堅南FC ${S.gf} - ${S.ga} ${esc(S.opponent)}</h3><p>${esc(S.date)} / ${esc(S.category)} / ${esc(S.formatLabel)}</p><p>記録 ${S.events.length}件・出場 ${Object.values(S.stats).filter(x=>x.played).length}名・シュート ${S.shots||0}本</p></div>
  <div class="live24-result-table-wrap"><table class="live24-result-table"><thead><tr><th>選手</th><th>出場</th><th>得点</th><th>アシスト</th><th>警告</th><th>退場</th></tr></thead><tbody>${playerRows()||'<tr><td colspan="6">記録なし</td></tr>'}</tbody></table></div>
  <div class="live24-actions center"><button type="button" class="primary" data-v24="transfer">成績へ反映して保存</button><button type="button" data-v24="resume-finished">ライブ画面へ戻る</button><button type="button" class="danger" data-v24="reset">記録を破棄</button></div></div></div>`;
}
function render(){
  ensure();load();const p=$(PAGE);if(!p)return;
  if(!S){p.innerHTML=setup();restoreSetup();}
  else if(S.phase==='selection')p.innerHTML=selection();
  else if(S.phase==='ready')p.innerHTML=ready();
  else if(S.phase==='live')p.innerHTML=live();
  else if(S.phase==='save')p.innerHTML=saveView();
  else p.innerHTML=setup();
}
function togglePlayer(id){if(!S||S.phase!=='selection'||!(id in S.lineup))return;const n=Object.values(S.lineup).filter(Boolean).length;if(!S.lineup[id]&&n>=S.starterCount)return msg(`スタメンは${S.starterCount}名までです。`);S.lineup[id]=!S.lineup[id];save();render()}
function confirmLineup(){const n=Object.values(S.lineup).filter(Boolean).length;if(n!==S.starterCount)return msg(`スタメンを${S.starterCount}名選択してください。`);Object.keys(S.stats).forEach(id=>S.stats[id].played=!!S.lineup[id]);S.phase='ready';save();render();msg('スタメンを確定しました。','ok')}
function kickoff(){if(!S||S.phase!=='ready')return;S.phase='live';S.started=true;S.running=true;S.runStartedAt=now();Object.keys(S.lineup).forEach(id=>{if(S.lineup[id]){S.stats[id].played=true;S.stats[id].onAt=now()}});S.events.unshift({time:'00:00',text:`${S.period}開始`});save();render()}
function pause(){if(!S?.running)return;const n=now();S.elapsedMs=elapsed();S.running=false;S.runStartedAt=null;Object.keys(S.lineup).forEach(id=>{const p=S.stats[id];if(S.lineup[id]&&p.onAt){p.activeMs+=n-p.onAt;p.onAt=null}});save()}
function resume(){if(!S||S.phase!=='live'||S.running)return;S.running=true;S.runStartedAt=now();Object.keys(S.lineup).forEach(id=>{if(S.lineup[id])S.stats[id].onAt=now()});save();render()}
function halftime(){if(!S||S.matchType!=='half'||S.period!=='前半')return;snap('前半終了');pause();S.events.unshift({time:fmt(S.elapsedMs),text:'前半終了'});S.period='後半';S.periodNo=2;S.phase='ready';S.elapsedMs=0;save();render();msg('前半終了です。後半開始までタイマーは止まっています。','ok')}
function modal(content){const m=$(MODAL);m.innerHTML=`<div class="live24-modal-box">${content}</div>`;m.classList.remove('hidden')}
function close(){ $(MODAL)?.classList.add('hidden') }
function pick(title,ids,cb,allowNone=false){
  modal(`<div class="live24-modal-head"><h2>${esc(title)}</h2><button type="button" data-v24="close">閉じる</button></div><div class="live24-picks">${ids.map(id=>`<button type="button" data-v24pick="${esc(id)}">${avatar(S.stats[id])}<span><b>${esc(S.stats[id].name)}</b><small>${esc(S.stats[id].category)} / ${esc(S.stats[id].position)}</small></span></button>`).join('')||'<p>対象選手がいません。</p>'}${allowNone?'<button type="button" class="live24-none" data-v24pick="__none__">アシストなし</button>':''}</div>`);
  $(MODAL)._cb=cb;
}
function addEvent(type){
  if(!S||S.phase!=='live')return;
  const t=fmt(elapsed());
  if(type==='oppgoal'){snap('相手得点');S.ga++;S.events.unshift({time:t,text:'相手チーム得点'});save();render();return}
  const ids=Object.keys(S.lineup).filter(id=>S.lineup[id]),labels={goal:'得点',assist:'アシスト',shot:'シュート',yellow:'警告',red:'退場'};
  pick(`${labels[type]}した選手`,ids,id=>{
    if(id==='__none__')return;
    snap(`${S.stats[id].name} ${labels[type]}`);
    const p=S.stats[id];
    if(type==='goal'){
      p.goals++;S.gf++;
      const assistCandidates=ids.filter(x=>x!==id);
      pick('アシストした選手（いない場合は「アシストなし」）',assistCandidates,aid=>{
        let text=`${p.name}：得点`;
        if(aid!=='__none__'&&S.stats[aid]){S.stats[aid].assists++;text+=`（アシスト ${S.stats[aid].name}）`}
        S.events.unshift({time:fmt(elapsed()),text});save();render();
      },true);
      return;
    }else if(type==='assist')p.assists++;
    else if(type==='shot'){p.shots=(p.shots||0)+1;S.shots=(S.shots||0)+1}
    else if(type==='yellow')p.yellow++;
    else if(type==='red'){p.red++;if(p.onAt){p.activeMs+=now()-p.onAt;p.onAt=null}S.lineup[id]=false}
    S.events.unshift({time:fmt(elapsed()),text:`${p.name}：${labels[type]}`});save();render();
  });
}
function addMemo(){if(!S)return;const v=prompt('試合メモを入力してください。',S.memo||'');if(v===null)return;snap('試合メモ');S.memo=String(v).trim();if(S.memo)S.events.unshift({time:fmt(elapsed()),text:`メモ：${S.memo}`});save();render()}
function sub(outId){
  if(!S||S.phase!=='live')return;
  const bench=Object.keys(S.lineup).filter(id=>!S.lineup[id]&&S.stats[id].red===0);
  pick(`IN選手を選択（OUT ${S.stats[outId].name}）`,bench,inId=>{
    snap('選手交代');const n=now(),out=S.stats[outId],inn=S.stats[inId];
    if(out.onAt){out.activeMs+=n-out.onAt;out.onAt=null}
    S.lineup[outId]=false;S.lineup[inId]=true;inn.played=true;inn.onAt=S.running?n:null;
    S.events.unshift({time:fmt(elapsed()),text:`交代 OUT ${out.name} → IN ${inn.name}`});save();render();
  });
}
function finish(){
  if(!S)return;
  if(!confirm(`試合を終了しますか？\n古堅南FC ${S.gf} - ${S.ga} ${S.opponent}`))return;
  pause();S.phase='save';S.finalized=true;save();render();
}
function reset(){if(S?.running)pause();S=null;save();close();render()}
function setValue(id,v){const e=$(id);if(!e)return false;e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));return true}
async function transfer(){
  if(!S)return;
  const F=JSON.parse(JSON.stringify(S));
  archive();
  close();
  if(typeof showPage==='function')showPage('entry');
  setTimeout(()=>{
    setValue('matchDate',F.date);setValue('matchCategory',F.category);setValue('competition',F.competition);
    setValue('opponent',F.opponent);setValue('venue',F.venue);setValue('goalsFor',F.gf);setValue('goalsAgainst',F.ga);
    setValue('matchMemo',`Ver.22.8 試合会場モード完成版\n試合形式：${F.formatLabel}\nスタメン：${F.starterCount}名\nシュート：${F.shots||0}本\nメモ：${F.memo||''}\n${F.events.slice().reverse().map(e=>`${e.time} ${e.text}`).join('\n')}`);
    try{typeof renderRecordInputs==='function'&&renderRecordInputs()}catch(e){console.error(e)}
    setTimeout(async()=>{
      let reflected=0;
      document.querySelectorAll('.player-entry[data-player]').forEach(row=>{
        const p=F.stats[String(row.dataset.player)];if(!p)return;reflected++;
        const q=c=>row.querySelector(c);
        if(q('.played'))q('.played').checked=!!p.played;
        if(q('.minutes'))q('.minutes').value=mins(p.activeMs);
        if(q('.goals'))q('.goals').value=p.goals||0;
        if(q('.assists'))q('.assists').value=p.assists||0;
        if(q('.yellow'))q('.yellow').value=p.yellow||0;
        if(q('.red'))q('.red').value=p.red||0;
      });
      if(F.autoSave&&typeof saveMatchWithRecords==='function'){
        try{
          await saveMatchWithRecords();S=null;save();
          msg(`試合結果と選手成績を保存しました（${reflected}名反映）。`,'ok');
        }catch(e){console.error(e);msg('自動保存できませんでした。内容を確認して「試合を保存」を押してください。')}
      }else{
        S=null;save();msg(`選手成績へ${reflected}名分を反映しました。内容を確認して「試合を保存」を押してください。`,'ok');
      }
    },600);
  },250);
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-v24],[data-v24player],[data-v24event],[data-v24sub],[data-v24pick]');if(!t)return;
  e.preventDefault();
  e.stopPropagation();
  const a=t.dataset.v24;
  if(a==='select')beginSelection();
  else if(a==='back')reset();
  else if(a==='confirm')confirmLineup();
  else if(a==='edit'){S.phase='selection';save();render()}
  else if(a==='kickoff')kickoff();
  else if(a==='toggle')S.running?(pause(),render()):resume();
  else if(a==='halftime')halftime();
  else if(a==='finish')finish();
  else if(a==='transfer')transfer();
  else if(a==='memo')addMemo();
  else if(a==='undo')undo();
  else if(a==='resume-finished'){S.phase='live';save();render()}
  else if(a==='reset'){if(confirm('この試合の記録を削除しますか？'))reset()}
  else if(a==='close')close();
  else if(t.dataset.v24player)togglePlayer(t.dataset.v24player);
  else if(t.dataset.v24event)addEvent(t.dataset.v24event);
  else if(t.dataset.v24sub)sub(t.dataset.v24sub);
  else if(t.dataset.v24pick){const cb=$(MODAL)._cb;close();typeof cb==='function'&&cb(t.dataset.v24pick)}
});
document.addEventListener('input',e=>{if(e.target.closest('#live24'))rememberSetup()});
document.addEventListener('change',e=>{
  if(e.target.id==='v24count')$('v24customCountWrap')?.classList.toggle('hidden',e.target.value!=='custom');
  if(e.target.id==='v24format')$('v24customMinutesWrap')?.classList.toggle('hidden',!e.target.value.startsWith('custom'));
  rememberSetup();
});
document.addEventListener('DOMContentLoaded',()=>{load();ensure();render();timer=setInterval(()=>{if(S?.phase==='live'&&S.running&&$(PAGE)?.classList.contains('show'))render()},1000)});
window.addEventListener('pageshow',()=>{ensure();render()});
window.openLive24=open;
})();