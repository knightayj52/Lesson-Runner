/* Original detailed teaching prompts and PPT export, adapted for v2. */
async function genMat(lid,kind,btn){
  const l=lessonById(lid),{nodesHere,evs}=lessonContext(l);
  const sel=$("cha_"+lid), cha=sel?+sel.value:1;
  const chaLabel=(l.p||1)>1?`${cha}차시(전체 ${l.p}차시 중)`:"1차시";
  btn.disabled=true;const t0=btn.textContent;btn.textContent="생성 중…";
  const base=`당신은 개념기반 탐구수업과 IB PYP 단원 운영에 능숙한 초등 교사다.
${fwBlock()}

[이 차시] ${l.t}
탐구 단계: ${l.stage||l.s||"—"} · 이 블록은 전체 ${l.p||1}차시이며, 지금 작성할 것은 그중 ${chaLabel}
이 차시에서 확립되는 지식: ${nodesHere||"없음"}
이 차시 도입부에 예정된 인출·기능연습: ${evs||"없음"}

원칙: 위 중심 아이디어와 개념적 렌즈로 수렴하도록 설계할 것. 활동 나열이 아니라 개념 형성으로 이어질 것. 도입부 인출 일정이 있으면 반드시 그것으로 시작할 것.`;
  const prompts={
plan:`${base}

[설계 원칙 — 반드시 지킬 것]
1) 귀납적 설계. 개념 정의와 일반화는 학생이 도달하는 **도착점**이지 출발점이 아니다. 교사가 학술 용어를 먼저 설명하거나 칠판에 쓰지 않는다. 학생이 자기 말로 표현한 **다음에** 용어를 붙인다.
2) 교사용과 학생용을 구분한다. 일반화·핵심 아이디어는 교사용(비공개), 칠판에 내거는 것은 **질문 하나**뿐이다.
3) **탐구 질문이 수업의 뼈대다.** 위에 제시된 사실 질문·개념 질문·논쟁 질문이 이 차시의 어느 활동에서 어떻게 던져지는지가 과정안 전체에 드러나야 한다. 사실 질문은 조사·수집 활동에서, 개념 질문은 분류·비교 뒤 패턴을 묻는 자리에서, 논쟁 질문은 판단·적용 자리에서 쓴다. 이 차시 단계에 맞지 않는 질문은 다음 차시로 미루고 그 사실을 명시한다.
4) 차시 범위를 절제한다. 한 차시에 일반화까지 밀어붙이지 않는다.

[시간 — 절대 제약]
한 차시는 정확히 ${S.profile.minutes}분. 이 과정안은 ${chaLabel} 한 차시(${S.profile.minutes}분)만 작성한다.
활동 표는 **5~7행**으로 세분하고 각 행은 3~12분, 합은 정확히 ${S.profile.minutes}분.

[분량 — 반드시 지킬 것]
이 문서 하나만 보고 처음 온 교사가 ${S.profile.minutes}분을 진행할 수 있어야 한다. 요약이 아니라 **진행 대본**이다.
· 수업의 흐름은 단계 4~5개, 각 단계마다 번호 매긴 진행 순서 **①~⑤ 이상**(시작 지시 → 학생 활동 → 중간 점검 → 교사 행동 → 전환). 각 단계 블록은 공백 포함 **350자 이상**.
· T 발화는 단계마다 **3개 이상**, 전부 실제로 입 밖에 낼 문장 그대로. "~을 안내한다" 같은 서술형 요약 금지.
· S는 학생이 몸으로 무엇을 하는지(개별/짝/모둠, 어디에 무엇을 쓰는지)까지 쓴다.
· 자료의 배부·회수 시점과 판서 내용(칠판에 쓸 문구 그대로)을 흐름 안에 명시한다.
· 발문 블록은 **최소 4개**, 각 발문마다 예상 반응 **4행 이상**(정답 방향/부분 정답/오개념/침묵) + 보조 발문 1개.

아래 HTML 구조로만 작성하라. 설명·마크다운·코드펜스 금지, HTML만.
<table>
<tr><th>단원</th><td>단원명</td><th>차시</th><td>${chaLabel} · ${S.profile.minutes}분</td></tr>
<tr><th>탐구 단계</th><td>단계명</td><th>성취기준</th><td>코드와 내용</td></tr>
<tr><th>개념적 렌즈</th><td>렌즈</td><th>관련 개념</th><td>이 차시가 다루는 개념</td></tr>
<tr><th>교사 도달 목표<br><span style="font-weight:400">(교사용·비공개)</span></th><td colspan="3">교사가 마음에 두는 도착점</td></tr>
<tr><th>학생 제시(칠판)</th><td colspan="3"><i>오늘의 질문 한 줄. 용어가 아니라 질문 형태로.</i></td></tr>
<tr><th>이 차시의 범위</th><td colspan="3">여기까지 다룬다 / 무엇은 몇 차시로 넘긴다</td></tr>
<tr><th>준비물</th><td colspan="3">교사 / 학생</td></tr>
</table>
<h3>탐구 질문 운용 계획</h3>
<table>
<tr><th style="width:14%">질문 유형</th><th style="width:38%">질문</th><th>이 차시에서의 쓰임</th></tr>
<tr><td>사실 질문</td><td>단원 설계의 질문 또는 이 차시용으로 좁힌 것</td><td>어느 활동에서 언제 던지는지, 또는 "이 차시에서는 다루지 않음(n차시)"</td></tr>
<tr><td>개념 질문</td><td>…</td><td>…</td></tr>
<tr><td>논쟁 질문</td><td>…</td><td>…</td></tr>
</table>
<h3>수업의 흐름 — ${S.profile.minutes}분 진행 대본</h3>
아래 "단계 블록" 표를 단계 수만큼(4~5회) 반복한다. 각 블록의 시간을 더하면 정확히 ${S.profile.minutes}분.
<table>
<tr><th style="width:24%">도입 · 학습요소명</th><td><b>5분</b> · 탐구 질문: 유형 또는 — · 자료: 이 단계에서 쓰는 것</td></tr>
<tr><td colspan="2">
① T: "시작 지시·발문을 실제 문장 그대로" (상황이 필요하면 괄호로)<br>
② S: 학생이 무엇을 하는지 — 개별/짝/모둠, 어디에 무엇을 쓰는지 구체적으로<br>
③ T: "중간 점검·심화 발문" — 핵심 발문이면 끝에 [발문1]처럼 표시<br>
④ 교사 행동: 판서할 문구 그대로 / 순회하며 볼 것 / 자료 배부·회수 시점<br>
⑤ T: "다음 단계로 넘어가는 전환 멘트"<br>
(활동이 길면 ⑥⑦로 계속. 항목을 생략하지 말 것)
</td></tr>
</table>
첫 블록(도입)은 위에 예정된 인출·기능연습이 있으면 반드시 그것으로 시작하고, 인출 문항을 ①에 그대로 쓴다.
마지막 블록(정리)은 배움공책 인출 지시문과 다음 차시 예고로 끝낸다.
<h3>학생 사고의 흐름</h3>
<p>이 차시에서 학생의 생각이 어떤 경로로 움직여야 하는지 화살표로 한 줄. 예: 개별 경험 떠올리기 → 사례 비교 → 공통점 발견 → 자기 말로 표현</p>
<h3>교사 발문과 예상 반응</h3>
발문 블록을 4개 이상 만든다. 각 발문은 위 흐름 대본에 [발문1] 등으로 표시된 바로 그 문장이어야 하며, 제목에 어느 단계의 어느 번호인지 적는다. 각 블록은 아래를 반복한다.
<p><b>[발문1 · 전개1-③] "실제 발문 문장"</b></p>
<table>
<tr><th style="width:42%">예상 학생 반응</th><th>교사의 대응</th></tr>
<tr><td>정답 방향의 답</td><td>무엇을 말하고 무엇을 판서할지</td></tr>
<tr><td>부분적으로 맞는 답</td><td>어떻게 밀어 올릴지</td></tr>
<tr><td>빗나간 답 또는 오개념</td><td>되묻는 문장</td></tr>
<tr><td>(침묵)</td><td>어떤 단서를 어떻게 줄지</td></tr>
</table>
<p><i>보조 발문: "막힐 때 던질 한 문장"</i></p>
<h3>수업 뒤에 볼 것</h3>
<table>
<tr><th>형성평가 관찰 요령</th><td>순회하며 볼 것. <b>통과 신호</b> 2~3가지 / <b>표시해 둘 학생</b>과 다음 차시 개별 대응 / <b>미도달 시 비계</b></td></tr>
<tr><th>차별화 지원</th><td>도움이 필요한 학생 / 더 나아가는 학생</td></tr>
<tr><th>오늘 하지 않을 것</th><td>일부러 말하지 않을 용어·결론, 미루는 활동과 그 까닭</td></tr>
<tr><th>판서 계획과 보존</th><td>칠판에 남길 것. 다음 차시 재료가 되는 학생 발언은 사진으로 남기라고 명시</td></tr>
<tr><th>다음 차시 예고</th><td>무엇으로 이어지는지, 오늘 나온 무엇이 재료가 되는지</td></tr>
</table>`,
sheet:`${base}

인쇄해서 그대로 나눠줄 학생 활동지를 아래 HTML 구조로만 작성하라. 설명·마크다운·코드펜스 금지, HTML만. 학생에게 말하듯 쓰고, 정답을 유도하는 빈칸 채우기는 쓰지 말 것.
<div class="nameline">${chaLabel} · 이름 __________ · 날짜 ____ . ____ .</div>
<h3>탐구 질문</h3><p>이 시간에 답을 찾아갈 질문</p>
<h3>활동 1 제목</h3><p>학생용 지시문</p><span class="fill"></span>
<h3>활동 2 제목</h3><p>지시문. 필요하면 표를 쓴다(예: 비교·분류 활동은 &lt;table&gt;로).</p><span class="fill"></span>
<h3>스스로 확인</h3><p>오늘의 배움을 내 문장으로 쓰는 질문 1개</p><span class="fill"></span>`,
note:`${base}

배움공책 정리 가이드를 아래 HTML 구조로만 작성하라. 설명·마크다운·코드펜스 금지, HTML만.
반드시 '책과 학습지를 덮고' 쓰는 인출형으로 구성한다.
<table>
<tr><th style="width:22%">정리 항목</th><th>학생이 할 일</th><th style="width:34%">이렇게 쓰면 좋아요(예시)</th></tr>
<tr><td>오늘의 핵심</td><td>일반화를 내 문장으로</td><td>${S.profile.grade} 수준 예시</td></tr>
<tr><td>이전 배움과 연결</td><td>지난 시간·다른 교과와 잇기</td><td>예시</td></tr>
<tr><td>아직 궁금한 것</td><td>새로 생긴 질문 1개</td><td>예시</td></tr>
</table>
<p><b>교사 안내</b> 한두 문장 — 언제 쓰게 하고 무엇을 보아야 하는지.</p>`};
  try{
    S.mats[lid]=S.mats[lid]||{};
    const slot=(l.p||1)>1?kind+"_"+cha:kind;
    S.mats[lid][slot]=cleanHtml(await ai(prompts[kind],kind==="plan"?16000:5000,false,240000));
    renderMats(); saveAuto();}
  catch(e){toast("생성 실패: "+humanErr(e.message));btn.disabled=false;btn.textContent=t0;}
}
function loadScript(src){return new Promise((ok,no)=>{
  const el=document.createElement("script");el.src=src;
  const timer=setTimeout(()=>{el.remove();no(new Error("도구를 불러오는 시간이 초과되었습니다. 네트워크를 확인해 주세요."));},30000);
  el.onload=()=>{clearTimeout(timer);ok();};
  el.onerror=()=>{clearTimeout(timer);el.remove();no(new Error("도구 로드 실패 — 네트워크를 확인해 주세요."));};document.head.appendChild(el);});}
async function ensurePptx(){
  if(window.PptxGenJS)return;
  const urls=["https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js",
    "https://unpkg.com/pptxgenjs@3.12.0/dist/pptxgen.bundle.js",
    "https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgen.bundle.js"];
  for(const u of urls){try{await loadScript(u);if(window.PptxGenJS)return;}catch(e){}}
  throw new Error("PPT 라이브러리를 불러오지 못했습니다 — 인터넷 연결이나 방화벽을 확인하세요.");
}
async function genPpt(lid,btn,force=false){
  const l=lessonById(lid),{nodesHere,evs}=lessonContext(l);
  const sel=$("cha_"+lid), cha=sel?+sel.value:1;
  const chaLabel=(l.p||1)>1?`${cha}차시`:"1차시";
  btn.disabled=true;btn.textContent="구성 중…";
  try{
    const p=`${fwBlock()}

차시 「${l.t}」 ${chaLabel} (탐구 단계: ${l.stage||l.s||"—"})
이 차시 지식: ${nodesHere||"—"} / 도입부 인출 일정: ${evs||"—"}

수업 중 칠판 대신 띄울 PPT를 구성하라. 12~15장.
원칙: 개념 정의를 먼저 띄우지 않는다. 슬라이드는 대부분 **질문과 활동 지시**이고, 용어 정리 슬라이드는 학생이 표현한 뒤 나오는 후반부에만 둔다.
각 슬라이드에 type을 지정한다:
 "title"(표지, 1장) / "question"(큰 질문 한 줄, 3~4장) / "content"(요점 2~4개) /
 "activity"(활동 지시, 단계별 번호) / "compare"(두 항목 대조, b는 좌우 각 2~3개) / "closing"(마무리 인출)
JSON만 출력:
{"slides":[{"type":"title","h":"제목","sub":"부제","b":[],"note":"발표자 노트: 교사가 이때 할 말과 유의점"},
{"type":"question","h":"질문 한 줄","b":[],"note":"..."},
{"type":"compare","h":"제목","left":"왼쪽 이름","right":"오른쪽 이름","lb":["..."],"rb":["..."],"note":"..."}]}
b의 각 항목은 학생에게 그대로 보여줄 25자 이내 문장. note는 교사용이며 학생 화면에 안 나온다.`;
    const j=(!force && S.ppt[lid+"_"+cha]) || parseJson(await ai(p,6000,true,180000));
    if(!Array.isArray(j.slides)||!j.slides.length)throw new Error("슬라이드가 비어 있습니다.");
    S.ppt[lid+"_"+cha]=j; saveAuto();
    await ensurePptx();
    S.ppt[lid+"_"+cha]=j;
    const NAVY="2E3A6E",AMBER="E8A33D",BG="FAF8F4",INK="1F2430",SOFT="6B7280",CARD="FFFFFF";
    const pptx=new PptxGenJS();
    pptx.defineLayout({name:"W16",width:13.333,height:7.5}); pptx.layout="W16";
    const R=pptx.ShapeType.rect;
    const foot=(sl,i)=>{
      sl.addShape(R,{x:0,y:7.16,w:13.333,h:.34,fill:{color:"EFEBE3"}});
      sl.addText(`${S.unit} · ${l.t} ${chaLabel}`,{x:.5,y:7.17,w:9,h:.32,fontSize:11,color:SOFT,fontFace:"맑은 고딕",valign:"middle"});
      sl.addText(String(i+1),{x:12.3,y:7.17,w:.6,h:.32,fontSize:11,color:SOFT,align:"right",fontFace:"맑은 고딕",valign:"middle"});
    };
    (j.slides||[]).forEach((d,i)=>{
      const sl=pptx.addSlide();
      const t=d.type||"content";
      if(d.note)sl.addNotes(String(d.note));
      if(t==="title"){
        sl.background={color:NAVY};
        sl.addShape(R,{x:0,y:3.05,w:1.9,h:.14,fill:{color:AMBER}});
        sl.addText(d.h||"",{x:1.1,y:1.6,w:11,h:1.3,fontSize:46,bold:true,color:"FFFFFF",fontFace:"맑은 고딕"});
        sl.addText(d.sub||(l.stage||""),{x:1.1,y:3.4,w:11,h:.9,fontSize:22,color:"C9D0EA",fontFace:"맑은 고딕"});
        return;
      }
      sl.background={color:BG};
      if(t==="question"){
        sl.addShape(R,{x:0,y:0,w:.5,h:7.16,fill:{color:AMBER}});
        sl.addText(d.h||"",{x:1.4,y:2.1,w:10.8,h:2.6,fontSize:40,bold:true,color:INK,
          align:"center",valign:"middle",fontFace:"맑은 고딕"});
        (d.b||[]).forEach((x,k)=>sl.addText("· "+x,{x:1.6,y:4.9+k*.62,w:10.4,h:.6,
          fontSize:22,color:SOFT,align:"center",fontFace:"맑은 고딕"}));
        foot(sl,i); return;
      }
      sl.addText(d.h||"",{x:.8,y:.55,w:11.8,h:.95,fontSize:34,bold:true,color:INK,fontFace:"맑은 고딕"});
      sl.addShape(R,{x:.8,y:1.6,w:1.5,h:.1,fill:{color:AMBER}});
      if(t==="compare"){
        [["left","lb",.8],["right","rb",6.95]].forEach(([nk,bk,x])=>{
          sl.addShape(R,{x:x,y:2.0,w:5.55,h:4.7,fill:{color:CARD},line:{color:"DDD8CE",width:1}});
          sl.addText(d[nk]||"",{x:x+.3,y:2.25,w:5,h:.6,fontSize:24,bold:true,color:NAVY,fontFace:"맑은 고딕"});
          (d[bk]||[]).forEach((x2,k)=>sl.addText("· "+x2,{x:x+.35,y:3.0+k*.85,w:4.9,h:.8,
            fontSize:21,color:INK,fontFace:"맑은 고딕"}));
        });
        foot(sl,i); return;
      }
      const act=(t==="activity");
      (d.b||[]).forEach((x,k)=>{
        const y=2.05+k*1.02;
        if(act){
          sl.addShape(R,{x:.8,y:y,w:11.7,h:.86,fill:{color:CARD},line:{color:"DDD8CE",width:1}});
          sl.addShape(R,{x:.8,y:y,w:.12,h:.86,fill:{color:AMBER}});
          sl.addText(String(k+1),{x:1.05,y:y,w:.5,h:.86,fontSize:20,bold:true,color:AMBER,valign:"middle",fontFace:"맑은 고딕"});
          sl.addText(x,{x:1.6,y:y,w:10.7,h:.86,fontSize:23,color:INK,valign:"middle",fontFace:"맑은 고딕"});
        }else{
          sl.addShape(R,{x:.92,y:y+.34,w:.16,h:.16,fill:{color:AMBER}});
          sl.addText(x,{x:1.35,y:y,w:11,h:.86,fontSize:25,color:INK,valign:"middle",fontFace:"맑은 고딕"});
        }
      });
      if(t==="closing"){
        sl.addShape(R,{x:.8,y:6.0,w:11.7,h:.9,fill:{color:"F0E7D6"}});
        sl.addText("책과 학습지를 덮고, 배움공책에 내 문장으로 씁니다",{x:1.1,y:6.0,w:11,h:.9,
          fontSize:20,color:"7A5B23",valign:"middle",fontFace:"맑은 고딕"});
      }
      foot(sl,i);
    });
    await pptx.writeFile({fileName:`${l.id}_${chaLabel}_${l.t.slice(0,10)}.pptx`});
    renderMats();
  }catch(e){toast("PPT 생성 실패: "+humanErr(e.message));}
  btn.disabled=false;btn.textContent="PPT 내려받기";
}
function pptMarkdown(lid,cha){
  const j=S.ppt[lid+"_"+cha]; if(!j)return "";
  const l=lessonById(lid),F=S.fw||{};
  const head=`# ${l.t} (${cha}차시) — 수업용 슬라이드 대본\n\n`
   +`대상: ${S.profile.grade} · 단원: ${S.unit}\n`
   +`중심 아이디어(교사용, 슬라이드에 직접 쓰지 말 것): ${F.big||"—"}\n`
   +`개념: ${(F.concepts||[]).join(", ")||"—"}\n\n`
   +`제작 지시\n`
   +`- 아래 순서와 문구를 그대로 지켜 슬라이드를 만들어 주세요. 슬라이드를 임의로 추가하거나 순서를 바꾸지 마세요.\n`
   +`- 각 슬라이드의 '시각 제안'을 참고해 이미지를 넣어 주세요. 글자는 크고 문장은 짧게 유지해 주세요.\n`
   +`- '교사 노트'는 발표자 노트에만 넣고 슬라이드 화면에는 넣지 마세요.\n`
   +`- 개념 용어를 앞부분 슬라이드에서 정의하지 마세요. 학생이 스스로 말한 뒤에 나오도록 뒤쪽에 배치되어 있습니다.\n\n---\n\n`;
  const visual={title:"단원 주제를 상징하는 표지 이미지",question:"질문을 뒷받침하는 상징적 이미지 한 장, 글자를 가리지 않게",
    activity:"활동 장면 또는 단계 아이콘",compare:"좌우 대비가 분명한 2단 구성",content:"요점을 보조하는 아이콘 또는 도식",closing:"공책에 쓰는 장면"};
  return head+(j.slides||[]).map((d,i)=>{
    let t=`## ${i+1}. ${d.h||""}\n`;
    if(d.sub)t+=`${d.sub}\n`;
    (d.b||[]).forEach(x=>t+=`- ${x}\n`);
    if(d.lb){t+=`### ${d.left||"왼쪽"}\n`;d.lb.forEach(x=>t+=`- ${x}\n`);
      t+=`### ${d.right||"오른쪽"}\n`;(d.rb||[]).forEach(x=>t+=`- ${x}\n`);}
    t+=`\n시각 제안: ${visual[d.type||"content"]||"관련 이미지"}\n`;
    if(d.note)t+=`교사 노트: ${d.note}\n`;
    return t;}).join("\n");
}
async function copyPptMd(lid,cha,btn){
  const md=pptMarkdown(lid,cha);
  if(!md){toast("먼저 PPT를 한 번 생성해 주세요.");return;}
  await navigator.clipboard.writeText(md);
  btn.insertAdjacentHTML("afterend",'<span class="copyok">개요 복사됨 — NotebookLM·감마·구글 슬라이드에 붙여넣으세요</span>');
  setTimeout(()=>document.querySelectorAll(".copyok").forEach(x=>x.remove()),3000);
}

