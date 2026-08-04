/* Ver.20.4.2 コーチ専用メニュー・試合入力権限制御版 */
(function(){
  'use strict';
  const COACH_ONLY_PAGES=new Set(['entry','reports','ai','coach','ver7','ver19','backup','settings']);
  const PAGE_LABELS={entry:'試合入力',reports:'レポート',ai:'AI',coach:'AI Coach',ver7:'Ver.7 AI分析',ver19:'Ver.20',backup:'データ保護',settings:'チーム設定'};
  function staff(){
    try{return typeof window.isStaff==='function'&&!!window.isStaff()}catch(e){return false}
  }
  function pageFromButton(btn){
    const text=String(btn.getAttribute('onclick')||'');
    const m=text.match(/showPage\(['"]([^'"]+)['"]\)/);
    return m?m[1]:'';
  }
  function applyMenuPermissions(){
    document.querySelectorAll('nav button').forEach(btn=>{
      const page=pageFromButton(btn);
      if(!COACH_ONLY_PAGES.has(page))return;
      btn.dataset.coachOnly='true';
      btn.classList.toggle('coach-only-hidden',!staff());
      btn.setAttribute('aria-hidden',staff()?'false':'true');
      btn.tabIndex=staff()?0:-1;
    });
  }
  function accessMessage(page){
    const old=document.querySelector('.coach-access-notice');if(old)old.remove();
    const box=document.createElement('div');
    box.className='coach-access-notice';
    box.innerHTML='🔒 '+(PAGE_LABELS[page]||'この機能')+'はコーチ専用です。<small>コーチログイン後に利用できます。</small>';
    document.body.appendChild(box);
    setTimeout(()=>box.remove(),3200);
  }
  function installGuard(){
    if(typeof window.showPage!=='function'||window.__coachPermissionGuardInstalled)return false;
    const original=window.showPage;
    window.showPage=function(page){
      if(COACH_ONLY_PAGES.has(page)&&!staff()){
        accessMessage(page);
        return original('home');
      }
      return original.apply(this,arguments);
    };
    window.__coachPermissionGuardInstalled=true;
    return true;
  }
  function enforceCurrentPage(){
    if(staff())return;
    document.querySelectorAll('.page.show').forEach(el=>{
      if(COACH_ONLY_PAGES.has(el.id)&&typeof window.showPage==='function'){
        accessMessage(el.id);window.showPage('home');
      }
    });
  }
  function refresh(){installGuard();applyMenuPermissions();enforceCurrentPage()}
  document.addEventListener('DOMContentLoaded',()=>{refresh();setTimeout(refresh,300);setTimeout(refresh,1200)});
  window.addEventListener('pageshow',refresh);
  document.addEventListener('click',e=>{
    const btn=e.target.closest&&e.target.closest('nav button');
    if(!btn)return;
    setTimeout(refresh,50);
  });
  setInterval(refresh,1000);
})();
