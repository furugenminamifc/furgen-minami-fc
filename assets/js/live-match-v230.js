
/* 古堅南FC AI Coach Ver.23.0.2 試合会場モード 完全版
   Safari / iPhone / iPad / Android / Windows 共通・ゼロ再構築 */
(function(){
'use strict';

var PAGE_ID='matchday230';
var STORAGE_KEY='furugen_matchday_v230';
var ARCHIVE_KEY='furugen_matchday_archive_v230';
var SETUP_KEY='furugen_matchday_setup_v230';
var CATS=['U-12','U-11','U-10','U-9'];
var state=null;
var timerId=null;

function byId(id){ return document.getElementById(id); }
function safe(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function notify(text,type){
  try{ if(typeof window.showMessage==='function'){ window.showMessage(text,type||'warn'); } else { alert(text); } }
  catch(e){ alert(text); }
}
function today(){
  var d=new Date(),p=function(n){return String(n).padStart(2,'0');};
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
}
function now(){ return Date.now(); }
function fmt(ms){
  var s=Math.max(0,Math.floor(Number(ms||0)/1000));
  return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
}
function minutes(ms){ return Math.max(0,Math.round(Number(ms||0)/60000)); }

function normCategory(v){
  var s=String(v||'').toUpperCase().replace(/\s/g,'');
  if(['U-12','U12','6年','6年生','小学6年'].indexOf(s)>=0)return'U-12';
  if(['U-11','U11','5年','5年生','小学5年'].indexOf(s)>=0)return'U-11';
  if(['U-10','U10','4年','4年生','小学4年'].indexOf(s)>=0)return'U-10';
  if(['U-9','U9','3年','3年生','小学3年'].indexOf(s)>=0)return'U-9';
  return'未設定';
}
function rawPlayers(){
  try{
    if(Array.isArray(window.__FURUGEN_PLAYERS__)) return window.__FURUGEN_PLAYERS__;
    if(Array.isArray(window.players)) return window.players;
    if(typeof players!=='undefined' && Array.isArray(players)) return players;
  }catch(e){}
  return [];
}
function roster(){
  return rawPlayers().map(function(p,i){
    return {
      id:String(p.id||p.player_id||p.uuid||i),
      name:String(p.name||p.player_name||p.full_name||'').trim(),
      category:normCategory(p.grade||p.category||p.age_category||p.school_year),
      position:String(p.position||p.positions||p.role||'未設定'),
      photo:String(p.photo_url||p.image_url||p.avatar_url||p.photo||p.image||''),
      status:String(p.status==null?'現役':p.status)
    };
  }).filter(function(p){
    if(!p.name)return false;
    var s=p.status.toLowerCase();
    return !s || ['現役','active','在籍','所属','registered','current'].indexOf(s)>=0;
  });
}
function eligible(cat){
  var all=roster();
  var exact=all.filter(function(p){return p.category===cat;});
  if(exact.length)return exact.sort(function(a,b){return a.name.localeCompare(b.name,'ja');});
  return all.sort(function(a,b){return a.name.localeCompare(b.name,'ja');});
}

function load(){
  try{ state=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); }catch(e){ state=null; }
}
function save(){
  try{
    if(state)localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  }catch(e){}
}
function setupSaved(){
  try{return JSON.parse(localStorage.getItem(SETUP_KEY)||'{}');}catch(e){return{};}
}
function saveSetup(){
  var d={
    category:value('m230cat','U-12'),
    opponent:value('m230opp',''),
    competition:value('m230comp',''),
    venue:value('m230venue',''),
    count:value('m230count','8'),
    format:value('m230format','single-20'),
    auto:byId('m230auto')?byId('m230auto').checked:true
  };
  try{localStorage.setItem(SETUP_KEY,JSON.stringify(d));}catch(e){}
}
function value(id,fallback){
  var el=byId(id);
  return el?el.value:fallback;
}
function elapsed(){
  if(!state)return 0;
  return Number(state.elapsedMs||0)+(state.running?Math.max(0,now()-Number(state.runStartedAt||now())):0);
}
function playerTime(st){
  if(!st)return 0;
  return Number(st.activeMs||0)+(st.onAt!=null?Math.max(0,elapsed()-Number(st.onAt||0)):0);
}
function snapshot(label){
  if(!state)return;
  var clone=JSON.parse(JSON.stringify(state));
  delete clone.history;
  state.history=Array.isArray(state.history)?state.history:[];
  state.history.push({label:label||'操作',state:clone});
  if(state.history.length>30)state.history.shift();
}
function undo(){
  if(!state||!state.history||!state.history.length)return notify('取り消せる操作がありません。');
  var h=state.history.pop(),keep=state.history;
  state=h.state; state.history=keep; save(); render();
  notify('「'+h.label+'」を取り消しました。','ok');
}

function ensurePage(){
  var main=document.querySelector('main');
  if(!main)return null;
  var page=byId(PAGE_ID);
  if(!page){
    page=document.createElement('section');
    page.id=PAGE_ID;
    page.className='page';
    main.appendChild(page);
  }
  page.addEventListener('click',handleClick,false);
  page.addEventListener('change',handleChange,false);
  page.addEventListener('input',function(){ if(!state)saveSetup(); },false);

  var nav=byId('matchday230Nav');
  if(!nav){
    nav=document.createElement('button');
    nav.id='matchday230Nav';
    nav.type='button';
    nav.textContent='🏟 試合会場モード';
    nav.addEventListener('click',open,false);
    var n=document.querySelector('nav');
    if(n){
      var login=Array.prototype.slice.call(n.querySelectorAll('button')).find(function(b){return b.textContent.indexOf('コーチログイン')>=0;});
      n.insertBefore(nav,login||null);
    }
  }
  var float=byId('matchday230Float');
  if(!float){
    float=document.createElement('button');
    float.id='matchday230Float';
    float.type='button';
    float.className='m230-float';
    float.textContent='🏟 試合会場モード';
    float.addEventListener('click',open,false);
    document.body.appendChild(float);
  }
  return page;
}
function open(){
  var page=ensurePage();
  if(typeof window.showPage==='function')window.showPage(PAGE_ID);
  render();
  setTimeout(function(){if(page)page.scrollIntoView({block:'start'});},20);
}
function steps(current){
  return '<div class="m230-steps">'+['試合情報','スタメン','開始前確認','ライブ記録','成績保存'].map(function(x,i){
    return '<span class="'+(i<=current?'on':'')+'">'+(i+1)+'. '+x+'</span>';
  }).join('')+'</div>';
}
function shell(title,step,body){
  return '<div class="m230-card"><header><div><small>🏟 MATCH DAY LIVE</small><h2>'+safe(title)+'</h2></div><b>'+today()+'</b></header><div class="m230-body">'+steps(step)+body+'</div></div>';
}
function avatar(p){
  return p.photo?'<img src="'+safe(p.photo)+'" alt="">':'<span class="m230-avatar">👤</span>';
}
function setupView(){
  var d=setupSaved(),n=roster().length;
  var opts=CATS.map(function(c){return '<option '+(d.category===c?'selected':'')+'>'+c+'</option>';}).join('');
  var body='<div class="m230-grid">'+
    '<label>カテゴリー<select id="m230cat">'+opts+'</select></label>'+
    '<label>対戦相手<input id="m230opp" value="'+safe(d.opponent||'')+'" placeholder="例：MOSTRO"></label>'+
    '<label>大会名<input id="m230comp" value="'+safe(d.competition||'')+'" placeholder="例：TRM"></label>'+
    '<label>会場<input id="m230venue" value="'+safe(d.venue||'')+'" placeholder="例：古堅南小学校"></label>'+
    '<label>人数制<select id="m230count"><option value="8">8人制</option><option value="11">11人制</option><option value="5">5人制</option></select></label>'+
    '<label>試合時間<select id="m230format"><option value="single-15">15分1本</option><option value="single-20" selected>20分1本</option><option value="single-25">25分1本</option><option value="half-15">15分ハーフ</option><option value="half-20">20分ハーフ</option></select></label>'+
  '</div>'+
  '<label class="m230-check"><input id="m230auto" type="checkbox" '+(d.auto===false?'':'checked')+'> 試合終了後、通常の試合入力・選手成績へ反映する</label>'+
  '<div class="m230-status '+(n?'ok':'error')+'">'+(n?'選手データ '+n+'名を読み込み済みです。':'選手データをまだ取得できていません。上部の「選手」を一度開いてください。')+'</div>'+
  '<div class="m230-features"><span>⚡ ワンタップ入力</span><span>⚽ 得点・アシスト</span><span>🔄 交代</span><span>🟨 警告</span><span>⏱ 出場時間自動集計</span></div>'+
  '<div class="m230-actions"><button type="button" class="primary" data-action="to-lineup">スタメン選択へ</button></div>';
  return shell('Ver.23.0.2 試合会場モード 完全版',0,body);
}
function parseFormat(v){
  var m={
    'single-15':['single',15,'15分1本'],
    'single-20':['single',20,'20分1本'],
    'single-25':['single',25,'25分1本'],
    'half-15':['half',15,'15分ハーフ'],
    'half-20':['half',20,'20分ハーフ']
  };
  return m[v]||m['single-20'];
}
function toLineup(){
  saveSetup();
  var cat=value('m230cat','U-12'),opp=String(value('m230opp','')).trim();
  if(!opp){notify('対戦相手を入力してください。');var e=byId('m230opp');if(e)e.focus();return;}
  var list=eligible(cat);
  if(!list.length){notify('選手データを取得できませんでした。上部の「選手」を一度開いてください。');return;}
  var starters=Number(value('m230count','8'));
  if(list.length<starters){notify('選択可能な選手は'+list.length+'名です。人数制を変更してください。');return;}
  var f=parseFormat(value('m230format','single-20'));
  state={
    version:'23.0.2',phase:'lineup',date:today(),category:cat,opponent:opp,
    competition:String(value('m230comp','')).trim(),venue:String(value('m230venue','')).trim(),
    starterCount:starters,matchType:f[0],periodMinutes:f[1],formatLabel:f[2],
    autoSave:byId('m230auto')?byId('m230auto').checked:true,
    selected:{},stats:{},events:[],history:[],period:f[0]==='half'?'前半':'1本',
    periodNo:1,running:false,runStartedAt:null,elapsedMs:0,gf:0,ga:0,finalized:false
  };
  list.forEach(function(p){
    state.selected[p.id]=false;
    state.stats[p.id]=Object.assign({},p,{starter:false,onField:false,activeMs:0,onAt:null,goals:0,assists:0,shots:0,yellow:0,red:0});
  });
  save();render();
}
function selectedCount(){return Object.keys(state.selected||{}).filter(function(id){return state.selected[id];}).length;}
function lineupView(){
  var players=Object.keys(state.stats).map(function(id){return state.stats[id];});
  var rows=players.map(function(p){
    var on=!!state.selected[p.id];
    return '<button type="button" class="m230-player '+(on?'selected':'')+'" data-player="'+safe(p.id)+'">'+avatar(p)+
      '<span><b>'+safe(p.name)+'</b><small>'+safe(p.category)+' / '+safe(p.position)+'</small></span>'+
      '<strong>'+(on?'選択中':'未選択')+'</strong></button>';
  }).join('');
  var body='<div class="m230-summary"><b>'+safe(state.category)+' vs '+safe(state.opponent)+'</b><span>選択 '+selectedCount()+' / '+state.starterCount+'名</span></div>'+
    '<div class="m230-list">'+rows+'</div>'+
    '<div class="m230-actions"><button type="button" data-action="back-setup">戻る</button><button type="button" class="primary" data-action="to-confirm">開始前確認へ</button></div>';
  return shell('STEP 2 / スタメン選択',1,body);
}
function toConfirm(){
  if(selectedCount()!==Number(state.starterCount)){notify('スタメンを'+state.starterCount+'名選択してください。');return;}
  Object.keys(state.stats).forEach(function(id){
    state.stats[id].starter=!!state.selected[id];
    state.stats[id].onField=!!state.selected[id];
  });
  state.phase='confirm';save();render();
}
function confirmView(){
  var starters=Object.keys(state.stats).map(function(id){return state.stats[id];}).filter(function(p){return p.starter;});
  var cards=starters.map(function(p){return '<div class="m230-mini">'+avatar(p)+'<span><b>'+safe(p.name)+'</b><small>'+safe(p.position)+'</small></span></div>';}).join('');
  var body='<div class="m230-matchinfo"><h3>'+safe(state.category)+'　古堅南FC vs '+safe(state.opponent)+'</h3><p>'+safe(state.formatLabel)+'／'+safe(state.competition||'大会名未設定')+'／'+safe(state.venue||'会場未設定')+'</p></div>'+
    '<h3>スタメン '+starters.length+'名</h3><div class="m230-minis">'+cards+'</div>'+
    '<div class="m230-actions"><button type="button" data-action="back-lineup">戻る</button><button type="button" class="primary" data-action="kickoff">試合開始</button></div>';
  return shell('STEP 3 / 開始前確認',2,body);
}
function kickoff(){
  snapshot('試合開始');
  state.phase='live';state.running=true;state.runStartedAt=now();
  Object.keys(state.stats).forEach(function(id){if(state.stats[id].onField)state.stats[id].onAt=0;});
  state.events.unshift({time:0,type:'試合開始',text:'試合開始'});
  save();render();startTimer();
}
function liveView(){
  var body='<div class="m230-score"><div><small>古堅南FC</small><strong>'+state.gf+'</strong></div><div><b id="m230clock">'+fmt(elapsed())+'</b><small>'+safe(state.period)+' / '+state.formatLabel+'</small></div><div><small>'+safe(state.opponent)+'</small><strong>'+state.ga+'</strong></div></div>'+
    '<div class="m230-actions center"><button type="button" data-action="pause">'+(state.running?'一時停止':'再開')+'</button><button type="button" class="danger" data-action="finish">試合終了</button></div>'+
    '<div class="m230-livebuttons"><button type="button" class="goal" data-event="goal">⚽ 得点</button><button type="button" data-event="assist">🎯 アシスト</button><button type="button" data-event="shot">🥅 シュート</button><button type="button" data-event="opp">相手得点</button><button type="button" data-event="sub">🔄 交代</button><button type="button" data-event="yellow">🟨 警告</button><button type="button" data-event="red">🟥 退場</button><button type="button" data-action="undo">↩ 取り消し</button></div>'+
    '<div class="m230-events">'+(state.events.length?state.events.map(function(e){return '<div><b>'+fmt(e.time)+'</b><span>'+safe(e.text)+'</span></div>';}).join(''):'<p>まだ記録はありません。</p>')+'</div>';
  return shell('LIVE MATCH　'+state.category+' vs '+state.opponent,3,body);
}
function onFieldPlayers(){return Object.keys(state.stats).map(function(id){return state.stats[id];}).filter(function(p){return p.onField;});}
function benchPlayers(){return Object.keys(state.stats).map(function(id){return state.stats[id];}).filter(function(p){return !p.onField;});}
function choose(title,list,callback){
  if(!list.length){notify('選択できる選手がいません。');return;}
  var names=list.map(function(p,i){return (i+1)+'. '+p.name;}).join('\n');
  var n=prompt(title+'\n'+names);
  var i=Number(n)-1;
  if(i>=0&&i<list.length)callback(list[i]);
}
function eventAction(type){
  if(!state||state.phase!=='live')return;
  if(type==='opp'){
    snapshot('相手得点');state.ga++;state.events.unshift({time:elapsed(),type:type,text:'相手得点'});save();render();return;
  }
  if(type==='sub'){
    choose('交代で退く選手の番号',onFieldPlayers(),function(outP){
      choose('交代で入る選手の番号',benchPlayers(),function(inP){
        snapshot('交代');
        var t=elapsed();
        if(outP.onAt!=null)outP.activeMs+=Math.max(0,t-outP.onAt);
        outP.onAt=null;outP.onField=false;
        inP.onField=true;inP.onAt=t;
        state.events.unshift({time:t,type:'交代',text:'交代：'+outP.name+' → '+inP.name});
        save();render();
      });
    });return;
  }
  choose('選手番号を入力してください',onFieldPlayers(),function(p){
    snapshot(type);
    if(type==='goal'){p.goals++;state.gf++;}
    if(type==='assist')p.assists++;
    if(type==='shot')p.shots++;
    if(type==='yellow')p.yellow++;
    if(type==='red'){p.red++;p.onField=false;if(p.onAt!=null){p.activeMs+=Math.max(0,elapsed()-p.onAt);p.onAt=null;}}
    var label={goal:'得点',assist:'アシスト',shot:'シュート',yellow:'警告',red:'退場'}[type];
    state.events.unshift({time:elapsed(),type:type,text:label+'：'+p.name});
    save();render();
  });
}
function pause(){
  snapshot(state.running?'一時停止':'再開');
  if(state.running){state.elapsedMs=elapsed();state.running=false;state.runStartedAt=null;}
  else{state.running=true;state.runStartedAt=now();}
  save();render();if(state.running)startTimer();
}
function finish(){
  if(!confirm('試合を終了して成績を確定しますか？'))return;
  var t=elapsed();
  if(state.running){state.elapsedMs=t;state.running=false;state.runStartedAt=null;}
  Object.keys(state.stats).forEach(function(id){
    var p=state.stats[id];
    if(p.onAt!=null){p.activeMs+=Math.max(0,t-p.onAt);p.onAt=null;}
    p.onField=false;
  });
  state.phase='save';state.finishedAt=new Date().toISOString();save();render();stopTimer();
}
function saveView(){
  var rows=Object.keys(state.stats).map(function(id){return state.stats[id];}).filter(function(p){
    return p.starter||p.activeMs||p.goals||p.assists||p.yellow||p.red;
  }).map(function(p){
    return '<tr><td>'+safe(p.name)+'</td><td>'+minutes(p.activeMs)+'分</td><td>'+p.goals+'</td><td>'+p.assists+'</td><td>'+p.yellow+'</td><td>'+p.red+'</td></tr>';
  }).join('');
  var body='<div class="m230-result"><h3>試合終了　古堅南FC '+state.gf+' - '+state.ga+' '+safe(state.opponent)+'</h3></div>'+
    '<div class="m230-tablewrap"><table><thead><tr><th>選手</th><th>出場</th><th>得点</th><th>アシスト</th><th>警告</th><th>退場</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<div class="m230-actions"><button type="button" class="primary" data-action="archive" id="m230saveBtn">試合・選手成績を保存して終了</button><button type="button" class="primary" data-action="new">次の試合を入力</button></div>';
  return shell('STEP 5 / 成績保存',4,body);
}
async function archiveAndClose(){
  if(!state)return;

  var btn=byId('m230saveBtn');
  if(btn){btn.disabled=true;btn.textContent='保存中…';}

  var completed=JSON.parse(JSON.stringify(state));
  var staff=false;
  try{staff=(typeof isStaff==='function' && isStaff());}catch(e){staff=false;}

  if(!staff){
    if(btn){btn.disabled=false;btn.textContent='試合・選手成績を保存して終了';}
    notify('Supabaseへ保存するには、管理者またはコーチでログインしてください。');
    return;
  }

  try{
    if(typeof sb==='undefined' || !sb)throw new Error('Supabase接続を確認できません。');
    if(typeof session==='undefined' || !session || !session.user)throw new Error('ログイン情報を確認できません。');

    var matchRow={
      match_date:completed.date,
      category:completed.category||'',
      competition:completed.competition||'',
      opponent:completed.opponent||'',
      venue:completed.venue||'',
      goals_for:Number(completed.gf||0),
      goals_against:Number(completed.ga||0),
      season:Number(String(completed.date||today()).slice(0,4)),
      memo:'試合会場モード Ver.23.0.2から登録',
      created_by:session.user.id
    };

    var matchResult=await sb.from('matches').insert(matchRow).select().single();

    // 古いDBでcategory列がない場合だけ、categoryを外して再試行
    if(matchResult.error && String(matchResult.error.message||'').toLowerCase().indexOf('category')>=0){
      delete matchRow.category;
      matchResult=await sb.from('matches').insert(matchRow).select().single();
    }
    if(matchResult.error)throw new Error('試合保存エラー：'+matchResult.error.message);

    var matchId=matchResult.data.id;
    var recordRows=Object.keys(completed.stats||{}).map(function(id){
      var p=completed.stats[id];
      var mins=Math.max(0,Math.round(Number(p.activeMs||0)/60000));
      var played=!!(p.starter || Number(p.activeMs||0)>0 || p.goals || p.assists || p.shots || p.yellow || p.red);
      return {
        match_id:matchId,
        player_id:p.id,
        played:played,
        minutes:mins,
        goals:Number(p.goals||0),
        assists:Number(p.assists||0),
        yellow:Number(p.yellow||0),
        red:Number(p.red||0),
        mvp:false,
        created_by:session.user.id
      };
    }).filter(function(r){return r.played;});

    if(recordRows.length){
      var recordResult=await sb.from('records').insert(recordRows);
      if(recordResult.error){
        // 試合だけ残る不整合を避けるため、新規試合も削除
        try{await sb.from('matches').delete().eq('id',matchId);}catch(ignore){}
        throw new Error('選手成績保存エラー：'+recordResult.error.message);
      }
    }

    try{
      var a=JSON.parse(localStorage.getItem(ARCHIVE_KEY)||'[]');
      completed.supabase_match_id=matchId;
      a.unshift(completed);
      localStorage.setItem(ARCHIVE_KEY,JSON.stringify(a.slice(0,100)));
    }catch(e){}

    try{
      window.dispatchEvent(new CustomEvent('furugen-matchday-complete',{detail:completed}));
    }catch(e){}

    // 通常の試合一覧・ランキングを最新化
    try{
      if(typeof loadAll==='function')await loadAll();
    }catch(e){console.warn('loadAll refresh',e);}

    state={
      version:'23.0.2',
      phase:'complete',
      date:completed.date,
      opponent:completed.opponent,
      gf:completed.gf,
      ga:completed.ga,
      matchId:matchId,
      recordCount:recordRows.length,
      savedAt:new Date().toISOString()
    };
    save();
    render();
    notify('試合と選手成績を保存しました。','ok');
  }catch(err){
    console.error('Ver23.0.2 save',err);
    if(btn){btn.disabled=false;btn.textContent='試合・選手成績を保存して終了';}
    notify(err && err.message ? err.message : '保存に失敗しました。');
  }
}
function completeView(){
  var body='<div class="m230-complete">'+
    '<div class="m230-complete-icon">✅</div>'+
    '<h3>保存が完了しました</h3>'+
    '<p>古堅南FC '+Number(state.gf||0)+' - '+Number(state.ga||0)+' '+safe(state.opponent||'対戦相手')+'</p>'+
    '<p>試合一覧へ1試合、選手成績へ'+Number(state.recordCount||0)+'名分を登録しました。</p>'+
    '</div>'+
    '<div class="m230-actions center">'+
    '<button type="button" class="primary" data-action="go-matches">試合一覧で確認</button>'+
    '<button type="button" data-action="new">次の試合を入力</button>'+
    '<button type="button" data-action="go-home">ホームへ戻る</button>'+
    '</div>';
  return shell('STEP 5 / 保存完了',4,body);
}
function newMatch(){state=null;save();render();}
function reset(){if(confirm('現在の試合記録を削除しますか？')){state=null;save();render();}}

function handleClick(e){
  var btn=e.target.closest('button');
  if(!btn||!byId(PAGE_ID)||!byId(PAGE_ID).contains(btn))return;
  e.preventDefault();e.stopPropagation();
  var a=btn.getAttribute('data-action');
  var player=btn.getAttribute('data-player');
  var ev=btn.getAttribute('data-event');
  if(a==='to-lineup')return toLineup();
  if(a==='back-setup'){state=null;save();return render();}
  if(a==='to-confirm')return toConfirm();
  if(a==='back-lineup'){state.phase='lineup';save();return render();}
  if(a==='kickoff')return kickoff();
  if(a==='pause')return pause();
  if(a==='finish')return finish();
  if(a==='undo')return undo();
  if(a==='archive')return archiveAndClose();
  if(a==='new')return newMatch();
  if(a==='go-matches'){
    state=null;save();
    if(typeof window.showPage==='function')window.showPage('matches');
    else{
      var matchBtn=Array.prototype.slice.call(document.querySelectorAll('nav button')).find(function(b){return b.textContent.trim()==='試合';});
      if(matchBtn)matchBtn.click();
    }
    return;
  }
  if(a==='go-home'){
    state=null;save();
    if(typeof window.showPage==='function')window.showPage('home');
    else{
      var homeBtn=Array.prototype.slice.call(document.querySelectorAll('nav button')).find(function(b){return b.textContent.indexOf('ホーム')>=0;});
      if(homeBtn)homeBtn.click();
    }
    return;
  }
  if(a==='reset')return reset();
  if(player&&state&&state.phase==='lineup'){
    var next=!state.selected[player];
    if(next&&selectedCount()>=Number(state.starterCount)){notify('選択できるのは'+state.starterCount+'名までです。');return;}
    state.selected[player]=next;save();return render();
  }
  if(ev)return eventAction(ev);
}
function handleChange(e){if(!state)saveSetup();}
function render(){
  var page=ensurePage();
  if(!page)return;
  if(!state)page.innerHTML=setupView();
  else if(state.phase==='lineup')page.innerHTML=lineupView();
  else if(state.phase==='confirm')page.innerHTML=confirmView();
  else if(state.phase==='live')page.innerHTML=liveView();
  else if(state.phase==='save')page.innerHTML=saveView();
  else if(state.phase==='complete')page.innerHTML=completeView();
  else page.innerHTML=setupView();
  updateWorkLabel();
}
function updateWorkLabel(){
  var candidates=document.querySelectorAll('.current-work, #currentWork, [data-current-work]');
  Array.prototype.forEach.call(candidates,function(el){el.textContent='🏟 試合会場モード';});
  Array.prototype.forEach.call(document.querySelectorAll('*'),function(el){
    if(el.children.length===0 && (el.textContent.trim()==='live24'||el.textContent.trim()==='matchday230'))el.textContent='🏟 試合会場モード';
  });
}
function startTimer(){
  stopTimer();
  timerId=setInterval(function(){
    var c=byId('m230clock');
    if(c&&state&&state.phase==='live')c.textContent=fmt(elapsed());
  },500);
}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null;}}

function init(){
  load();ensurePage();render();
  window.openMatchday230=open;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,false);
else init();
})();
