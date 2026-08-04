/* Ver.20.0.3 現在位置表示・操作改善版 */
(function(){
  'use strict';
  const pageNames={
    home:'🏠 ホーム',birthdays:'🎂 誕生日',players:'👤 選手',matches:'⚽ 試合',entry:'✍️ 試合入力',
    ranking:'🏆 ランキング',analytics:'📊 試合分析',reports:'📄 レポート',video:'🎥 動画メモ',
    'video181-record':'🎥 動画記録',ai:'🤖 AI',coach:'🧠 AI Coach',ver7:'🚀 Ver.7 AI分析',
    ver19:'🚀 Ver.20',backup:'🛡️ データ保護',settings:'⚙️ チーム設定',login:'🔐 コーチログイン'
  };
  let originalShowPage=null;

  function createBanner(){
    if(document.getElementById('currentWorkBanner'))return;
    const nav=document.querySelector('body > nav');
    if(!nav)return;
    const banner=document.createElement('div');
    banner.id='currentWorkBanner';
    banner.className='current-work-banner';
    banner.setAttribute('role','status');
    banner.setAttribute('aria-live','polite');
    banner.innerHTML='<div><div class="current-work-label">現在の作業</div><div id="currentWorkName" class="current-work-name">🏠 ホーム</div></div><div class="current-work-help">黄色い枠のメニューを作業中です</div>';
    nav.insertAdjacentElement('afterend',banner);
  }

  function pageIdFromButton(button){
    const code=button.getAttribute('onclick')||'';
    const match=code.match(/showPage\(['"]([^'"]+)['"]\)/);
    return match?match[1]:'';
  }

  function updateCurrentLocation(id,options){
    const name=pageNames[id]||id||'ホーム';
    const label=document.getElementById('currentWorkName');
    if(label)label.textContent=name;
    document.querySelectorAll('body > nav button').forEach(function(button){
      const active=pageIdFromButton(button)===id;
      button.classList.toggle('location-active',active);
      if(active){
        button.setAttribute('aria-current','page');
        if(options&&options.scrollMenu!==false){
          try{button.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});}catch(e){}
        }
      }else button.removeAttribute('aria-current');
    });
    try{sessionStorage.setItem('furugen-current-page',id);}catch(e){}
  }

  function installWrapper(){
    if(typeof window.showPage!=='function')return false;
    if(window.showPage.__locationV2003)return true;
    originalShowPage=window.showPage;
    const wrapped=function(id){
      const result=originalShowPage.apply(this,arguments);
      updateCurrentLocation(id,{scrollMenu:true});
      return result;
    };
    wrapped.__locationV2003=true;
    window.showPage=wrapped;
    return true;
  }

  function detectVisiblePage(){
    const visible=document.querySelector('.page.show');
    return visible&&visible.id?visible.id:'home';
  }

  function init(){
    createBanner();
    let tries=0;
    const timer=setInterval(function(){
      tries++;
      if(installWrapper()||tries>40){
        clearInterval(timer);
        updateCurrentLocation(detectVisiblePage(),{scrollMenu:false});
      }
    },50);
    document.addEventListener('click',function(event){
      const button=event.target.closest('body > nav button');
      if(!button)return;
      const id=pageIdFromButton(button);
      if(id)setTimeout(function(){updateCurrentLocation(id,{scrollMenu:true});},0);
    });
    window.addEventListener('pageshow',function(){
      setTimeout(function(){updateCurrentLocation(detectVisiblePage(),{scrollMenu:false});},80);
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
