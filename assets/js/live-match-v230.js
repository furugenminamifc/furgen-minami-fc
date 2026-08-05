
/* 古堅南FC AI Coach Ver.23.1.2.2
   試合会場モード 完全完成版（最終土台）
   試合カテゴリーに関係なく、常に全選手から選択 */
(function(){
'use strict';

var PAGE='matchday230';
var KEY='furugen_matchday_v2305';
var ARCHIVE='furugen_matchday_archive_v2305';
var state=null;
var timer=null;

function $(id){return document.getElementById(id);}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function tell(t,type){try{if(typeof showMessage==='function')showMessage(t,type||'warn');else alert(t);}catch(e){alert(t);}}
function today(){var d=new Date(),p=function(n){return String(n).padStart(2,'0')};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}
function now(){return Date.now();}
function timeText(ms){var s=Math.max(0,Math.floor(Number(ms||0)/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function mins(ms){return Math.max(0,Math.round(Number(ms||0)/60000));}

function normCat(v){
  var s=String(v||'').toUpperCase().replace(/\s/g,'').replace('－','-');
  if(['U-12','U12','6年','6年生','小学6年'].indexOf(s)>=0)return'U-12';
  if(['U-11','U11','5年','5年生','小学5年'].indexOf(s)>=0)return'U-11';
  if(['U-10','U10','4年','4年生','小学4年'].indexOf(s)>=0)return'U-10';
  if(['U-9','U9','3年','3年生','小学3年'].indexOf(s)>=0)return'U-9';
  return String(v||'未設定');
}
function sourcePlayers(){
  if(Array.isArray(window.__FURUGEN_PLAYERS__)&&window.__FURUGEN_PLAYERS__.length)return window.__FURUGEN_PLAYERS__;
  try{if(typeof players!=='undefined'&&Array.isArray(players)&&players.length)return players;}catch(e){}
  if(Array.isArray(window.players)&&window.players.length)return window.players;
  return [];
}
function fullRoster(){
  var order={'U-12':1,'U-11':2,'U-10':3,'U-9':4};
  return sourcePlayers().map(function(p,i){
    return {
      id:String(p.id||p.player_id||p.uuid||i),
      name:String(p.name||p.player_name||p.full_name||'').trim(),
      category:normCat(p.grade||p.category||p.age_category||p.school_year),
      position:String(p.position||p.positions||p.role||'未設定'),
      photo:String(p.photo_url||p.image_url||p.avatar_url||p.photo||p.image||''),
      status:String(p.status==null?'現役':p.status)
    };
  }).filter(function(p){
    if(!p.name)return false;
    var s=p.status.toLowerCase();
    return !s||['現役','active','在籍','所属','registered','current'].indexOf(s)>=0;
  }).sort(function(a,b){
    var aa=order[a.category]||9,bb=order[b.category]||9;
    if(aa!==bb)return aa-bb;
    return a.name.localeCompare(b.name,'ja');
  });
}
function load(){try{state=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){state=null}}
function save(){try{state?localStorage.setItem(KEY,JSON.stringify(state)):localStorage.removeItem(KEY)}catch(e){}}
function elapsed(){return !state?0:Number(state.elapsedMs||0)+(state.running?Math.max(0,now()-Number(state.runStartedAt||now())):0)}
function snap(label){var c=JSON.parse(JSON.stringify(state));delete c.history;state.history=state.history||[];state.history.push({label:label,state:c});if(state.history.length>30)state.history.shift()}
function undo(){if(!state||!state.history||!state.history.length)return tell('取り消せる操作がありません。');var h=state.history.pop(),keep=state.history;state=h.state;state.history=keep;save();render()}

function ensure(){
  var main=document.querySelector('main');if(!main)return null;
  var page=$(PAGE);
  if(!page){page=document.createElement('section');page.id=PAGE;page.className='page';main.appendChild(page)}
  if(!page.dataset.bound){
    page.dataset.bound='1';
    page.addEventListener('click',click,false);
    page.addEventListener('change',function(e){
      if(e.target&&['m230cat','m230compPreset','m230count','m230format'].includes(e.target.id))syncConditionFields();
    },false);
  }
  var nav=$('matchday230Nav');
  if(!nav){
    nav=document.createElement('button');nav.id='matchday230Nav';nav.type='button';nav.textContent='🏟 試合会場モード';
    nav.addEventListener('click',open,false);
    var n=document.querySelector('nav');if(n)n.appendChild(nav);
  }
  return page;
}
function open(){var p=ensure();if(typeof showPage==='function')showPage(PAGE);render();setTimeout(function(){if(p)p.scrollIntoView({block:'start'})},30)}
function steps(n){return '<div class="m230-steps">'+['試合情報','スタメン','開始前確認','ライブ記録','成績保存'].map(function(x,i){return '<span class="'+(i<=n?'on':'')+'">'+(i+1)+'. '+x+'</span>'}).join('')+'</div>'}
function shell(title,step,body){return '<div class="m230-card"><header><div><small>🏟 MATCH DAY LIVE</small><h2>'+esc(title)+'</h2></div><b>'+today()+'</b></header><div class="m230-body">'+steps(step)+body+'</div></div>'}
function avatar(p){return p.photo?'<img src="'+esc(p.photo)+'" alt="">':'<span class="m230-avatar">👤</span>'}

function setup(){
  var count=fullRoster().length;
  return shell('Ver.23.2 試合会場モード 完全修正版',0,
    '<div class="m230-grid">'+
    '<label>試合カテゴリー<select id="m230cat"><option value="U-12">U-12</option><option value="U-11">U-11</option><option value="U-10">U-10</option><option value="U-9">U-9</option><option value="11人制">11人制</option><option value="フットサル">フットサル</option><option value="TRM">TRM</option><option value="練習試合">練習試合</option><option value="公式戦">公式戦</option><option value="custom">自由入力</option></select><input id="m230catCustom" class="hidden" placeholder="例：U-13・U-15・一般・女子・OB戦"></label>'+
    '<label>対戦相手<input id="m230opp" placeholder="例：MOSTRO"></label>'+
    '<label>大会名<select id="m230compPreset"><option value="TML">TML</option><option value="TRM">TRM</option><option value="公式戦">公式戦</option><option value="リーグ戦">リーグ戦</option><option value="カップ戦">カップ戦</option><option value="custom">自由記入</option></select><input id="m230compCustom" class="hidden" placeholder="大会名を入力"></label>'+
    '<label>会場<input id="m230venue" placeholder="例：古堅南小学校"></label>'+
    '<label>人数制<select id="m230count"><option value="8">8人制</option><option value="11">11人制</option><option value="custom">自由選択</option></select><div id="m230countCustomWrap" class="m2313-extra hidden"><input id="m230countCustom" type="number" min="1" max="30" value="8"><span>人</span></div></label>'+
    '<label>試合時間<select id="m230format"><option value="20half">20分ハーフ</option><option value="15half">15分ハーフ</option><option value="15single">15分1本</option><option value="20single">20分1本</option><option value="custom">自由記入</option></select><div id="m230formatCustomWrap" class="m2313-extra hidden"><input id="m230minutesCustom" type="number" min="1" max="120" value="15"><span>分</span><input id="m230periodsCustom" type="number" min="1" max="10" value="1"><span>本</span></div></label>'+
    '</div>'+
    '<div class="m230-status '+(count?'ok':'error')+'">'+(count?'全カテゴリーの選手 '+count+'名を読み込み済みです。':'選手データの読込待ちです。数秒後にもう一度押してください。')+'</div>'+
    '<div class="m230-note">試合カテゴリーに関係なく、スタメンは常に全選手から選べます。</div>'+
    '<div class="m230-actions"><button type="button" class="primary" data-a="lineup">スタメン選択へ</button></div>'
  );
}
function syncConditionFields(){
  var cat=$('m230cat'),catc=$('m230catCustom');
  if(cat&&catc)catc.classList.toggle('hidden',cat.value!=='custom');
  var cp=$('m230compPreset'),cc=$('m230compCustom');
  if(cp&&cc)cc.classList.toggle('hidden',cp.value!=='custom');
  var pc=$('m230count'),pw=$('m230countCustomWrap');
  if(pc&&pw)pw.classList.toggle('hidden',pc.value!=='custom');
  var fm=$('m230format'),fw=$('m230formatCustomWrap');
  if(fm&&fw)fw.classList.toggle('hidden',fm.value!=='custom');
}
function getMatchCategory(){
  var cat=$('m230cat');
  if(!cat)return 'U-12';
  if(cat.value==='custom')return String($('m230catCustom')?.value||'').trim();
  return cat.value;
}
function getCompetition(){
  var p=$('m230compPreset');
  if(!p)return '';
  return p.value==='custom'?String($('m230compCustom')?.value||'').trim():p.value;
}
function getStarterCount(){
  var v=$('m230count')?.value||'8';
  return v==='custom'?Math.max(1,Math.min(30,Number($('m230countCustom')?.value||8))):Number(v);
}
function getFormat(){
  var v=$('m230format')?.value||'20half';
  if(v==='20half')return{label:'20分ハーフ',minutes:20,periods:2};
  if(v==='15half')return{label:'15分ハーフ',minutes:15,periods:2};
  if(v==='15single')return{label:'15分1本',minutes:15,periods:1};
  if(v==='20single')return{label:'20分1本',minutes:20,periods:1};
  return{label:Number($('m230minutesCustom')?.value||15)+'分×'+Number($('m230periodsCustom')?.value||1)+'本',minutes:Number($('m230minutesCustom')?.value||15),periods:Number($('m230periodsCustom')?.value||1)};
}
function beginLineup(){
  var opp=String($('m230opp')?$('m230opp').value:'').trim();
  if(!opp){tell('対戦相手を入力してください。');return}
  var all=fullRoster();
  if(!all.length){tell('選手データをまだ取得できていません。5秒後にもう一度押してください。');return}
  var need=getStarterCount();
  var fmt=getFormat();
  var category=getMatchCategory();
  var comp=getCompetition();
  if(!category){tell('試合カテゴリーを入力してください。');return}
  if(!comp){tell('大会名を入力または選択してください。');return}
  if(all.length<need){tell('登録選手が人数制より少ないです。');return}
  state={
    version:'23.2',phase:'lineup',date:today(),
    category:getMatchCategory(),opponent:opp,
    competition:comp,
    venue:String($('m230venue').value||'').trim(),
    starterCount:need,periodMinutes:fmt.minutes,periods:fmt.periods,matchFormat:fmt.label,
    filter:'ALL',selected:{},stats:{},events:[],history:[],
    elapsedMs:0,running:false,runStartedAt:null,gf:0,ga:0
  };
  all.forEach(function(p){
    state.selected[p.id]=false;
    state.stats[p.id]=Object.assign({},p,{starter:false,onField:false,activeMs:0,onAt:null,goals:0,assists:0,shots:0,yellow:0,red:0})
  });
  save();render();
}
function selectedCount(){return Object.keys(state.selected||{}).filter(function(id){return state.selected[id]}).length}
function lineup(){
  var all=fullRoster();
  all.forEach(function(p){
    if(!state.stats[p.id])state.stats[p.id]=Object.assign({},p,{starter:false,onField:false,activeMs:0,onAt:null,goals:0,assists:0,shots:0,yellow:0,red:0});
    if(typeof state.selected[p.id]==='undefined')state.selected[p.id]=false;
  });
  var filter=state.filter||'ALL';
  var list=Object.keys(state.stats).map(function(id){return state.stats[id]}).filter(function(p){return filter==='ALL'||p.category===filter});
  var filters=['ALL','U-12','U-11','U-10','U-9'].map(function(c){
    return '<button type="button" data-filter="'+c+'" class="'+(filter===c?'active':'')+'">'+(c==='ALL'?'全員':c)+'</button>'
  }).join('');
  var rows=list.map(function(p){
    var on=!!state.selected[p.id];
    return '<button type="button" class="m230-player '+(on?'selected':'')+'" data-player="'+esc(p.id)+'">'+avatar(p)+
      '<span><b>'+esc(p.name)+'</b><small>'+esc(p.category)+' / '+esc(p.position)+'</small></span>'+
      '<strong>'+(on?'選択中':'未選択')+'</strong></button>'
  }).join('');
  return shell('STEP 2 / スタメン選択',1,
    '<div class="m230-summary"><b>'+esc(state.category)+' vs '+esc(state.opponent)+'</b><span>選択 '+selectedCount()+' / '+state.starterCount+'名</span></div>'+
    '<div class="m230-note">全選手 '+Object.keys(state.stats).length+'名から選択できます。</div>'+
    '<div class="m230-filters">'+filters+'</div>'+
    '<div class="m230-list">'+rows+'</div>'+
    '<div class="m230-actions"><button type="button" data-a="back">戻る</button><button type="button" class="primary" data-a="confirm">開始前確認へ</button></div>'
  );
}
function confirmLineup(){
  if(selectedCount()!==Number(state.starterCount)){tell('スタメンを'+state.starterCount+'名選択してください。');return}
  Object.keys(state.stats).forEach(function(id){var p=state.stats[id];p.starter=!!state.selected[id];p.onField=p.starter});
  state.phase='confirm';save();render();
}
function confirmView(){
  var starters=Object.keys(state.stats).map(function(id){return state.stats[id]}).filter(function(p){return p.starter});
  return shell('STEP 3 / 開始前確認',2,
    '<div class="m230-matchinfo"><h3>'+esc(state.category)+'　古堅南FC vs '+esc(state.opponent)+'</h3></div>'+
    '<div class="m230-minis">'+starters.map(function(p){return '<div class="m230-mini">'+avatar(p)+'<span><b>'+esc(p.name)+'</b><small>'+esc(p.category)+' / '+esc(p.position)+'</small></span></div>'}).join('')+'</div>'+
    '<div class="m230-actions"><button type="button" data-a="backlineup">戻る</button><button type="button" class="primary" data-a="kickoff">試合開始</button></div>'
  );
}
function kickoff(){
  state.phase='live';state.running=true;state.runStartedAt=now();
  Object.keys(state.stats).forEach(function(id){if(state.stats[id].onField)state.stats[id].onAt=0});
  state.events.unshift({time:0,text:'試合開始'});save();render();startTimer();
}
function live(){
  return shell('LIVE MATCH　'+state.category+' vs '+state.opponent,3,
    '<div class="m230-score"><div><small>古堅南FC</small><strong>'+state.gf+'</strong></div><div><b id="m230clock">'+timeText(elapsed())+'</b></div><div><small>'+esc(state.opponent)+'</small><strong>'+state.ga+'</strong></div></div>'+
    '<div class="m230-actions center"><button type="button" data-a="pause">'+(state.running?'一時停止':'再開')+'</button><button type="button" class="danger" data-a="finish">試合終了</button></div>'+
    '<div class="m230-livebuttons"><button data-event="goal">⚽ 得点</button><button data-event="assist">🎯 アシスト</button><button data-event="shot">🥅 シュート</button><button data-event="opp">相手得点</button><button data-event="sub">🔄 交代</button><button data-event="yellow">🟨 警告</button><button data-event="red">🟥 退場</button><button data-a="undo">↩ 取り消し</button></div>'+
    '<div class="m230-events">'+state.events.map(function(e){return '<div><b>'+timeText(e.time)+'</b><span>'+esc(e.text)+'</span></div>'}).join('')+'</div>'
  );
}
function field(){return Object.keys(state.stats).map(function(id){return state.stats[id]}).filter(function(p){return p.onField})}
function bench(){return Object.keys(state.stats).map(function(id){return state.stats[id]}).filter(function(p){return !p.onField})}
function choose(title,list,cb){if(!list.length)return tell('選択できる選手がいません。');var n=prompt(title+'\n'+list.map(function(p,i){return(i+1)+'. '+p.name+'（'+p.category+'）'}).join('\n'));var i=Number(n)-1;if(i>=0&&i<list.length)cb(list[i])}
function eventAction(type){
  if(type==='opp'){snap('相手得点');state.ga++;state.events.unshift({time:elapsed(),text:'相手得点'});save();render();return}
  if(type==='sub'){
    choose('交代で退く選手',field(),function(outP){choose('交代で入る選手',bench(),function(inP){
      snap('交代');var t=elapsed();if(outP.onAt!=null)outP.activeMs+=t-outP.onAt;outP.onAt=null;outP.onField=false;inP.onField=true;inP.onAt=t;
      state.events.unshift({time:t,text:'交代：'+outP.name+' → '+inP.name});save();render()
    })});return
  }
  choose('選手を選択',field(),function(p){
    snap(type);
    if(type==='goal'){p.goals++;state.gf++}
    if(type==='assist')p.assists++;
    if(type==='shot')p.shots++;
    if(type==='yellow')p.yellow++;
    if(type==='red'){p.red++;if(p.onAt!=null)p.activeMs+=elapsed()-p.onAt;p.onAt=null;p.onField=false}
    var label={goal:'得点',assist:'アシスト',shot:'シュート',yellow:'警告',red:'退場'}[type];
    state.events.unshift({time:elapsed(),text:label+'：'+p.name});save();render()
  })
}
function pause(){if(state.running){state.elapsedMs=elapsed();state.running=false;state.runStartedAt=null}else{state.running=true;state.runStartedAt=now()}save();render();if(state.running)startTimer()}
function finish(){
  if(!confirm('試合を終了しますか？'))return;
  var t=elapsed();state.elapsedMs=t;state.running=false;state.runStartedAt=null;
  Object.keys(state.stats).forEach(function(id){var p=state.stats[id];if(p.onAt!=null)p.activeMs+=t-p.onAt;p.onAt=null;p.onField=false});
  state.phase='save';save();render();stopTimer()
}
function saveView(){
  var rows=Object.keys(state.stats).map(function(id){return state.stats[id]}).filter(function(p){return p.starter||p.activeMs||p.goals||p.assists||p.yellow||p.red}).map(function(p){
    return '<tr><td>'+esc(p.name)+'</td><td>'+esc(p.category)+'</td><td>'+mins(p.activeMs)+'分</td><td>'+p.goals+'</td><td>'+p.assists+'</td><td>'+p.yellow+'</td><td>'+p.red+'</td></tr>'
  }).join('');
  return shell('STEP 5 / 成績保存',4,
    '<div class="m230-result"><h3>試合終了　古堅南FC '+state.gf+' - '+state.ga+' '+esc(state.opponent)+'</h3></div>'+
    '<div class="m230-tablewrap"><table><thead><tr><th>選手</th><th>カテゴリー</th><th>出場</th><th>得点</th><th>アシスト</th><th>警告</th><th>退場</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<div class="m230-actions"><button type="button" class="primary" data-a="save">試合・選手成績を保存して終了</button><button type="button" data-a="new">次の試合</button></div>'
  );
}
async function saveResult(){
  if(typeof isStaff!=='function'||!isStaff())return tell('管理者またはコーチでログインしてください。');
  try{
    var mr={match_date:state.date,category:state.category,competition:state.competition||'',opponent:state.opponent,venue:state.venue||'',goals_for:state.gf,goals_against:state.ga,season:Number(state.date.slice(0,4)),memo:'試合会場モード Ver.23.1.2.2から登録',created_by:session.user.id};
    var x=await sb.from('matches').insert(mr).select().single();
    if(x.error)throw x.error;
    var mid=x.data.id;
    var rr=Object.keys(state.stats).map(function(id){var p=state.stats[id];return{match_id:mid,player_id:p.id,played:!!(p.starter||p.activeMs),minutes:mins(p.activeMs),goals:p.goals,assists:p.assists,yellow:p.yellow,red:p.red,mvp:false,created_by:session.user.id}}).filter(function(r){return r.played});
    if(rr.length){var y=await sb.from('records').insert(rr);if(y.error)throw y.error}
    try{var a=JSON.parse(localStorage.getItem(ARCHIVE)||'[]');a.unshift(state);localStorage.setItem(ARCHIVE,JSON.stringify(a.slice(0,100)))}catch(e){}
    if(typeof loadAll==='function')await loadAll();
    tell('試合と選手成績を保存しました。','ok');state=null;save();if(typeof showPage==='function')showPage('matches')
  }catch(e){console.error(e);tell('保存エラー：'+(e.message||e))}
}
function click(e){
  var b=e.target.closest('button');if(!b||!$(PAGE).contains(b))return;e.preventDefault();
  var a=b.getAttribute('data-a'),player=b.getAttribute('data-player'),filter=b.getAttribute('data-filter'),ev=b.getAttribute('data-event');
  if(a==='lineup')return beginLineup();
  if(a==='back'){state=null;save();return render()}
  if(a==='confirm')return confirmLineup();
  if(a==='backlineup'){state.phase='lineup';save();return render()}
  if(a==='kickoff')return kickoff();
  if(a==='pause')return pause();
  if(a==='finish')return finish();
  if(a==='undo')return undo();
  if(a==='save')return saveResult();
  if(a==='new'){state=null;save();return render()}
  if(filter){state.filter=filter;save();return render()}
  if(player){
    var on=!state.selected[player];
    if(on&&selectedCount()>=state.starterCount)return tell('選択できるのは'+state.starterCount+'名までです。');
    state.selected[player]=on;save();return render()
  }
  if(ev)return eventAction(ev)
}
function render(){
  var p=ensure();if(!p)return;
  if(!state)p.innerHTML=setup();
  else if(state.phase==='lineup')p.innerHTML=lineup();
  else if(state.phase==='confirm')p.innerHTML=confirmView();
  else if(state.phase==='live')p.innerHTML=live();
  else if(state.phase==='save')p.innerHTML=saveView();
  else p.innerHTML=setup();
  if(!state)syncConditionFields();
  document.querySelectorAll('*').forEach(function(el){if(el.children.length===0&&(el.textContent.trim()==='live24'||el.textContent.trim()==='matchday230'))el.textContent='🏟 試合会場モード'})
}
function startTimer(){stopTimer();timer=setInterval(function(){var c=$('m230clock');if(c)c.textContent=timeText(elapsed())},500)}
function stopTimer(){if(timer){clearInterval(timer);timer=null}}
function init(){load();ensure();render();window.openMatchday230=open}
window.addEventListener('furugen-players-loaded',function(){if(!state)render()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
