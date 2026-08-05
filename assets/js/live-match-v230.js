/* 古堅南FC AI Coach Ver.24.0 試合会場モード 完全完成版 */
(function(){
'use strict';

var PAGE='matchday230';
var KEY='furugen_matchday_v240';
var ARCHIVE='furugen_matchday_archive_v240';
var PENDING='furugen_matchday_pending_save_v240';
var state=null;
var timer=null;
var saving=false;

function $(id){return document.getElementById(id);}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function tell(t,type){try{if(typeof showMessage==='function')showMessage(t,type||'warn');else alert(t);}catch(e){alert(t);}}
function isCoachLoggedIn(){try{return typeof isStaff==='function'&&!!isStaff()}catch(e){return false}}
function requireCoach(){if(isCoachLoggedIn())return true;tell('試合会場モードの操作には、管理者またはコーチログインが必要です。');render();return false}
function today(){var d=new Date(),p=function(n){return String(n).padStart(2,'0')};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}
function now(){return Date.now()}
function timeText(ms){var s=Math.max(0,Math.floor(Number(ms||0)/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function mins(ms){return Math.max(0,Math.round(Number(ms||0)/60000))}
function online(){return navigator.onLine!==false}
function save(){try{state?localStorage.setItem(KEY,JSON.stringify(state)):localStorage.removeItem(KEY)}catch(e){}}
function load(){try{state=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){state=null}}
function elapsed(){return !state?0:Number(state.elapsedMs||0)+(state.running?Math.max(0,now()-Number(state.runStartedAt||now())):0)}
function currentPeriodElapsed(){return !state?0:Number(state.periodElapsedMs||0)+(state.running?Math.max(0,now()-Number(state.periodRunStartedAt||now())):0)}
function periodTarget(){return Number(state&&state.periodMinutes||20)*60000}
function snap(label){if(!state)return;var c=JSON.parse(JSON.stringify(state));delete c.history;state.history=state.history||[];state.history.push({label:label,state:c});if(state.history.length>50)state.history.shift()}
function undo(){if(!requireCoach())return;if(!state||!state.history||!state.history.length)return tell('取り消せる操作がありません。');var h=state.history.pop(),keep=state.history;state=h.state;state.history=keep;save();render()}
function stopTimer(){if(timer){clearInterval(timer);timer=null}}
function startTimer(){stopTimer();timer=setInterval(function(){updateClocks()},250)}
function updateClocks(){
  var c=$('m230clock'),pc=$('m240periodClock'),bar=$('m240periodBar');
  if(c)c.textContent=timeText(elapsed());
  if(pc)pc.textContent=timeText(currentPeriodElapsed());
  if(bar)bar.style.width=Math.min(100,(currentPeriodElapsed()/Math.max(1,periodTarget()))*100)+'%';
  var warn=$('m240timeWarn');
  if(warn)warn.classList.toggle('show',currentPeriodElapsed()>=periodTarget());
}

function permissionView(){
  return shell('試合会場モード',0,
    '<div class="m230-permission-lock"><div class="m230-lock-icon">🔒</div>'+
    '<h3>コーチログイン後に操作できます</h3>'+
    '<p>試合情報・スタメン・ライブ記録・成績保存は、管理者またはコーチのみ操作できます。</p>'+
    '<div class="m230-actions center"><button type="button" class="primary" data-a="coachlogin">🔐 コーチログインへ</button></div></div>'
  );
}

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
  try{if(typeof players!=='undefined'&&Array.isArray(players)&&players.length)return players}catch(e){}
  if(Array.isArray(window.players)&&window.players.length)return window.players;
  return [];
}
function fullRoster(){
  var order={'U-12':1,'U-11':2,'U-10':3,'U-9':4};
  return sourcePlayers().map(function(p,i){return{
    id:String(p.id||p.player_id||p.uuid||i),
    name:String(p.name||p.player_name||p.full_name||'').trim(),
    category:normCat(p.grade||p.category||p.age_category||p.school_year),
    position:String(p.position||p.positions||p.role||'未設定'),
    photo:String(p.photo_url||p.image_url||p.avatar_url||p.photo||p.image||''),
    status:String(p.status==null?'現役':p.status)
  }}).filter(function(p){
    if(!p.name)return false;
    var s=p.status.toLowerCase();
    return !s||['現役','active','在籍','所属','registered','current'].indexOf(s)>=0;
  }).sort(function(a,b){
    var aa=order[a.category]||9,bb=order[b.category]||9;
    return aa!==bb?aa-bb:a.name.localeCompare(b.name,'ja');
  });
}
function avatar(p){return p.photo?'<img src="'+esc(p.photo)+'" alt="">':'<span class="m230-avatar">👤</span>'}
function ensure(){
  var main=document.querySelector('main');if(!main)return null;
  var page=$(PAGE);
  if(!page){page=document.createElement('section');page.id=PAGE;page.className='page';main.appendChild(page)}
  if(!page.dataset.bound){
    page.dataset.bound='1';
    page.addEventListener('click',click,false);
    page.addEventListener('change',function(e){
      if(e.target&&['m230cat','m230compPreset','m230count','m230format'].indexOf(e.target.id)>=0)syncConditionFields();
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
function steps(n){return '<div class="m230-steps">'+['試合情報','スタメン','開始前確認','ライブ記録','成績保存'].map(function(x,i){return'<span class="'+(i<=n?'on':'')+'">'+(i+1)+'. '+x+'</span>'}).join('')+'</div>'}
function netBadge(){return '<div class="m240-net '+(online()?'online':'offline')+'">'+(online()?'🟢 オンライン':'🔴 オフライン・端末に自動保存中')+'</div>'}
function shell(title,step,body){return '<div class="m230-card"><header><div><small>🏟 MATCH DAY LIVE</small><h2>'+esc(title)+'</h2></div><div>'+netBadge()+'<b>'+today()+'</b></div></header><div class="m230-body">'+steps(step)+body+'</div></div>'}

function setup(){
  var count=fullRoster().length;
  var draft=state?'<div class="m240-draft">💾 途中記録があります。続きから再開できます。</div>':'';
  return shell('Ver.24.0 試合会場モード 完全完成版',0,
    draft+'<div class="m230-grid">'+
    '<label>試合カテゴリー<select id="m230cat"><option>U-12</option><option>U-11</option><option>U-10</option><option>U-9</option><option>11人制</option><option>フットサル</option><option>TRM</option><option>練習試合</option><option>公式戦</option><option value="custom">自由入力</option></select><input id="m230catCustom" class="hidden" placeholder="カテゴリーを入力"></label>'+
    '<label>対戦相手<input id="m230opp" placeholder="例：MOSTRO"></label>'+
    '<label>大会名<select id="m230compPreset"><option>TML</option><option>TRM</option><option>公式戦</option><option>リーグ戦</option><option>カップ戦</option><option value="custom">自由記入</option></select><input id="m230compCustom" class="hidden" placeholder="大会名を入力"></label>'+
    '<label>会場<input id="m230venue" placeholder="例：古堅南小学校"></label>'+
    '<label>人数制<select id="m230count"><option value="8">8人制</option><option value="11">11人制</option><option value="custom">自由選択</option></select><div id="m230countCustomWrap" class="m2313-extra hidden"><input id="m230countCustom" type="number" min="1" max="30" value="8"><span>人</span></div></label>'+
    '<label>試合時間<select id="m230format"><option value="20half">20分ハーフ</option><option value="15half">15分ハーフ</option><option value="15single">15分1本</option><option value="20single">20分1本</option><option value="custom">自由記入</option></select><div id="m230formatCustomWrap" class="m2313-extra hidden"><input id="m230minutesCustom" type="number" min="1" max="120" value="15"><span>分</span><input id="m230periodsCustom" type="number" min="1" max="10" value="1"><span>本</span></div></label>'+
    '</div>'+
    '<div class="m230-status '+(count?'ok':'error')+'">'+(count?'全カテゴリーの選手 '+count+'名を読み込み済みです。':'選手データの読み込み待ちです。')+'</div>'+
    '<div class="m230-note">カテゴリーに関係なく、スタメンは全選手から選択できます。</div>'+
    '<div class="m230-actions"><button type="button" class="primary m240-mainbtn" data-a="lineup">スタメン選択へ</button></div>'
  );
}
function syncConditionFields(){
  var pairs=[['m230cat','m230catCustom'],['m230compPreset','m230compCustom']];
  pairs.forEach(function(x){var a=$(x[0]),b=$(x[1]);if(a&&b)b.classList.toggle('hidden',a.value!=='custom')});
  var c=$('m230count'),cw=$('m230countCustomWrap');if(c&&cw)cw.classList.toggle('hidden',c.value!=='custom');
  var f=$('m230format'),fw=$('m230formatCustomWrap');if(f&&fw)fw.classList.toggle('hidden',f.value!=='custom');
}
function getMatchCategory(){var e=$('m230cat');return !e?'U-12':e.value==='custom'?String($('m230catCustom')?.value||'').trim():e.value}
function getCompetition(){var e=$('m230compPreset');return !e?'':e.value==='custom'?String($('m230compCustom')?.value||'').trim():e.value}
function getStarterCount(){var v=$('m230count')?.value||'8';return v==='custom'?Math.max(1,Math.min(30,Number($('m230countCustom')?.value||8))):Number(v)}
function getFormat(){
  var v=$('m230format')?.value||'20half';
  if(v==='20half')return{label:'20分ハーフ',minutes:20,periods:2};
  if(v==='15half')return{label:'15分ハーフ',minutes:15,periods:2};
  if(v==='15single')return{label:'15分1本',minutes:15,periods:1};
  if(v==='20single')return{label:'20分1本',minutes:20,periods:1};
  return{label:Number($('m230minutesCustom')?.value||15)+'分×'+Number($('m230periodsCustom')?.value||1)+'本',minutes:Number($('m230minutesCustom')?.value||15),periods:Number($('m230periodsCustom')?.value||1)};
}
function beginLineup(){
  if(!requireCoach())return;
  var opp=String($('m230opp')?.value||'').trim(),all=fullRoster(),need=getStarterCount(),fmt=getFormat(),category=getMatchCategory(),comp=getCompetition();
  if(!opp)return tell('対戦相手を入力してください。');
  if(!category)return tell('試合カテゴリーを入力してください。');
  if(!comp)return tell('大会名を入力または選択してください。');
  if(!all.length)return tell('選手データを取得できていません。');
  if(all.length<need)return tell('登録選手が人数制より少ないです。');
  state={version:'24.0',phase:'lineup',date:today(),category:category,opponent:opp,competition:comp,
    venue:String($('m230venue')?.value||'').trim(),starterCount:need,periodMinutes:fmt.minutes,totalPeriods:fmt.periods,
    formatLabel:fmt.label,currentPeriod:1,periodElapsedMs:0,periodRunStartedAt:null,elapsedMs:0,runStartedAt:null,
    running:false,gf:0,ga:0,selected:{},stats:{},events:[],history:[],filter:'ALL',choice:null,savedMatchId:null};
  all.forEach(function(p){state.stats[p.id]={id:p.id,name:p.name,category:p.category,position:p.position,photo:p.photo,starter:false,onField:false,onAt:null,activeMs:0,goals:0,assists:0,shots:0,yellow:0,red:0}});
  save();render();
}
function selectedCount(){return state?Object.keys(state.selected||{}).filter(function(id){return state.selected[id]}).length:0}
function lineup(){
  var filter=state.filter||'ALL',all=Object.keys(state.stats).map(function(id){return state.stats[id]}),list=filter==='ALL'?all:all.filter(function(p){return p.category===filter});
  var filters=['ALL','U-12','U-11','U-10','U-9'].map(function(c){return'<button type="button" data-filter="'+c+'" class="'+(filter===c?'active':'')+'">'+(c==='ALL'?'全員':c)+'</button>'}).join('');
  var rows=list.map(function(p){var on=!!state.selected[p.id];return'<button type="button" class="m230-player '+(on?'selected':'')+'" data-player="'+esc(p.id)+'">'+avatar(p)+'<span><b>'+esc(p.name)+'</b><small>'+esc(p.category)+' / '+esc(p.position)+'</small></span><strong>'+(on?'選択中':'未選択')+'</strong></button>'}).join('');
  return shell('STEP 2 / スタメン選択',1,
    '<div class="m230-summary"><b>'+esc(state.category)+' vs '+esc(state.opponent)+'</b><span>選択 '+selectedCount()+' / '+state.starterCount+'名</span></div>'+
    '<div class="m230-filters">'+filters+'</div><div class="m230-list">'+rows+'</div>'+
    '<div class="m230-actions"><button data-a="back">戻る</button><button class="primary m240-mainbtn" data-a="confirm">開始前確認へ</button></div>');
}
function confirmLineup(){
  if(!requireCoach())return;
  if(selectedCount()!==Number(state.starterCount))return tell('スタメンを'+state.starterCount+'名選択してください。');
  Object.keys(state.stats).forEach(function(id){var p=state.stats[id];p.starter=!!state.selected[id];p.onField=p.starter});
  state.phase='confirm';save();render();
}
function confirmView(){
  var starters=Object.keys(state.stats).map(function(id){return state.stats[id]}).filter(function(p){return p.starter});
  return shell('STEP 3 / 開始前確認',2,
    '<div class="m230-matchinfo"><h3>'+esc(state.category)+'　古堅南FC vs '+esc(state.opponent)+'</h3><p>'+esc(state.formatLabel)+' / '+state.starterCount+'人制</p></div>'+
    '<div class="m230-minis">'+starters.map(function(p){return'<div class="m230-mini">'+avatar(p)+'<span><b>'+esc(p.name)+'</b><small>'+esc(p.category)+' / '+esc(p.position)+'</small></span></div>'}).join('')+'</div>'+
    '<div class="m230-actions"><button data-a="backlineup">戻る</button><button class="primary m240-mainbtn" data-a="kickoff">▶ 試合開始</button></div>');
}
function kickoff(){
  if(!requireCoach())return;
  state.phase='live';state.running=true;state.runStartedAt=now();state.periodRunStartedAt=now();
  Object.keys(state.stats).forEach(function(id){if(state.stats[id].onField)state.stats[id].onAt=0});
  state.events.unshift({time:0,text:'第1本 試合開始'});save();render();startTimer();
}
function field(){return Object.keys(state.stats).map(function(id){return state.stats[id]}).filter(function(p){return p.onField})}
function bench(){return Object.keys(state.stats).map(function(id){return state.stats[id]}).filter(function(p){return !p.onField&&p.red===0})}
function playerChooser(){
  if(!state.choice)return'';
  var ch=state.choice,list=ch.pool==='bench'?bench():field();
  var none=ch.allowNone?'<button class="m240-choice none" data-choice-none="1">アシストなし</button>':'';
  return'<div class="m240-overlay"><div class="m240-picker"><h3>'+esc(ch.title)+'</h3><p>選手をタップしてください</p><div class="m240-choicegrid">'+
    list.map(function(p){return'<button class="m240-choice" data-choice-player="'+esc(p.id)+'">'+avatar(p)+'<span><b>'+esc(p.name)+'</b><small>'+esc(p.category)+' / '+esc(p.position)+'</small></span></button>'}).join('')+
    none+'</div><button class="m240-cancel" data-a="cancelchoice">キャンセル</button></div></div>';
}
function liveView(){
  var periodLabel=state.totalPeriods>1?'第'+state.currentPeriod+'本 / 全'+state.totalPeriods+'本':'1本';
  return shell('LIVE MATCH　'+state.category+' vs '+state.opponent,3,
    '<div class="m240-period"><strong>'+periodLabel+'</strong><span id="m240periodClock">'+timeText(currentPeriodElapsed())+'</span><div class="m240-progress"><i id="m240periodBar"></i></div><b id="m240timeWarn">設定時間を経過しました</b></div>'+
    '<div class="m230-score"><div><small>古堅南FC</small><strong>'+state.gf+'</strong></div><div><b id="m230clock">'+timeText(elapsed())+'</b><small>合計時間</small></div><div><small>'+esc(state.opponent)+'</small><strong>'+state.ga+'</strong></div></div>'+
    '<div class="m230-actions center"><button data-a="pause">'+(state.running?'⏸ 一時停止':'▶ 再開')+'</button>'+
    (state.totalPeriods>1&&state.currentPeriod<state.totalPeriods?'<button class="period" data-a="nextperiod">次の本へ</button>':'')+
    '<button class="danger" data-a="finish">■ 試合終了</button></div>'+
    '<div class="m230-livebuttons"><button data-event="goal">⚽ 得点</button><button data-event="shot">🥅 シュート</button><button data-event="opp">相手得点</button><button data-event="sub">🔄 交代</button><button data-event="yellow">🟨 警告</button><button data-event="red">🟥 退場</button><button data-a="undo">↩ 取消</button></div>'+
    '<div class="m240-autosave">💾 操作のたびに端末へ自動保存しています</div>'+
    '<div class="m230-events">'+state.events.map(function(e){return'<div><b>'+timeText(e.time)+'</b><span>'+esc(e.text)+'</span></div>'}).join('')+'</div>'+playerChooser());
}
function openChoice(type){
  if(type==='goal')state.choice={type:'goal-scorer',title:'得点者を選択',pool:'field'};
  if(type==='shot')state.choice={type:'shot',title:'シュート選手を選択',pool:'field'};
  if(type==='yellow')state.choice={type:'yellow',title:'警告選手を選択',pool:'field'};
  if(type==='red')state.choice={type:'red',title:'退場選手を選択',pool:'field'};
  if(type==='sub')state.choice={type:'sub-out',title:'交代で退く選手',pool:'field'};
  save();render();
}
function completeChoice(id,isNone){
  if(!state.choice)return;
  var ch=state.choice,p=id?state.stats[id]:null,t=elapsed();
  if(ch.type==='goal-scorer'){
    snap('得点');p.goals++;state.gf++;state.events.unshift({time:t,text:'得点：'+p.name});
    state.choice={type:'goal-assist',title:'アシスト選手を選択',pool:'field',allowNone:true,scorerId:p.id};save();render();return;
  }
  if(ch.type==='goal-assist'){
    if(!isNone&&p){p.assists++;state.events.unshift({time:t,text:'アシスト：'+p.name})}
    state.choice=null;save();render();return;
  }
  if(ch.type==='sub-out'){state.choice={type:'sub-in',title:'交代で入る選手',pool:'bench',outId:p.id};save();render();return}
  if(ch.type==='sub-in'){
    snap('交代');var outP=state.stats[ch.outId];
    if(outP.onAt!=null)outP.activeMs+=t-outP.onAt;outP.onAt=null;outP.onField=false;
    p.onField=true;p.onAt=t;state.events.unshift({time:t,text:'交代：'+outP.name+' → '+p.name});state.choice=null;save();render();return;
  }
  snap(ch.type);
  if(ch.type==='shot'){p.shots++;state.events.unshift({time:t,text:'シュート：'+p.name})}
  if(ch.type==='yellow'){p.yellow++;state.events.unshift({time:t,text:'警告：'+p.name})}
  if(ch.type==='red'){p.red++;if(p.onAt!=null)p.activeMs+=t-p.onAt;p.onAt=null;p.onField=false;state.events.unshift({time:t,text:'退場：'+p.name})}
  state.choice=null;save();render();
}
function eventAction(type){
  if(!requireCoach())return;
  if(type==='opp'){snap('相手得点');state.ga++;state.events.unshift({time:elapsed(),text:'相手得点'});save();render();return}
  openChoice(type);
}
function pause(){
  if(!requireCoach())return;
  if(state.running){
    state.elapsedMs=elapsed();state.periodElapsedMs=currentPeriodElapsed();state.running=false;state.runStartedAt=null;state.periodRunStartedAt=null;
  }else{
    state.running=true;state.runStartedAt=now();state.periodRunStartedAt=now();
  }
  save();render();if(state.running)startTimer();
}
function nextPeriod(){
  if(!requireCoach())return;
  if(state.currentPeriod>=state.totalPeriods)return;
  if(!confirm('第'+state.currentPeriod+'本を終了し、第'+(state.currentPeriod+1)+'本へ進みますか？'))return;
  snap('次の本へ');
  var t=elapsed();
  Object.keys(state.stats).forEach(function(id){var p=state.stats[id];if(p.onField&&p.onAt!=null){p.activeMs+=t-p.onAt;p.onAt=t}});
  state.elapsedMs=t;state.periodElapsedMs=0;state.currentPeriod++;state.periodRunStartedAt=state.running?now():null;
  state.events.unshift({time:t,text:'第'+state.currentPeriod+'本 開始'});save();render();if(state.running)startTimer();
}
function finish(){
  if(!requireCoach())return;
  if(!confirm('試合を終了しますか？'))return;
  var t=elapsed();state.elapsedMs=t;state.periodElapsedMs=currentPeriodElapsed();state.running=false;state.runStartedAt=null;state.periodRunStartedAt=null;
  Object.keys(state.stats).forEach(function(id){var p=state.stats[id];if(p.onAt!=null)p.activeMs+=t-p.onAt;p.onAt=null;p.onField=false});
  state.phase='save';state.choice=null;save();render();stopTimer();
}
function saveView(){
  var rows=Object.keys(state.stats).map(function(id){return state.stats[id]}).filter(function(p){return p.starter||p.activeMs||p.goals||p.assists||p.yellow||p.red}).map(function(p){
    return'<tr><td>'+esc(p.name)+'</td><td>'+mins(p.activeMs)+'分</td><td>'+p.goals+'</td><td>'+p.assists+'</td><td>'+p.yellow+'</td><td>'+p.red+'</td></tr>'
  }).join('');
  return shell('STEP 5 / 成績保存',4,
    '<div class="m230-result"><h3>試合終了　古堅南FC '+state.gf+' - '+state.ga+' '+esc(state.opponent)+'</h3><p>'+esc(state.competition)+' / '+esc(state.formatLabel)+'</p></div>'+
    (!online()?'<div class="m240-offline-save">通信がありません。記録は端末に保護されています。オンライン復帰後に保存できます。</div>':'')+
    '<div class="m230-tablewrap"><table><thead><tr><th>選手</th><th>出場</th><th>得点</th><th>アシスト</th><th>警告</th><th>退場</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<div class="m230-actions"><button class="primary m240-mainbtn" data-a="save" '+(saving?'disabled':'')+'>'+(saving?'保存中…':'試合・選手成績を保存')+'</button><button data-a="new">次の試合</button></div>');
}
async function saveResult(){
  if(!requireCoach()||saving)return;
  if(!online()){localStorage.setItem(PENDING,JSON.stringify(state));tell('通信がないため端末に保存しました。オンライン復帰後に再度「保存」を押してください。');render();return}
  if(state.savedMatchId){tell('この試合はすでに保存済みです。','ok');return}
  saving=true;render();
  try{
    var mr={match_date:state.date,category:state.category,competition:state.competition||'',opponent:state.opponent,venue:state.venue||'',goals_for:state.gf,goals_against:state.ga,season:Number(state.date.slice(0,4)),memo:'試合会場モード Ver.24.0 完全完成版 / '+state.formatLabel,created_by:session.user.id};
    var x=await sb.from('matches').insert(mr).select().single();if(x.error)throw x.error;
    state.savedMatchId=x.data.id;save();
    var rr=Object.keys(state.stats).map(function(id){var p=state.stats[id];return{match_id:x.data.id,player_id:p.id,played:!!(p.starter||p.activeMs),minutes:mins(p.activeMs),goals:p.goals,assists:p.assists,yellow:p.yellow,red:p.red,mvp:false,created_by:session.user.id}}).filter(function(r){return r.played});
    if(rr.length){var y=await sb.from('records').insert(rr);if(y.error)throw y.error}
    try{var a=JSON.parse(localStorage.getItem(ARCHIVE)||'[]');a.unshift(state);localStorage.setItem(ARCHIVE,JSON.stringify(a.slice(0,100)))}catch(e){}
    localStorage.removeItem(PENDING);
    if(typeof loadAll==='function')await loadAll();
    tell('試合と選手成績を保存しました。','ok');state=null;save();saving=false;if(typeof showPage==='function')showPage('matches');
  }catch(e){saving=false;console.error(e);tell('保存エラー：'+(e.message||e));render()}
}
function click(e){
  var b=e.target.closest('button');if(!b||!$(PAGE).contains(b))return;e.preventDefault();
  var a=b.getAttribute('data-a'),player=b.getAttribute('data-player'),filter=b.getAttribute('data-filter'),ev=b.getAttribute('data-event');
  var choicePlayer=b.getAttribute('data-choice-player'),choiceNone=b.getAttribute('data-choice-none');
  if(a==='coachlogin'){var loginButton=$('loginIn');if(loginButton)loginButton.click();else if(typeof showPage==='function')showPage('login');return}
  if(!requireCoach())return;
  if(choicePlayer)return completeChoice(choicePlayer,false);
  if(choiceNone)return completeChoice(null,true);
  if(a==='cancelchoice'){state.choice=null;save();return render()}
  if(a==='lineup')return beginLineup();
  if(a==='back'){state=null;save();return render()}
  if(a==='confirm')return confirmLineup();
  if(a==='backlineup'){state.phase='lineup';save();return render()}
  if(a==='kickoff')return kickoff();
  if(a==='pause')return pause();
  if(a==='nextperiod')return nextPeriod();
  if(a==='finish')return finish();
  if(a==='undo')return undo();
  if(a==='save')return saveResult();
  if(a==='new'){if(state&&!confirm('現在の試合記録を閉じて次の試合へ進みますか？'))return;state=null;save();return render()}
  if(filter){state.filter=filter;save();return render()}
  if(player){var on=!state.selected[player];if(on&&selectedCount()>=state.starterCount)return tell('選択できるのは'+state.starterCount+'名までです。');state.selected[player]=on;save();return render()}
  if(ev)return eventAction(ev);
}
function render(){
  var p=ensure();if(!p)return;
  if(!isCoachLoggedIn()){stopTimer();p.innerHTML=permissionView();return}
  if(!state)p.innerHTML=setup();
  else if(state.phase==='lineup')p.innerHTML=lineup();
  else if(state.phase==='confirm')p.innerHTML=confirmView();
  else if(state.phase==='live')p.innerHTML=liveView();
  else if(state.phase==='save')p.innerHTML=saveView();
  else p.innerHTML=setup();
  if(!state)syncConditionFields();
  if(state&&state.running)startTimer();
  updateClocks();
}
function init(){load();ensure();render();window.openMatchday230=open}
window.addEventListener('furugen-players-loaded',function(){if(!state)render()});
window.addEventListener('furugen-auth-updated',function(e){if(!e.detail||!e.detail.staff)stopTimer();render()});
window.addEventListener('online',function(){tell('オンラインに復帰しました。保存できます。','ok');render()});
window.addEventListener('offline',function(){tell('通信が切れました。試合記録は端末に自動保存されます。');render()});
window.addEventListener('beforeunload',save);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();