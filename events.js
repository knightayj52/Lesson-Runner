let inputSaveTimer=null;
const deferredSave=()=>{clearTimeout(inputSaveTimer);inputSaveTimer=setTimeout(saveAuto,350);};
function openMove(key){const x=LR.sessions(S).find(x=>x.key===key);if(!x)return;$('moveKey').value=key;$('moveDate').value=x.date;$('moveTitle').textContent=`${x.number}차시 · ${x.title}`;$('moveFollowing').checked=true;$('moveDialog').showModal();}
function recordFor(key){return S.records[key]||(S.records[key]={status:'planned',note:'',followup:'',completedAt:''});}
function selected(){return LR.sessions(S).find(x=>x.key===selectedSession);}
function clearDerived(){S.items={};refreshData();saveAuto();}
document.addEventListener('click',async event=>{
 const button=event.target.closest('button,[data-action]');if(!button||button.disabled)return;
 const action=button.dataset.action;if(busy&&action!=='cancelAI')return;
 if(button.dataset.page){showPage(button.dataset.page);return;}if(button.dataset.step){showStep(button.dataset.step);return;}if(button.dataset.theme){setTheme(button.dataset.theme);return;}
 try{switch(action){
 case 'new':captureInputs();saveAuto();S=LR.empty();selectedSession='';setupStep='input';syncInputs();refreshData();saveAuto();showPage('setup');break;
 case 'unit':switchUnit(button.dataset.id);break;
 case 'duplicate':{const u=units.find(x=>x.id===button.dataset.id);if(!u)break;saveAuto();S=cleanUnit(LR.normalize(structuredClone(u)));S.id=LR.uid();S.unit+=' (사본)';S.records={};selectedSession='';syncInputs();refreshData();saveAuto();showPage('home');toast('기존 자료를 포함한 사본을 만들고 수업 기록은 비웠습니다.');break;}
 case 'demo':demo();break;
 case 'upload':$('pdfFile').click();break;
 case 'import':$('loadState').click();break;
 case 'export':saveAuto();download(S.unit+'_수업실행.json',JSON.stringify(S,null,2),'application/json');break;
 case 'exportAll':saveAuto();download('수업실행도우미_전체단원.json',JSON.stringify({version:2,units},null,2),'application/json');break;
 case 'analyze':await analyze();break;
 case 'testAI':await testAI();break;
 case 'models':await listModels();break;
 case 'peek':$('apiKey').type=$('apiKey').type==='password'?'text':'password';button.textContent=$('apiKey').type==='password'?'보기':'숨기기';setTimeout(()=>{$('apiKey').type='password';$('peek').textContent='보기';},4000);break;
 case 'clearKey':$('apiKey').value='';$('rememberKey').checked=false;saveKeyPrefs();connectionState('未設定','저장된 키를 지웠습니다.');break;
 case 'applySchedule':{const days=[...$('wdays').querySelectorAll('input:checked')].map(x=>+x.value),holidays=$('holidays').value.split(/[,\n]/).map(x=>x.trim()).filter(Boolean);if(!LR.date($('startDate').value))throw Error('시작일을 확인해 주세요.');if(!days.length)throw Error('수업 요일을 하나 이상 선택해 주세요.');if(holidays.some(x=>!LR.date(x)))throw Error('휴업일은 YYYY-MM-DD 형식으로 적어 주세요.');if(S.lessons.length&&Object.keys(S.records).length&&!confirm('전체 시간표를 다시 배치합니다. 기존 수업 기록은 유지됩니다. 적용할까요?'))break;S.settings={...S.settings,startDate:$('startDate').value,weekdays:days,holidays,minGap:+$('minGap').value,repetitions:+$('repetitions').value};LR.assign(S);refreshData();saveAuto();showPage('home');toast('수업과 복습 일정을 함께 적용했습니다.');break;}
 case 'scheduleSettings':showPage('setup');showStep('confirm');break;
 case 'addLesson':{const l={id:'L'+Date.now(),t:'새 활동',p:1,s:'',stage:'',question:'',materials:'',dates:[],date:''};S.lessons.push(l);S.mats[l.id]={};LR.fillDates(S);clearDerived();renderReview();break;}
 case 'deleteLesson':{if(!confirm('이 활동과 연결된 자료·기록·배움을 삭제할까요? 먼저 백업하면 복원할 수 있습니다.'))break;const lid=button.dataset.id,nids=S.nodes.filter(n=>n.src===lid).map(n=>n.id);S.lessons=S.lessons.filter(l=>l.id!==lid);S.nodes=S.nodes.filter(n=>n.src!==lid);S.deps=S.deps.filter(d=>d[0]!==lid&&!nids.includes(d[1]));delete S.mats[lid];for(const dict of [S.records,S.ppt])for(const k of Object.keys(dict))if(k.startsWith(lid+'_'))delete dict[k];clearDerived();renderReview();break;}
 case 'addNode':if(!S.lessons.length)throw Error('차시를 먼저 추가해 주세요.');S.nodes.push({id:'N'+Date.now(),c:'새로운 배움',k:'선언',src:S.lessons[0].id,m:''});clearDerived();renderReview();break;
 case 'deleteNode':if(confirm('이 배움과 연결된 복습 문항을 삭제할까요?')){const nid=button.dataset.id;S.nodes=S.nodes.filter(n=>n.id!==nid);S.deps=S.deps.filter(d=>d[1]!==nid);clearDerived();renderReview();}break;
 case 'move':openMove(button.dataset.key);break;
 case 'closeDialog':$('moveDialog').close();break;
 case 'openMat':selectedSession=button.dataset.key;showPage('materials');break;
 case 'selectMat':selectedSession=button.dataset.key;renderMats();break;
 case 'matKind':matKind=button.dataset.kind;renderMats();break;
 case 'genMat':{if(!requireAI())break;const x=selected(),l=lessonById(x.lid),slot=matSlot(l,matKind,x.part);if(S.mats[l.id]?.[slot]&&!confirm('수정한 내용을 포함하여 이 자료를 새로 생성할까요?'))break;await task(MATNAME[matKind]+'를 만들고 있습니다.',()=>genMat(l.id,matKind,button));break;}
 case 'ppt':case 'pptAgain':{const x=selected();if(action==='pptAgain'&&!confirm('현재 PPT를 새 내용으로 생성할까요?'))break;if((action==='pptAgain'||!S.ppt[x.key])&&!requireAI())break;await task('수업 슬라이드를 준비하고 있습니다.',()=>genPpt(x.lid,button,action==='pptAgain'));break;}
 case 'pptOutline':{const x=selected();await navigator.clipboard.writeText(pptMarkdown(x.lid,x.part));toast('PPT 개요를 복사했습니다.');break;}
 case 'deleteMat':{const x=selected(),l=lessonById(x.lid);if(confirm('이 자료를 삭제할까요?')){delete S.mats[l.id][matSlot(l,matKind,x.part)];saveAuto();renderMats();}break;}
 case 'copyMat':await copyRich();break;
 case 'printMat':{const el=$('materialBody');if(!el)break;const win=window.open('','_blank');if(!win){toast('인쇄 창을 열려면 팝업을 허용해 주세요.');break;}win.document.write(docShell(el.innerHTML,MATNAME[matKind]+' · '+selected().title));win.document.close();win.focus();setTimeout(()=>win.print(),400);break;}
 case 'exportMat':download(selected().title+'_'+MATNAME[matKind]+'.doc','\ufeff'+docShell($('materialBody').innerHTML,MATNAME[matKind]),'application/msword');toast('워드 호환 HTML 문서입니다. 한글·워드에서 열어 확인해 주세요.');break;
 case 'genItems':await genItems(button.dataset.key);break;
 case 'copyItem':await navigator.clipboard.writeText(S.items[button.dataset.key]||'');toast('문항을 복사했습니다.');break;
 case 'ics':download(S.unit+'_수업준비.ics',LR.ics(S,SCHED),'text/calendar;charset=utf-8');break;
 case 'openRecord':selectedSession=button.dataset.key;showPage('records');break;
 case 'status':{const r=recordFor(selectedSession);r.status=button.dataset.status;r.completedAt=r.status==='done'?new Date().toISOString():'';saveAuto();renderRecords();break;}
 case 'exportRecords':{const records=LR.sessions(S).map(x=>`${x.number}차시 · ${x.date} · ${x.title}\n상태: ${{done:'완료',missed:'미실시',support:'보충 필요',planned:'예정'}[x.record.status]}\n학생 반응: ${x.record.note||''}\n다음 수업: ${x.record.followup||''}`).join('\n\n');download(S.unit+'_수업기록.txt',records);break;}
 case 'run':startRunner(button.dataset.key);break;
 case 'studentView':runner.student=!runner.student;renderRunner();break;
 case 'closeRunner':closeRunner();break;
 case 'timer':toggleTimer();break;
 case 'previousStage':nextStage(-1);break;
 case 'nextStage':nextStage(1);break;
 case 'lessTime':changeTime(-1);break;
 case 'moreTime':changeTime(1);break;
 case 'finishRunner':{const key=runner.key,r=recordFor(key);r.status='done';r.completedAt=new Date().toISOString();saveAuto();closeRunner();selectedSession=key;showPage('records');break;}
 case 'cancelAI':controller?.abort();break;
 }}catch(e){toast(humanErr(e));}
});
document.addEventListener('input',event=>{const el=event.target;
 if(['doc','grade','subject','standards','minutes'].includes(el.id)){captureInputs();deferredSave();}
 if(el.id==='apiKey'){connectionState(el.value?'未確認':'未設定');$('keyStatus').textContent='';saveKeyPrefs();}
 if(el.id==='modelName'){connectionState('未確認');saveKeyPrefs();}
 if(el.id==='materialBody'){const x=selected(),l=lessonById(x.lid);S.mats[l.id][matSlot(l,matKind,x.part)]=cleanHtml(el.innerHTML);deferredSave();}
 if(el.id==='recordNote'||el.id==='recordFollowup'){recordFor(selectedSession)[el.id==='recordNote'?'note':'followup']=el.value;deferredSave();}
 if(el.id==='runnerNote'&&runner){recordFor(runner.key).note=el.value;deferredSave();}
 if(el.dataset.unitField){S[el.dataset.unitField]=el.value;deferredSave();}
 if(el.dataset.fwField){S.fw[el.dataset.fwField]=el.value;deferredSave();}
 if(el.dataset.question){S.fw.q=S.fw.q||{};S.fw.q[el.dataset.question]=el.value;deferredSave();}
 if(el.dataset.profileField){S.profile[el.dataset.profileField]=el.value;$('standards').value=S.profile.standards;deferredSave();}
 if(el.dataset.lesson&&el.tagName!=='SELECT'){lessonById(el.dataset.lesson)[el.dataset.field]=el.value;deferredSave();}
 if(el.dataset.node&&el.tagName!=='SELECT'){nodeById(el.dataset.node)[el.dataset.field]=el.value;S.items={};refreshData();deferredSave();}
});
document.addEventListener('change',event=>{const el=event.target;
 if(el.id==='fontSize'){document.documentElement.style.setProperty('--font',el.value+'px');writeStorage('lr_font',el.value);}
 if(el.id==='prov'){renderModels();$('apiKey').value='';updateKeyLink();connectionState('未設定','선택한 제공자의 키를 입력해 주세요.');saveKeyPrefs();}
 if(el.id==='modelSel'){toggleCustom();connectionState('未確認');$('keyStatus').textContent='';saveKeyPrefs();}
 if(el.id==='rememberKey')saveKeyPrefs();
 if(['homeSession','recordSession'].includes(el.id)){selectedSession=el.value;renderPage();}
 if(el.id==='alarmHour'){S.settings.alarmHour=+el.value;saveAuto();}
 if(el.dataset.lessonCount){const l=lessonById(el.dataset.lessonCount),old=l.p,n=Number(el.value);if(!Number.isInteger(n)||n<1||n>10){el.value=old;toast('차시 수는 1~10 사이의 정수로 입력해 주세요.');return;}const m=S.mats[l.id]||{};if(old===1&&n>1)for(const kind of ['plan','sheet','note'])if(m[kind]){m[kind+'_1']=m[kind];delete m[kind];}if(n===1&&old>1)for(const kind of ['plan','sheet','note'])if(m[kind+'_1'])m[kind]=m[kind+'_1'];l.p=n;LR.fillDates(S);LR.move(S,l.id+'_1',l.date,true);clearDerived();renderReview();toast('차시 수와 이후 수업 날짜를 조정했습니다.');}
 if(el.dataset.node){nodeById(el.dataset.node)[el.dataset.field]=el.value;clearDerived();}
 if(el.dataset.depLesson){const lid=el.dataset.depLesson,nid=el.dataset.depNode;S.deps=S.deps.filter(d=>d[0]!==lid||d[1]!==nid);if(el.checked)S.deps.push([lid,nid]);clearDerived();}
});
$('moveForm').addEventListener('submit',event=>{event.preventDefault();try{LR.move(S,$('moveKey').value,$('moveDate').value,$('moveFollowing').checked);const r=S.records[$('moveKey').value];if(r?.status==='missed')r.status='planned';refreshData();saveAuto();$('moveDialog').close();renderPage();toast('차시 날짜와 복습 일정을 갱신했습니다.');}catch(e){toast(humanErr(e));}});
$('pdfFile').addEventListener('change',async event=>{const file=event.target.files[0];event.target.value='';await readDocument(file);});
$('loadState').addEventListener('change',async event=>{const file=event.target.files[0];event.target.value='';await importFile(file);});
$('runDialog').addEventListener('close',()=>{if(runner){clearInterval(runner.timer);runner=null;}});
$('busyDialog').addEventListener('cancel',event=>{event.preventDefault();controller?.abort();});
document.addEventListener('paste',event=>{if(event.target.id!=='materialBody')return;event.preventDefault();const html=event.clipboardData.getData('text/html'),text=event.clipboardData.getData('text/plain'),selection=window.getSelection();if(!selection.rangeCount)return;const range=selection.getRangeAt(0);range.deleteContents();const template=document.createElement('template');template.innerHTML=html?cleanHtml(html):escapeHTML(text).replace(/\n/g,'<br>');const end=template.content.lastChild;range.insertNode(template.content);if(end){range.setStartAfter(end);range.collapse(true);selection.removeAllRanges();selection.addRange(range);}event.target.dispatchEvent(new Event('input',{bubbles:true}));});
window.addEventListener('pagehide',()=>{clearTimeout(inputSaveTimer);if(!storageBroken)saveAuto();});
boot();
