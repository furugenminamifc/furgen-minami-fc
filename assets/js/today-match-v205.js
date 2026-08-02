/* Ver.20.5 今日の試合ワンタップ入力版 */
(function(){
  'use strict';
  const CATS=['U-12','U-11','U-10','U-9'];
  function staff(){try{return typeof isStaff==='function'&&!!isStaff()}catch(e){return false}}
  function today(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}
  function jaDate(s){const [y,m,d]=String(s).split('-');return y&&m&&d?`${y}/${Number(m)}/${Number(d)}`:s}
  function safe(v){try{return typeof esc==='function'?esc(v):String(v??'')}catch(e){return String(v??'')}}
  function category(m){return CATS.includes(String(m?.category||''))?m.category:'カテゴリー未設定'}
  function install(){
    const home=document.getElementById('home'); if(!home)return null;
    let panel=document.getElementById('todayMatchPanel');
    if(!panel){
      panel=document.createElement('div');panel.id='todayMatchPanel';panel.className='today-match-panel hidden';
      const birthday=document.getElementById('birthdayHomePanel');
      if(birthday&&birthday.parentNode)birthday.insertAdjacentElement('afterend',panel);else home.prepend(panel);
    }
    return panel;
  }
  function currentMatches(){try{return Array.isArray(matches)?matches.filter(m=>String(m.match_date||'')===today()):[]}catch(e){return []}}
  function openExisting(id){
    if(!staff())return;
    if(typeof openMatchEdit==='function')openMatchEdit(id);
  }
  function resetEntry(){
    try{if(typeof cancelMatchEdit==='function')cancelMatchEdit(false)}catch(e){}
    try{editingMatchId=''}catch(e){}
    ['competition','opponent','venue','matchMemo'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
    ['goalsFor','goalsAgainst'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=0});
    const d=document.getElementById('matchDate');if(d)d.value=today();
    const b=document.getElementById('saveMatchBtn');if(b)b.textContent='試合を保存';
    const c=document.getElementById('cancelMatchEditBtn');if(c)c.classList.add('hidden');
  }
  function openNew(cat){
    if(!staff())return;
    resetEntry();
    if(typeof showPage==='function')showPage('entry');
    setTimeout(()=>{
      const categorySelect=document.getElementById('matchCategory');
      if(categorySelect){categorySelect.value=cat;categorySelect.dispatchEvent(new Event('change',{bubbles:true}))}
      const opponent=document.getElementById('opponent');if(opponent)opponent.focus();
      try{if(typeof renderRecordInputs==='function')renderRecordInputs()}catch(e){}
      window.scrollTo({top:0,behavior:'smooth'});
    },80);
  }
  function render(){
    const panel=install();if(!panel)return;
    const ok=staff();panel.classList.toggle('hidden',!ok);if(!ok)return;
    const list=currentMatches();
    const cards=list.map(m=>`<div class="today-match-card"><div class="today-match-main"><div class="today-match-title"><span class="today-cat">${safe(category(m))}</span><span>${safe(m.opponent||'対戦相手未設定')}</span></div><div class="today-match-meta">${safe(m.competition||'通常試合')} ${m.venue?`・ ${safe(m.venue)}`:''}</div></div><div><div class="today-match-score">${Number(m.goals_for||0)} - ${Number(m.goals_against||0)}</div><button type="button" data-today-edit="${safe(m.id)}">入力・編集</button></div></div>`).join('');
    panel.innerHTML=`<div class="today-match-head"><div><small>⚽ One Tap Match Entry</small><h2>今日の試合</h2></div><div class="today-match-date">${jaDate(today())}</div></div><div class="today-match-body"><div class="today-match-list">${cards||'<div class="today-match-empty">今日の試合はまだ登録されていません。下のカテゴリーを押すと、日付を今日に設定して入力画面を開きます。</div>'}</div><div class="today-new-wrap"><div class="today-new-label">今日の試合を新規入力</div><div class="today-new-category">${CATS.map(c=>`<button type="button" data-today-new="${c}">${c}</button>`).join('')}</div><div class="today-match-note">登録済みの試合は「入力・編集」から直接開けます。選手記録・得点・出場時間まで同じ画面で入力できます。</div></div></div>`;
  }
  document.addEventListener('click',e=>{
    const edit=e.target.closest&&e.target.closest('[data-today-edit]');if(edit){openExisting(edit.dataset.todayEdit);return}
    const add=e.target.closest&&e.target.closest('[data-today-new]');if(add)openNew(add.dataset.todayNew);
  });
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(render,350);setTimeout(render,1300)});
  window.addEventListener('pageshow',render);
  setInterval(render,1500);
  window.renderTodayMatchPanel=render;
})();
