
(function(){
  const KEY='birthday_registry';
  let birthdayEntries=[];
  const byId=id=>document.getElementById(id);
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function parseRegistry(){
    let raw=(typeof teamSettings!=='undefined'&&teamSettings&&teamSettings[KEY])||localStorage.getItem('furugen_birthday_registry')||'[]';
    try{ if(typeof raw==='string') return JSON.parse(raw)||[]; if(Array.isArray(raw)) return raw; }catch(e){}
    return [];
  }
  function normalizeDate(v){
    if(!v)return''; const s=String(v); if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s; if(/^\d{2}-\d{2}$/.test(s))return '2000-'+s; return'';
  }
  function playerBirthdays(){
    if(typeof players==='undefined')return[];
    return players.map(p=>{const d=normalizeDate(p.birth_date||p.birthday||p.date_of_birth||'');return d?{id:'player-'+p.id,name:p.name,role:'選手',date:d,memo:p.grade||'',source:'players'}:null}).filter(Boolean);
  }
  function merged(){
    const custom=parseRegistry(); const map=new Map();
    playerBirthdays().forEach(x=>map.set(x.id,x)); custom.forEach(x=>map.set(x.id,x));
    return [...map.values()].filter(x=>x.name&&x.date);
  }
  function nextInfo(date){
    const now=new Date(); now.setHours(0,0,0,0); const p=String(date).split('-').map(Number); let next=new Date(now.getFullYear(),p[1]-1,p[2]); if(next<now)next=new Date(now.getFullYear()+1,p[1]-1,p[2]); const days=Math.round((next-now)/86400000); return{days,next};
  }
  function fmt(date){const p=String(date).split('-');return `${Number(p[1])}月${Number(p[2])}日`;}
  function upcomingEntries(limitDays=30){return merged().map(x=>({...x,...nextInfo(x.date)})).filter(x=>x.days<=limitDays).sort((a,b)=>a.days-b.days||a.name.localeCompare(b.name,'ja'));}
  function isStaffMode(){return typeof isStaff==='function'&&isStaff();}
  function setPublicPrivacy(staff){
    const card=byId('birthdays')?.querySelector('.birthday-center');
    const filter=card?.querySelector('.birthday-filter-row');
    const table=card?.querySelector('.table');
    if(filter)filter.classList.toggle('hidden',!staff);
    if(table)table.classList.toggle('hidden',!staff);
    const title=card?.querySelector('.section-title h2');
    const desc=card?.querySelector('.section-title .muted');
    if(title)title.textContent=staff?'🎂 誕生日管理':'🎂 近日の誕生日';
    if(desc)desc.textContent=staff?'選手・監督・コーチ・審判員を登録し、ホーム画面にお知らせを表示します。':'プライバシー保護のため、30日以内の誕生日だけを表示しています。';
  }
  function renderHome(){
    const box=byId('birthdayHomeContent'); if(!box)return; const list=upcomingEntries(30).slice(0,3); if(!list.length){box.innerHTML='<div class="birthday-empty">30日以内の誕生日登録はありません。</div>';return;}
    const today=list.filter(x=>x.days===0); let html=today.length?`<div class="birthday-today-banner">🎉 本日の誕生日：${today.map(x=>safe(x.name)+'さん').join('、')}</div>`:'';
    html+='<div class="birthday-grid">'+list.map(x=>`<div class="birthday-person ${x.days===0?'today':''}"><strong>${safe(x.name)}</strong><span class="role">${safe(x.role)}${x.memo?'・'+safe(x.memo):''}</span><div class="date">${fmt(x.date)}</div><div class="days">${x.days===0?'🎂 今日です！':x.days===1?'明日です':`あと${x.days}日`}</div></div>`).join('')+'</div>';
    box.innerHTML=html;
  }
  window.renderBirthdayCenter=function(){
    birthdayEntries=merged(); renderHome(); const body=byId('birthdayBody'),up=byId('birthdayUpcoming'); if(!body||!up)return;
    const staff=isStaffMode(); setPublicPrivacy(staff); byId('birthdayAddBtn')?.classList.toggle('hidden',!staff); const notice=byId('birthdayPermissionNotice'); if(notice){notice.classList.toggle('hidden',staff); notice.textContent='プライバシー保護のため、閲覧モードでは30日以内の誕生日のみ表示します。全員の確認・登録・編集はコーチログイン後に利用できます。';}
    const role=byId('birthdayRoleFilter')?.value||'',q=(byId('birthdaySearch')?.value||'').trim().toLowerCase();
    const list=birthdayEntries.map(x=>({...x,...nextInfo(x.date)})).filter(x=>(!role||x.role===role)&&(!q||x.name.toLowerCase().includes(q))).sort((a,b)=>a.days-b.days||a.name.localeCompare(b.name,'ja'));
    const near=list.filter(x=>x.days<=30).slice(0,staff?8:3); up.innerHTML=near.length?'<div class="birthday-grid">'+near.map(x=>`<div class="birthday-person ${x.days===0?'today':''}"><strong>${safe(x.name)}</strong><span class="role">${safe(x.role)}</span><div class="date">${fmt(x.date)}</div><div class="days">${x.days===0?'🎂 今日':`あと${x.days}日`}</div></div>`).join('')+'</div>':'<div class="birthday-empty">30日以内の誕生日はありません。</div>';
    body.innerHTML=staff?list.map(x=>`<tr><td>${safe(x.name)}</td><td>${safe(x.role)}</td><td>${fmt(x.date)}</td><td>${x.days===0?'今日':x.days+'日'}</td><td>${staff&&x.source!=='players'?`<button class="light" onclick="openBirthdayEditor('${safe(x.id)}')">編集</button> <button class="danger" onclick="deleteBirthdayEntry('${safe(x.id)}')">削除</button>`:x.source==='players'?'選手データ連動':'閲覧のみ'}</td></tr>`).join('')||'<tr><td colspan="5" class="muted">登録がありません。</td></tr>':' ';
  };
  window.openBirthdayEditor=function(id=''){
    if(!(typeof isStaff==='function'&&isStaff())){showMessage('コーチログイン後に登録できます。');return;}
    const custom=parseRegistry(),x=custom.find(v=>v.id===id); byId('birthdayEditId').value=x?.id||''; byId('birthdayName').value=x?.name||''; byId('birthdayRole').value=x?.role||'選手'; byId('birthdayDate').value=x?.date||''; byId('birthdayMemo').value=x?.memo||''; byId('birthdayModalTitle').textContent=x?'🎂 誕生日を編集':'🎂 誕生日を登録'; byId('birthdayModal').classList.remove('hidden');
  };
  window.closeBirthdayEditor=function(){byId('birthdayModal').classList.add('hidden');};
  window.saveBirthdayEntry=async function(){
    if(!(typeof isStaff==='function'&&isStaff()))return; const name=byId('birthdayName').value.trim(),role=byId('birthdayRole').value,date=byId('birthdayDate').value,memo=byId('birthdayMemo').value.trim(); if(!name||!date){showMessage('名前と誕生日を入力してください。');return;}
    const arr=parseRegistry(),id=byId('birthdayEditId').value||('bd-'+Date.now()); const row={id,name,role,date,memo,source:'registry'}; const i=arr.findIndex(x=>x.id===id); if(i>=0)arr[i]=row; else arr.push(row); const value=JSON.stringify(arr); localStorage.setItem('furugen_birthday_registry',value);
    try{const r=await sb.from('team_settings').upsert([{key:KEY,value,updated_at:new Date().toISOString()}]); if(r.error)throw r.error; teamSettings[KEY]=value; showMessage('誕生日を保存しました。','ok');}catch(e){showMessage('端末には保存しました。共有保存エラー：'+e.message);}
    closeBirthdayEditor(); renderBirthdayCenter();
  };
  window.deleteBirthdayEntry=async function(id){
    if(!(typeof isStaff==='function'&&isStaff()))return; if(!confirm('この誕生日登録を削除しますか？'))return; const arr=parseRegistry().filter(x=>x.id!==id),value=JSON.stringify(arr); localStorage.setItem('furugen_birthday_registry',value); try{const r=await sb.from('team_settings').upsert([{key:KEY,value,updated_at:new Date().toISOString()}]); if(r.error)throw r.error; teamSettings[KEY]=value;}catch(e){showMessage(e.message);} renderBirthdayCenter();
  };
  const oldRenderAll=window.renderAll; if(typeof oldRenderAll==='function'){window.renderAll=function(){const r=oldRenderAll.apply(this,arguments); setTimeout(()=>{renderHome(); if(byId('birthdays')?.classList.contains('show'))renderBirthdayCenter();},0); return r;};}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(renderHome,500)); window.addEventListener('pageshow',()=>setTimeout(renderHome,500));
})();
