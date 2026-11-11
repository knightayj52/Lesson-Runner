/* © 2026 영쌤클래스 · 교육용으로 제작 · 무단 복제·재배포 금지
 * demo.js — 예시 체험: AI 키 없이 설계안 분석부터 수업 기록까지 전 과정을 눌러 본다.
 *
 * - 체험 단원은 id가 'demo'로 시작하는 별도 단원이다. 기존 단원은 그대로 보존된다.
 * - 체험 단원에서는 AI를 부르지 않고 demo-data.js의 예시 결과를 돌려준다.
 * - 화면 위 안내 띠가 지금 단계와 다음에 누를 곳을 알려 준다.
 */
'use strict';
const isDemoUnit=u=>!!u&&typeof u.id==='string'&&u.id.startsWith('demo');
const DEMO_MARK='<p><i>※ 체험용 예시 자료입니다. 실제로 사용할 때는 선생님의 AI 키로 우리 반 단원에 맞추어 생성합니다.</i></p>';
const CIRCLED=['①','②','③','④','⑤','⑥','⑦','⑧','⑨'];

/* ---------- 체험 시작 · 끝 ---------- */
function demo(){
 if(busy)return;captureInputs();saveAuto();
 units=units.filter(u=>!isDemoUnit(u)&&(u.lessons.length||u.source.trim()));
 S=LR.empty();S.id='demo'+LR.uid();S.unit=DEMO_DATA.unit;S.profile={...DEMO_DATA.profile};S.source=DEMO_DATA.source;
 selectedSession='';matKind='plan';setupStep='input';syncInputs();refreshData();saveAuto();showPage('setup');
 $('pdfStatus').textContent='체험용 예시 설계안을 불러왔습니다. 아래 ‘설계안 분석하기’를 눌러 보세요.';$('a-err').innerHTML='';
 toast('예시 체험을 시작합니다. AI 키 없이 전 과정을 눌러 볼 수 있습니다.');
}
function endDemo(startNew){
 if(busy)return;closeRunner();units=units.filter(u=>!isDemoUnit(u));
 S=(!startNew&&units[0])||LR.empty();selectedSession='';setupStep='input';syncInputs();refreshData();saveAuto();
 $('pdfStatus').textContent='';connectionState($('apiKey').value?'未確認':'未設定');
 showPage(startNew?'setup':'home');toast(startNew?'체험을 마쳤습니다. 선생님의 단원을 시작해 보세요.':'체험 단원을 닫았습니다.');
}

/* ---------- AI 대신 돌려주는 예시 결과 ---------- */
function demoSession(){
 const ss=LR.sessions(S),x=ss.find(v=>v.key===selectedSession)||ss[0];if(!x)return null;
 return {x,l:lessonById(x.lid),d:DEMO_DATA.sessions[x.key]||demoFallback(x,lessonById(x.lid))};
}
/* 교사가 차시를 고치거나 더한 경우에도 자료가 나오도록, 차시 정보만으로 만드는 기본 틀 */
function demoFallback(x,l){
 const m=S.profile.minutes,a=Math.max(3,Math.round(m*.125)),b=Math.round(m*.375),c=m-a-b-a,q=l.question||S.fw.q?.concept||'오늘 무엇을 발견했나요?';
 return {std:'교사 확인 필요',lens:(S.fw.concepts||[])[0]||'—',concept:(S.fw.concepts||[]).join(' · ')||'—',
  goal:'이 차시의 활동으로 단원의 중심 아이디어에 한 걸음 다가간다.',board:q,scope:'이 차시의 질문에 답하는 데까지 다룬다.',matT:l.materials||'—',matS:'필기도구, 배움공책',
  qp:['조사하고 모으는 활동에서 던진다.','견주고 묶은 뒤 관계를 물을 때 던진다.','판단하고 적용하는 자리에서 던진다.'],
  steps:[['도입 · 생각 열기',a,'—','—',['T: "'+q+'"','S: 짝과 떠오르는 생각을 말한다.','교사 행동: 칠판에 오늘의 질문을 쓴다.'],['오늘의 질문을 읽어요','짝과 생각을 나눠요']],
   ['전개 1 · 살펴보기',b,'사실','활동 자료',['T: "자료를 살펴보고 알게 된 것을 적어 보세요."','S: 자료를 읽고 알게 된 것을 적는다.','교사 행동: 순회하며 학생의 말을 칠판에 모은다.'],['자료를 살펴봐요','알게 된 것을 적어요']],
   ['전개 2 · 견주고 나누기',c,'개념','모둠 기록지',['T: "친구의 생각과 내 생각을 견주어 보세요. 같은 점과 다른 점은 무엇인가요?"','S: 모둠에서 견주고 기록한다.','교사 행동: 되풀이되는 말에 밑줄을 긋는다.'],['친구의 생각과 견줘요','같은 점과 다른 점을 찾아요']],
   ['정리 · 내 문장으로 쓰기',a,'—','배움공책',['T: "자료를 덮고 오늘의 배움을 한 문장으로 써 보세요."','S: 배움공책에 쓴다.','T: "다음 시간에 이어서 살펴봅시다."'],['자료를 덮어요','오늘의 배움을 써요']]],
  flow:'경험 떠올리기 → 자료 살펴보기 → 견주기 → 내 말로 표현하기',
  talks:[['전개2-①',q,[['질문의 방향에 맞는 답','학생의 말을 그대로 칠판에 적는다.'],['일부만 맞는 답','"조금 더 말해 줄래요?"로 넓히게 한다.'],['빗나간 답','"그렇게 생각한 까닭은 무엇인가요?"라고 되묻는다.'],['(침묵)','짝과 먼저 이야기할 시간을 30초 준다.']],'다르게 생각한 친구가 있나요?']],
  after:['순회하며 자기 말로 이유를 말하는지 본다.','도움이 필요한 학생에게는 말 틀을, 더 나아가는 학생에게는 다른 사례를 준다.','용어의 정의를 교사가 먼저 말하지 않는다.','오늘의 질문과 학생의 말을 남긴다.','다음 차시의 활동으로 이어진다.'],
  sheet:{acts:[['살펴보고 적기','자료에서 알게 된 것을 적어 보세요.'],['견주어 보기','친구의 생각과 같은 점, 다른 점을 적어 보세요.']],check:'오늘의 배움을 내 문장으로 써 보세요.'},
  note:[['오늘의 배움을 한 문장으로 쓴다.','(학생이 자기 말로 쓴 문장)'],['지난 시간의 배움과 잇는다.','(지난 시간과 이어지는 점)'],['새로 생긴 질문을 하나 쓴다.','(새로 생긴 질문)'],'자료를 덮게 한 뒤 쓰게 한다.']};
}
const chaLabel=(x,l)=>l.p>1?`${x.part}차시(전체 ${l.p}차시 중)`:'1차시';
function demoPlan(){
 const {x,l,d}=demoSession(),F=S.fw,m=S.profile.minutes;let n=0;
 const steps=d.steps.map(([name,min,qt,mat,lines])=>`<table><tr><th>${escapeHTML(name)}</th><td><b>${min}분</b> · 탐구 질문: ${escapeHTML(qt)} · 자료: ${escapeHTML(mat)}</td></tr><tr><td colspan="2">${lines.map((t,i)=>CIRCLED[i]+' '+escapeHTML(t)).join('<br>')}</td></tr></table>`).join('');
 const talks=d.talks.map(([at,q,rows,aid])=>`<p><b>[발문${++n} · ${escapeHTML(at)}] "${escapeHTML(q)}"</b></p><table><tr><th>예상 학생 반응</th><th>교사의 대응</th></tr>${rows.map(r=>`<tr><td>${escapeHTML(r[0])}</td><td>${escapeHTML(r[1])}</td></tr>`).join('')}</table><p><i>보조 발문: "${escapeHTML(aid)}"</i></p>`).join('');
 return `<table><tr><th>단원</th><td>${escapeHTML(S.unit)}</td><th>차시</th><td>${x.number}차시 · ${escapeHTML(l.t)} ${chaLabel(x,l)} · ${m}분</td></tr>
<tr><th>탐구 단계</th><td>${escapeHTML(l.stage||l.s||'—')}</td><th>성취기준</th><td>${escapeHTML(d.std)}</td></tr>
<tr><th>개념적 렌즈</th><td>${escapeHTML(d.lens)}</td><th>관련 개념</th><td>${escapeHTML(d.concept)}</td></tr>
<tr><th>교사 도달 목표<br>(교사용·비공개)</th><td colspan="3">${escapeHTML(d.goal)}</td></tr>
<tr><th>학생 제시(칠판)</th><td colspan="3"><i>${escapeHTML(d.board)}</i></td></tr>
<tr><th>이 차시의 범위</th><td colspan="3">${escapeHTML(d.scope)}</td></tr>
<tr><th>준비물</th><td colspan="3">교사: ${escapeHTML(d.matT)} / 학생: ${escapeHTML(d.matS)}</td></tr></table>
<h3>탐구 질문 운용 계획</h3>
<table><tr><th>질문 유형</th><th>질문</th><th>이 차시에서의 쓰임</th></tr>
<tr><td>사실 질문</td><td>${escapeHTML(F.q?.fact||'—')}</td><td>${escapeHTML(d.qp[0])}</td></tr>
<tr><td>개념 질문</td><td>${escapeHTML(F.q?.concept||'—')}</td><td>${escapeHTML(d.qp[1])}</td></tr>
<tr><td>논쟁 질문</td><td>${escapeHTML(F.q?.debate||'—')}</td><td>${escapeHTML(d.qp[2])}</td></tr></table>
<h3>수업의 흐름 — ${m}분 진행 대본</h3>${steps}
<h3>학생 사고의 흐름</h3><p>${escapeHTML(d.flow)}</p>
<h3>교사 발문과 예상 반응</h3>${talks}
<h3>수업 뒤에 볼 것</h3>
<table><tr><th>형성평가 관찰 요령</th><td>${cleanHtml(d.after[0])}</td></tr>
<tr><th>차별화 지원</th><td>${escapeHTML(d.after[1])}</td></tr>
<tr><th>오늘 하지 않을 것</th><td>${escapeHTML(d.after[2])}</td></tr>
<tr><th>판서 계획과 보존</th><td>${escapeHTML(d.after[3])}</td></tr>
<tr><th>다음 차시 예고</th><td>${escapeHTML(d.after[4])}</td></tr></table>${DEMO_MARK}`;
}
function demoSheet(){
 const {x,l,d}=demoSession();
 return `<div class="nameline">${x.number}차시 · 이름 __________ · 날짜 ____ . ____ .</div><h3>탐구 질문</h3><p>${escapeHTML(d.board)}</p>`+
  d.sheet.acts.map(([h,p,table],i)=>`<h3>활동 ${i+1}. ${escapeHTML(h)}</h3><p>${escapeHTML(p)}</p>${table||'<span class="fill"></span>'}`).join('')+
  `<h3>스스로 확인</h3><p>${escapeHTML(d.sheet.check)}</p><span class="fill"></span>${DEMO_MARK}`;
}
function demoNote(){
 const {d}=demoSession(),r=d.note;
 return `<table><tr><th>정리 항목</th><th>학생이 할 일</th><th>이렇게 쓰면 좋아요(예시)</th></tr>
<tr><td>오늘의 핵심</td><td>${escapeHTML(r[0][0])}</td><td>${escapeHTML(r[0][1])}</td></tr>
<tr><td>이전 배움과 연결</td><td>${escapeHTML(r[1][0])}</td><td>${escapeHTML(r[1][1])}</td></tr>
<tr><td>아직 궁금한 것</td><td>${escapeHTML(r[2][0])}</td><td>${escapeHTML(r[2][1])}</td></tr></table>
<p><b>교사 안내</b> 책과 학습지를 덮고 쓰게 합니다. ${escapeHTML(r[3])}</p>${DEMO_MARK}`;
}
function demoPpt(){
 const {x,l,d}=demoSession(),slides=[{type:'title',h:l.t,sub:`${x.number}차시 · ${l.stage||l.s||''}`,b:[],note:'교사 도달 목표(학생에게 보이지 않음): '+d.goal}];
 slides.push({type:'question',h:d.board,b:[],note:'오늘의 질문을 소리 내어 함께 읽는다. 용어를 먼저 설명하지 않는다.'});
 d.steps.forEach(([name,min,,mat,lines,sl],i)=>{
  const last=i===d.steps.length-1,first=(lines.find(t=>t.startsWith('T:'))||'').replace(/^T:\s*/,'');
  slides.push({type:last?'closing':'activity',h:name.replace(/^.*·\s*/,''),b:sl||[],note:`${name} · ${min}분 · 자료: ${mat}. 시작 발문: ${first}`});
  const talk=d.talks[i-1];if(talk&&!last)slides.push({type:'question',h:talk[1],b:[],note:`[${talk[0]}] 보조 발문: ${talk[3]}`});
 });
 return {slides};
}
async function demoAI(prompt){
 await new Promise(r=>setTimeout(r,1100));const p=String(prompt);
 if(p.includes('<설계안>'))return JSON.stringify(DEMO_DATA.analysis);
 if(p.includes('5분 이내 형성평가')){const n=S.nodes.find(v=>p.includes('배움: '+v.c));return (n&&DEMO_DATA.items[n.id])||'[학생용]\n1. 책과 공책을 덮고, 지난 시간에 배운 것을 내 문장으로 써 보세요.\n2. 그 배움이 통하는 다른 예를 하나 들어 보세요.\n\n[교사용 확인]\n자기 말로 썼는지, 예가 배움과 맞는지 봅니다.';}
 if(p.includes('칠판 대신 띄울 PPT'))return JSON.stringify(demoPpt());
 if(p.includes('학생 활동지를 아래 HTML'))return demoSheet();
 if(p.includes('배움공책 정리 가이드'))return demoNote();
 if(p.includes('진행 대본'))return demoPlan();
 return '확인';
}

/* ---------- 안내 띠 ---------- */
const DEMO_STOPS=['설계안 넣기','분석 검토','일정 확정','오늘의 수업','자료 보관함','수업 일정','수업 기록'];
function demoStop(){
 if(page==='setup')return !S.lessons.length||setupStep==='input'?0:setupStep==='review'?1:2;
 return {home:3,materials:4,schedule:5,records:6}[page]??-1;
}
function demoGuide(){
 let bar=$('demoGuide');
 if(!isDemoUnit(S)){if(bar)bar.hidden=true;return;}
 if(!bar){bar=document.createElement('div');bar.id='demoGuide';bar.className='demo-guide';bar.setAttribute('role','region');bar.setAttribute('aria-label','예시 체험 안내');$('main').prepend(bar);
  bar.addEventListener('click',e=>{const b=e.target.closest('[data-demo]');if(b)demoNext(b.dataset.demo);});}
 const at=demoStop(),ready=S.lessons.length>0;
 if(!ready&&page!=='setup'&&page!=='settings'){/* 아직 분석 전이면 첫 단계로 안내 */}
 const tips=[
  ['예시 설계안이 채워져 있습니다. <b>[설계안 분석하기]</b>를 누르면 설계안에서 차시와 배움을 뽑아냅니다.','analyze','설계안 분석하기 →'],
  ['설계안에서 뽑은 중심 아이디어·질문·차시·배움입니다. 모두 고쳐 쓸 수 있습니다. 확인했으면 시간표로 넘어갑니다.','confirm','시간표 확인 →'],
  ['시작일과 수업 요일을 확인하세요. 적용하면 8차시의 날짜와 복습 일정이 한 번에 배치됩니다.','apply','일정 적용하고 시작하기 →'],
  ['오늘 할 차시의 질문과 준비물이 보입니다. <b>[수업 시작하기]</b>를 누르면 타이머가 있는 진행 화면이 열립니다. 둘러본 뒤 자료를 만들어 봅니다.','materials','자료 보관함으로 →'],
  ['<b>[교수학습 과정안 생성하기]</b>를 눌러 보세요. 위 탭에서 활동지·배움공책·PPT도 만들 수 있고, 왼쪽에서 다른 차시를 고를 수 있습니다.','schedule','수업 일정으로 →'],
  ['차시 날짜와 함께 배움을 다시 꺼내는 복습 일정이 놓여 있습니다. <b>[문항 준비하기]</b>를 누르면 5분 문항이 만들어집니다.','records','수업 기록으로 →'],
  ['수업 상태를 고르고 학생 반응과 다음에 이어갈 것을 남깁니다. 기록은 다음 차시의 ‘오늘의 수업’에 다시 나타납니다. 여기까지가 전 과정입니다.','new','체험 끝내고 내 단원 시작하기']];
 const tip=at>=0?tips[at]:['체험에는 AI 키가 필요 없습니다. 왼쪽 메뉴에서 단계를 골라 계속 살펴보세요.',ready?'home':'setupInput','체험 이어가기 →'];
 bar.hidden=false;
 bar.innerHTML=`<div class="demo-guide-top"><span class="pill">예시 체험 중 · 키 없이 진행</span><ol class="demo-steps">${DEMO_STOPS.map((s,i)=>`<li class="${i===at?'now':i<at?'past':''}"><span>${i+1}</span>${s}</li>`).join('')}</ol></div><p>${tip[0]} <span class="muted small">결과는 미리 준비한 예시이며 실제 AI 호출이 아닙니다.</span></p><div class="button-row"><button class="primary" data-demo="${tip[1]}">${tip[2]}</button>${at===6?'':'<button class="quiet" data-demo="new">체험 끝내기</button>'}<button class="quiet" data-demo="restart">처음부터 다시</button></div>`;
 if(page==='setup')$('setupConnection').textContent='체험 중 · 키 없이 진행';
}
function demoNext(what){
 if(busy)return;
 switch(what){
  case 'analyze':$('analyze').click();break;
  case 'confirm':showStep('confirm');window.scrollTo({top:0,behavior:'instant'});break;
  case 'apply':document.querySelector('[data-action="applySchedule"]').click();break;
  case 'setupInput':setupStep='input';showPage('setup');break;
  case 'home':case 'materials':case 'schedule':case 'records':showPage(what);break;
  case 'restart':demo();break;
  case 'new':endDemo(true);break;
 }
}
