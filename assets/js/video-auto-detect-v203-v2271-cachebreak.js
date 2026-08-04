/* Ver.20.3 AI自動検出テスト版
   ブラウザ内の画像処理で「現在フレームのボール候補」を提案するテスト機能。
   完全自動AIではなく、色サンプル＋連結領域による候補検出。採用前に必ず人が確認する。 */
(function(){
'use strict';
const TRACK_KEY='furugen-video-tracking-v202';
let video=null, canvas=null, ctx=null, marker=null, frameReady=false, sample=null, candidate=null, lastCandidate=null;
const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const fmt=s=>`${String(Math.floor((s||0)/60)).padStart(2,'0')}:${String(Math.floor((s||0)%60)).padStart(2,'0')}`;
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(16).slice(2)}
function currentVideo(){return document.getElementById('video16Player')||document.querySelector('.video181-flow video, #v202VideoHost video, video')}
function setStatus(t){const e=$('v203Status');if(e)e.textContent=t}
function install(){
 if($('video203Panel')){bindVideo();return}
 const anchor=$('video202Panel'); if(!anchor)return;
 const panel=document.createElement('section'); panel.id='video203Panel'; panel.className='v203-panel';
 panel.innerHTML=`<div class="v203-head"><div><span>Ver.20.3 AI自動検出テスト</span><h3>🤖 現在フレームからボール候補を探す</h3><p>映像内のボールを1回教えると、近い色・大きさ・形の候補を自動提案します。</p></div><b class="v203-badge">AI候補＋人の確認</b></div>
 <div class="v203-guide">手順：①フレーム取得 → ②画像のボールをタップ → ③候補検出 → ④正しければ採用</div>
 <div class="v203-actions"><button id="v203Capture" class="primary">① 現在フレーム取得</button><button id="v203Detect">③ 候補を検出</button><button id="v203Accept" class="accept" disabled>④ 候補を採用</button><button id="v203Reset" class="danger">学習をリセット</button></div>
 <div class="v203-grid"><div class="v203-card"><h4>② 画像内のボールをタップ</h4><div class="v203-canvas-wrap"><canvas id="v203Canvas" width="640" height="360"></canvas><i id="v203Marker" class="v203-marker"></i></div><p class="v203-note">動画は端末内で処理され、外部へ送信しません。明るさや芝の色で候補がずれる場合があります。</p></div>
 <div class="v203-card"><h4>検出状況</h4><div id="v203Status" class="v203-status">まず動画を選び、現在フレームを取得してください。</div><div class="v203-kpis"><span>学習色<br><b id="v203Color">未設定</b></span><span>候補位置<br><b id="v203Pos">未検出</b></span><span>候補サイズ<br><b id="v203Size">-</b></span><span>動画時刻<br><b id="v203Time">00:00</b></span></div></div></div>`;
 anchor.insertAdjacentElement('afterend',panel);
 canvas=$('v203Canvas');ctx=canvas.getContext('2d',{willReadFrequently:true});marker=$('v203Marker');
 $('v203Capture').addEventListener('click',capture);$('v203Detect').addEventListener('click',detect);$('v203Accept').addEventListener('click',accept);$('v203Reset').addEventListener('click',reset);canvas.addEventListener('pointerdown',learn);
 bindVideo();
}
function bindVideo(){video=currentVideo();}
function capture(){
 bindVideo(); if(!video||!video.src){alert('先に動画を選択してください。');return}
 if(video.readyState<2){alert('動画の読み込みが終わってから、もう一度押してください。');return}
 const vw=video.videoWidth||640,vh=video.videoHeight||360,maxW=720;const scale=Math.min(1,maxW/vw);canvas.width=Math.max(2,Math.round(vw*scale));canvas.height=Math.max(2,Math.round(vh*scale));ctx.drawImage(video,0,0,canvas.width,canvas.height);frameReady=true;candidate=null;hideMarker();$('v203Accept').disabled=true;$('v203Time').textContent=fmt(video.currentTime);setStatus('フレームを取得しました。画像内のボール中心をタップしてください。');
}
function learn(ev){
 if(!frameReady)return;const r=canvas.getBoundingClientRect();const x=clamp(Math.round((ev.clientX-r.left)*canvas.width/r.width),0,canvas.width-1),y=clamp(Math.round((ev.clientY-r.top)*canvas.height/r.height),0,canvas.height-1);
 const d=ctx.getImageData(Math.max(0,x-2),Math.max(0,y-2),Math.min(5,canvas.width-x+2),Math.min(5,canvas.height-y+2)).data;let rr=0,gg=0,bb=0,n=0;for(let i=0;i<d.length;i+=4){rr+=d[i];gg+=d[i+1];bb+=d[i+2];n++}sample={r:rr/n,g:gg/n,b:bb/n,x,y};
 const c=`rgb(${sample.r|0},${sample.g|0},${sample.b|0})`;$('v203Color').innerHTML=`<i class="v203-swatch" style="background:${c}"></i>${sample.r|0},${sample.g|0},${sample.b|0}`;showMarker(x/canvas.width,y/canvas.height);setStatus('ボール色を学習しました。「候補を検出」を押してください。');
}
function detect(){
 if(!frameReady){capture();return} if(!sample){alert('先に画像内のボールをタップしてください。');return}
 const W=180,H=Math.max(90,Math.round(canvas.height*180/canvas.width)),tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;const tc=tmp.getContext('2d',{willReadFrequently:true});tc.drawImage(canvas,0,0,W,H);const im=tc.getImageData(0,0,W,H),d=im.data,mask=new Uint8Array(W*H);const tol=72;
 for(let i=0,p=0;i<d.length;i+=4,p++){const dr=d[i]-sample.r,dg=d[i+1]-sample.g,db=d[i+2]-sample.b;const dist=Math.sqrt(dr*dr+dg*dg+db*db);const lum=(d[i]+d[i+1]+d[i+2])/3;if(dist<tol && lum>45)mask[p]=1}
 const seen=new Uint8Array(mask.length), comps=[];const dirs=[1,-1,W,-W];
 for(let p=0;p<mask.length;p++){if(!mask[p]||seen[p])continue;let q=[p],head=0,count=0,sx=0,sy=0,minx=W,maxx=0,miny=H,maxy=0;seen[p]=1;while(head<q.length){const a=q[head++],x=a%W,y=(a/W)|0;count++;sx+=x;sy+=y;minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);for(const dd of dirs){const b=a+dd;if(b<0||b>=mask.length||seen[b]||!mask[b])continue;if((dd===1||dd===-1)&&Math.abs((b%W)-x)>1)continue;seen[b]=1;q.push(b)}}if(count>=2&&count<=260){const bw=maxx-minx+1,bh=maxy-miny+1,ratio=Math.min(bw,bh)/Math.max(bw,bh),fill=count/(bw*bh);if(bw<=34&&bh<=34&&ratio>.35&&fill>.12)comps.push({count,x:sx/count,y:sy/count,bw,bh,ratio,fill})}}
 if(!comps.length){candidate=null;$('v203Accept').disabled=true;hideMarker();setStatus('候補が見つかりませんでした。フレームを取り直し、ボール中心をもう一度タップしてください。');$('v203Pos').textContent='未検出';$('v203Size').textContent='-';return}
 const tx=lastCandidate?lastCandidate.x*W:sample.x/canvas.width*W,ty=lastCandidate?lastCandidate.y*H:sample.y/canvas.height*H;
 comps.forEach(c=>{const dist=Math.hypot(c.x-tx,c.y-ty);c.score=c.ratio*35+c.fill*25-Math.abs(c.count-18)*.35-dist*.12});comps.sort((a,b)=>b.score-a.score);const best=comps[0];candidate={x:best.x/W,y:best.y/H,size:best.count,score:best.score};showMarker(candidate.x,candidate.y);$('v203Pos').textContent=`X${(candidate.x*100).toFixed(0)}% / Y${(candidate.y*100).toFixed(0)}%`;$('v203Size').textContent=best.count+'px';$('v203Accept').disabled=false;setStatus('黄色い丸がAI候補です。正しければ「候補を採用」。違う場合は本当のボールをタップして再検出してください。');
}
function accept(){
 if(!candidate||!video)return;let arr=[];try{arr=JSON.parse(localStorage.getItem(TRACK_KEY)||'[]');if(!Array.isArray(arr))arr=[]}catch(e){arr=[]}
 arr.push({id:uid(),time:Number(video.currentTime||0),type:'ball',x:+candidate.x.toFixed(5),y:+candidate.y.toFixed(5),created_at:new Date().toISOString(),source:'v203-auto-candidate'});arr.sort((a,b)=>a.time-b.time);localStorage.setItem(TRACK_KEY,JSON.stringify(arr));lastCandidate={x:candidate.x,y:candidate.y};window.dispatchEvent(new CustomEvent('furugen:v202-updated'));setStatus(`候補をボール位置として採用しました（${fmt(video.currentTime)}）。動画を進めて再びフレーム取得してください。`);$('v203Accept').disabled=true;
}
function reset(){sample=null;candidate=null;lastCandidate=null;frameReady=false;ctx.clearRect(0,0,canvas.width,canvas.height);hideMarker();$('v203Color').textContent='未設定';$('v203Pos').textContent='未検出';$('v203Size').textContent='-';$('v203Accept').disabled=true;setStatus('学習をリセットしました。現在フレームを取得してください。')}
function showMarker(x,y){marker.style.left=(x*100)+'%';marker.style.top=(y*100)+'%';marker.style.display='block'}function hideMarker(){if(marker)marker.style.display='none'}
document.addEventListener('DOMContentLoaded',install);window.addEventListener('pageshow',install);setTimeout(install,1600);
})();
