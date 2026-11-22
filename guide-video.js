/* © 2026 영쌤클래스 · 교육용으로 제작 · 무단 복제·재배포 금지 */
/* 사용 설명 영상: [data-open-guide]가 붙은 단추를 누를 때만 열린다. 자동으로 뜨지 않는다. */
(function(){'use strict';
var G={"src": "intro/guide.mp4", "poster": "intro/guide-poster.jpg", "title": "수업 실행 도우미", "color": "#4F56D2", "duration": 226, "chapters": [[4.2, "준비", "시작하기"], [19.62, "1", "설계안 넣기"], [50.23, "2", "분석 검토"], [72.48, "3", "일정 확정"], [89.22, "4", "오늘의 수업"], [127.39, "5", "자료 보관함"], [171.27, "6", "수업 일정"], [195.15, "7", "수업 기록"]]},dlg=null,video=null;
function css(){var s=document.createElement('style');s.textContent=
'.gv-dlg{border:0;padding:0;border-radius:18px;width:min(980px,94vw);max-height:92vh;background:#fff;color:#1c2030;box-shadow:0 30px 80px -20px rgba(0,0,0,.5);overflow:auto;font-family:inherit}'+
'.gv-dlg::backdrop{background:rgba(15,18,30,.6)}'+
'.gv-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-bottom:1px solid #e3e6ee}'+
'.gv-head strong{font-size:17px;font-weight:800}.gv-head small{display:block;font-size:12.5px;font-weight:500;color:#6a7286;margin-top:2px}'+
'.gv-x{border:1px solid #d5d9e4;background:#fff;color:#1c2030;border-radius:10px;padding:7px 14px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;flex:none}'+
'.gv-video{display:block;width:100%;aspect-ratio:16/9;background:#11141f}'+
'.gv-body{padding:14px 18px 18px}.gv-lab{font-size:13px;font-weight:800;color:#6a7286;margin:0 0 8px}'+
'.gv-chaps{display:flex;flex-wrap:wrap;gap:7px}'+
'.gv-chap{border:1px solid #d5d9e4;background:#f6f7fb;color:#1c2030;border-radius:999px;padding:6px 12px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit;line-height:1.3}'+
'.gv-chap b{color:'+G.color+';margin-right:6px;font-weight:800}.gv-chap.on{background:'+G.color+';border-color:'+G.color+';color:#fff}.gv-chap.on b{color:#fff}'+
'.gv-note{font-size:12.5px;color:#6a7286;margin:12px 0 0;line-height:1.6}'+
'@media print{.gv-dlg{display:none!important}}';
document.head.appendChild(s)}
function fmt(t){t=Math.floor(t);return Math.floor(t/60)+':'+('0'+t%60).slice(-2)}
function build(){css();dlg=document.createElement('dialog');dlg.className='gv-dlg';dlg.setAttribute('aria-label','사용 설명 영상');
  dlg.innerHTML='<div class="gv-head"><div><strong>사용 설명 영상</strong><small>'+G.title+' · '+fmt(G.duration)+' · 처음부터 차례대로 따라 할 수 있습니다</small></div><button type="button" class="gv-x">닫기</button></div>'+
  '<video class="gv-video" controls playsinline preload="none" poster="'+G.poster+'"></video>'+
  '<div class="gv-body"><p class="gv-lab">보고 싶은 단계로 바로 가기</p><div class="gv-chaps">'+G.chapters.map(function(c,i){return'<button type="button" class="gv-chap" data-i="'+i+'"><b>'+c[1]+'</b>'+c[2]+'</button>'}).join('')+'</div>'+
  '<p class="gv-note">영상을 멈춰 가며 같은 순서로 눌러 보세요. 소리가 없어도 자막만으로 따라 할 수 있습니다.<br>© 2026 영쌤클래스 · 교육용으로 제작 · 무단 복제·재배포 금지</p></div>';
  document.body.appendChild(dlg);video=dlg.querySelector('video');
  dlg.querySelector('.gv-x').addEventListener('click',function(){dlg.close()});
  dlg.addEventListener('close',function(){video.pause()});
  dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
  dlg.querySelectorAll('.gv-chap').forEach(function(b){b.addEventListener('click',function(){var t=G.chapters[+b.dataset.i][0];if(!video.getAttribute('src'))video.src=G.src;
    var go=function(){video.currentTime=t;var p=video.play();if(p&&p.catch)p.catch(function(){})};if(video.readyState>=1)go();else{video.addEventListener('loadedmetadata',go,{once:true});video.load()}})});
  video.addEventListener('timeupdate',function(){var k=0;G.chapters.forEach(function(c,i){if(video.currentTime>=c[0]-.05)k=i});dlg.querySelectorAll('.gv-chap').forEach(function(b,i){b.classList.toggle('on',i===k&&video.currentTime>0)})})}
function open(){if(!dlg)build();if(!video.getAttribute('src'))video.src=G.src;if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','')}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-open-guide]');if(b){e.preventDefault();open()}});
window.openGuideVideo=open;
})();
