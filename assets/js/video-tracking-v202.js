/* Ver.20.2 動画AI半自動追跡版
   利用者が動画上をタップして、ボール・味方・相手の位置を動画時刻と同期保存する。
   自動物体認識ではなく、補助付き半自動追跡。 */
(function(){
'use strict';
const KEY='furugen-video-tracking-v202';
const TYPES={ball:{label:'ボール',icon:'🔴'},home:{label:'古堅南FC',icon:'🔵'},away:{label:'相手',icon:'🟠'}};
let points=[], selected='ball', overlay=null, pitch=null, ctx=null, video=null, resizeObserver=null;
const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmt(sec){sec=Math.max(0,Number(sec)||0);return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(Math.floor(sec%60)).padStart(2,'0')}`}
function uid(){return (crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(16).slice(2))}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
function save(){localStorage.setItem(KEY,JSON.stringify(points));}
function currentVideo(){return document.getElementById('video16Player')||document.querySelector('.video181-flow video, video')}
function setStatus(text){const e=$('v202Status');if(e)e.textContent=text}
function install(){
 if($('video202Panel')){bindVideo();return}
 const anchor=$('video201Panel')||document.querySelector('.video181-flow'); if(!anchor)return;
 const section=document.createElement('section'); section.id='video202Panel'; section.className='v202-panel';
 section.innerHTML=`
 <div class="v202-head"><div><span>Ver.20.2 半自動追跡</span><h3>🎯 動画をタップして位置を記録</h3><p>ボール・古堅南FC・相手を選び、動画上の位置をタップします。動画時刻と座標を同期保存します。</p></div><b>補助付き追跡</b></div>
 <div class="v202-warning">完全自動認識ではありません。コーチが確認しながら記録することで、確実な軌跡・ヒートマップを作成します。</div>
 <div class="v202-toolbar" role="group" aria-label="記録対象">
  <button data-v202-type="ball" class="active">🔴 ボール</button><button data-v202-type="home">🔵 古堅南FC</button><button data-v202-type="away">🟠 相手</button>
  <button id="v202Undo" class="secondary">↩ 1つ戻す</button><button id="v202Clear" class="danger">全消去</button>
 </div>
 <div class="v202-grid">
  <div class="v202-card"><h4>① 動画上で位置をタップ</h4><div id="v202VideoHost" class="v202-video-host"><div id="v202Overlay" class="v202-overlay" aria-label="動画追跡オーバーレイ"></div></div><div id="v202Status" class="v202-status">動画を選択すると追跡できます。</div></div>
  <div class="v202-card"><h4>② 縦向きコートで確認</h4><canvas id="v202Pitch" width="420" height="620"></canvas><div class="v202-kpis"><span>総点 <b id="v202Total">0</b></span><span>ボール <b id="v202Ball">0</b></span><span>味方 <b id="v202Home">0</b></span><span>相手 <b id="v202Away">0</b></span></div></div>
 </div>
 <div class="v202-card"><div class="v202-section-title"><h4>③ 軌跡・ヒートマップ</h4><div><button id="v202Trail">軌跡表示</button><button id="v202Heat" class="secondary">ヒートマップ</button><button id="v202Export" class="secondary">JSON保存</button></div></div><div id="v202Timeline" class="v202-timeline"></div></div>`;
 anchor.insertAdjacentElement('afterend',section);
 points=load(); overlay=$('v202Overlay'); pitch=$('v202Pitch'); ctx=pitch.getContext('2d');
 section.querySelectorAll('[data-v202-type]').forEach(btn=>btn.addEventListener('click',()=>selectType(btn.dataset.v202Type)));
 $('v202Undo').addEventListener('click',undo); $('v202Clear').addEventListener('click',clearAll); $('v202Trail').addEventListener('click',()=>drawPitch('trail')); $('v202Heat').addEventListener('click',()=>drawPitch('heat')); $('v202Export').addEventListener('click',exportJson);
 overlay.addEventListener('pointerdown',recordPoint);
 bindVideo(); render();
 window.addEventListener('resize',syncOverlay,{passive:true});
 }
function bindVideo(){
 video=currentVideo(); if(!video)return;
 const host=$('v202VideoHost'), ov=$('v202Overlay'); if(!host||!ov)return;
 if(video.parentElement!==host){host.insertBefore(video,ov);}
 video.setAttribute('playsinline',''); syncOverlay();
 if(resizeObserver)resizeObserver.disconnect();
 if(window.ResizeObserver){resizeObserver=new ResizeObserver(syncOverlay);resizeObserver.observe(video)}
 video.addEventListener('loadedmetadata',syncOverlay,{passive:true});
 video.addEventListener('timeupdate',()=>{setStatus(`動画時刻 ${fmt(video.currentTime)}｜${TYPES[selected].label}の位置をタップ`);drawOverlay()},{passive:true});
 }
function syncOverlay(){if(!video||!overlay)return; overlay.style.width=video.clientWidth+'px';overlay.style.height=video.clientHeight+'px';drawOverlay()}
function selectType(type){if(!TYPES[type])return;selected=type;document.querySelectorAll('[data-v202-type]').forEach(b=>b.classList.toggle('active',b.dataset.v202Type===type));setStatus(`${TYPES[type].icon} ${TYPES[type].label}を選択中｜動画上の位置をタップしてください。`)}
function recordPoint(ev){
 if(!video||!video.src){alert('先に動画を選択してください。');return}
 const r=overlay.getBoundingClientRect(); if(!r.width||!r.height)return;
 const x=clamp((ev.clientX-r.left)/r.width,0,1), y=clamp((ev.clientY-r.top)/r.height,0,1);
 points.push({id:uid(),time:Number(video.currentTime||0),type:selected,x:+x.toFixed(5),y:+y.toFixed(5),created_at:new Date().toISOString()});
 points.sort((a,b)=>a.time-b.time);save();render();
 }
function undo(){if(!points.length)return;points.pop();save();render()}
function clearAll(){if(confirm('Ver.20.2の位置記録をすべて削除しますか？')){points=[];save();render()}}
function visiblePoints(){if(!video)return points;const t=Number(video.currentTime||0);return points.filter(p=>Math.abs(p.time-t)<=1.5)}
function drawOverlay(){if(!overlay)return;overlay.innerHTML='';visiblePoints().forEach(p=>{const dot=document.createElement('button');dot.className='v202-dot '+p.type;dot.style.left=(p.x*100)+'%';dot.style.top=(p.y*100)+'%';dot.title=`${TYPES[p.type].label} ${fmt(p.time)}`;dot.addEventListener('click',e=>{e.stopPropagation();removePoint(p.id)});overlay.appendChild(dot)})}
function removePoint(id){points=points.filter(p=>p.id!==id);save();render()}
function drawField(){
 const w=pitch.width,h=pitch.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#18794e';ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(255,255,255,.92)';ctx.lineWidth=3;ctx.strokeRect(12,12,w-24,h-24);ctx.beginPath();ctx.moveTo(12,h/2);ctx.lineTo(w-12,h/2);ctx.stroke();ctx.beginPath();ctx.arc(w/2,h/2,55,0,Math.PI*2);ctx.stroke();
 ctx.strokeRect(w*.22,12,w*.56,105);ctx.strokeRect(w*.36,12,w*.28,50);ctx.strokeRect(w*.22,h-117,w*.56,105);ctx.strokeRect(w*.36,h-62,w*.28,50);
 }
function drawPitch(mode='trail'){
 if(!ctx)return;drawField();
 if(mode==='heat'){
  points.forEach(p=>{const x=12+p.x*(pitch.width-24),y=12+p.y*(pitch.height-24);const g=ctx.createRadialGradient(x,y,0,x,y,38);g.addColorStop(0,p.type==='ball'?'rgba(239,68,68,.55)':p.type==='home'?'rgba(59,130,246,.48)':'rgba(249,115,22,.48)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(x-40,y-40,80,80)});return;
 }
 Object.keys(TYPES).forEach(type=>{const arr=points.filter(p=>p.type===type).sort((a,b)=>a.time-b.time);ctx.strokeStyle=type==='ball'?'#ef4444':type==='home'?'#3b82f6':'#f97316';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=3;ctx.beginPath();arr.forEach((p,i)=>{const x=12+p.x*(pitch.width-24),y=12+p.y*(pitch.height-24);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)});ctx.stroke();arr.forEach(p=>{const x=12+p.x*(pitch.width-24),y=12+p.y*(pitch.height-24);ctx.beginPath();ctx.arc(x,y,type==='ball'?5:7,0,Math.PI*2);ctx.fill()})});
 }
function render(){
 const count=t=>points.filter(p=>p.type===t).length;[['v202Total',points.length],['v202Ball',count('ball')],['v202Home',count('home')],['v202Away',count('away')]].forEach(([id,n])=>{const e=$(id);if(e)e.textContent=n});
 const box=$('v202Timeline');if(box)box.innerHTML=points.length?points.slice().reverse().slice(0,100).map(p=>`<div class="v202-row"><button class="v202-time" data-time="${p.time}">${fmt(p.time)}</button><span>${TYPES[p.type].icon} ${TYPES[p.type].label}</span><small>X ${(p.x*100).toFixed(0)}% / Y ${(p.y*100).toFixed(0)}%</small><button class="danger" data-delete="${esc(p.id)}">削除</button></div>`).join(''):'<p class="muted">まだ位置記録はありません。</p>';
 if(box){box.querySelectorAll('[data-time]').forEach(b=>b.addEventListener('click',()=>{if(video){video.currentTime=Number(b.dataset.time);video.scrollIntoView({behavior:'smooth',block:'center'})}}));box.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>removePoint(b.dataset.delete)))}
 drawOverlay();drawPitch('trail');
 }
function exportJson(){const payload={version:'20.2.0',exported_at:new Date().toISOString(),mode:'assisted_tracking',points};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`furugen-tracking-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
document.addEventListener('DOMContentLoaded',install);window.addEventListener('pageshow',install);setTimeout(install,1200);
})();
