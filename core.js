/* Pure data and scheduling rules. Shared by the app and regression tests. */
(function(root){
'use strict';
const VERSION=2;
const text=(v,n=50000)=>typeof v==='string'?v.slice(0,n):'';
const map=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const id=v=>typeof v==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,49}$/.test(v);
function date(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s;}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function add(s,n){if(!date(s))throw Error('날짜를 확인해 주세요.');const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
const gap=(a,b)=>Math.round((new Date(b+'T12:00:00Z')-new Date(a+'T12:00:00Z'))/86400000);
const uid=()=> 'u'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
function empty(){return {version:VERSION,id:uid(),unit:'새 단원',source:'',profile:{grade:'4학년',subject:'',standards:'',minutes:40},settings:{startDate:today(),weekdays:[1,2,3,4,5],holidays:[],minGap:5,repetitions:3,carryDays:21,alarmHour:19},fw:{},lessons:[],nodes:[],deps:[],items:{},mats:{},ppt:{},records:{},updatedAt:new Date().toISOString()};}
function normalize(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('올바른 작업 파일이 아닙니다.');
 if(raw.version>VERSION)throw Error('더 최신 버전의 작업입니다. 앱을 새로고침한 뒤 다시 여세요.');
 if(!Array.isArray(raw.lessons)||!Array.isArray(raw.nodes)||raw.lessons.length>300||raw.nodes.length>150)throw Error('차시 또는 지식 목록 형식이 올바르지 않습니다.');
 const o=empty();o.id=id(raw.id)?raw.id:uid();o.unit=text(raw.unit,200)||'이름 없는 단원';o.source=text(raw.source,200000);o.updatedAt=text(raw.updatedAt,50)||o.updatedAt;
 const p=map(raw.profile),s=map(raw.settings);o.profile={grade:text(p.grade,40)||'4학년',subject:text(p.subject,80),standards:text(p.standards,20000),minutes:[35,40,45,50,80].includes(+p.minutes)?+p.minutes:40};
 o.settings={...o.settings,...s};o.settings.startDate=date(s.startDate)?s.startDate:(date(raw.lessons[0]?.date)?raw.lessons[0].date:today());
 o.settings.weekdays=Array.isArray(s.weekdays)?[...new Set(s.weekdays.filter(x=>Number.isInteger(x)&&x>=0&&x<=6))]:o.settings.weekdays;
 if(!o.settings.weekdays.length)throw Error('수업 요일을 하나 이상 선택해 주세요.');
 o.settings.holidays=Array.isArray(s.holidays)?s.holidays.filter(date):[];
 for(const [k,lo,hi] of [['minGap',1,30],['repetitions',2,6],['carryDays',1,90],['alarmHour',0,23]])o.settings[k]=Math.max(lo,Math.min(hi,(Number.isFinite(Number(s[k]))?Math.round(Number(s[k])):o.settings[k])));
 const f=map(raw.fw),q=map(f.q);o.fw={type:text(f.type,50),big:text(f.big,3000),concepts:Array.isArray(f.concepts)?f.concepts.map(x=>text(x,200)):[],q:{fact:text(q.fact,2000),concept:text(q.concept,2000),debate:text(q.debate,2000)},atl:Array.isArray(f.atl)?f.atl.map(x=>text(x,200)):[],profile:Array.isArray(f.profile)?f.profile.map(x=>text(x,200)):[],assess:text(f.assess,4000)};
 const seen=new Set();o.lessons=raw.lessons.map((l,i)=>{if(!l||!id(l.id)||seen.has(l.id))throw Error('차시 번호가 없거나 중복되었습니다.');seen.add(l.id);const p=Math.max(1,Math.min(10,Math.floor(+l.p)||1));return {id:l.id,t:text(l.t,500)||`${i+1}번째 수업`,s:text(l.s,200),stage:text(l.stage,200),p,date:date(l.date)?l.date:'',dates:Array.isArray(l.dates)?l.dates.filter(date).slice(0,p):[],question:text(l.question,1000),materials:text(l.materials,2000)};});
 const ns=new Set();o.nodes=raw.nodes.map(n=>{if(!n||!id(n.id)||ns.has(n.id)||!seen.has(n.src))throw Error('지식 번호 또는 처음 배우는 차시를 확인해 주세요.');ns.add(n.id);return {id:n.id,c:text(n.c,4000),k:n.k==='절차'?'절차':'선언',src:n.src,m:text(n.m,2000)};});
 o.deps=Array.isArray(raw.deps)?raw.deps.filter(d=>Array.isArray(d)&&seen.has(d[0])&&ns.has(d[1])).map(d=>[d[0],d[1]]):[];
 for(const [k,v] of Object.entries(map(raw.items)))if(/^[A-Za-z0-9_-]{1,150}$/.test(k))o.items[k]=text(v,30000);
 for(const l of o.lessons){const m=map(map(raw.mats)[l.id]);o.mats[l.id]={};for(const [k,v] of Object.entries(m))if(/^(plan|sheet|note)(_[1-9][0-9]?)?$/.test(k))o.mats[l.id][k]=text(v,200000);}
 for(const [k,v] of Object.entries(map(raw.ppt)))if(/^[A-Za-z0-9_-]+_[0-9]+$/.test(k)&&v&&Array.isArray(v.slides))o.ppt[k]={slides:v.slides.slice(0,30).map(d=>({type:text(d.type,30),h:text(d.h,500),sub:text(d.sub,1000),b:Array.isArray(d.b)?d.b.map(x=>text(x,1000)).slice(0,6):[],left:text(d.left,200),right:text(d.right,200),lb:Array.isArray(d.lb)?d.lb.map(x=>text(x,1000)).slice(0,4):[],rb:Array.isArray(d.rb)?d.rb.map(x=>text(x,1000)).slice(0,4):[],note:text(d.note,5000)}))};
 for(const [k,v] of Object.entries(map(raw.records)))if(/^[A-Za-z0-9_-]+_[0-9]+$/.test(k)){const r=map(v);o.records[k]={status:['done','missed','support'].includes(r.status)?r.status:'planned',note:text(r.note,10000),followup:text(r.followup,5000),completedAt:text(r.completedAt,50)};}
 fillDates(o);return o;
}
function nextDate(s,start){if(!s.weekdays.length)throw Error('수업 요일을 하나 이상 선택해 주세요.');for(let i=0;i<3700;i++){const d=add(start,i);if(s.weekdays.includes(new Date(d+'T12:00:00Z').getUTCDay())&&!s.holidays.includes(d))return d;}throw Error('배치 가능한 수업 날짜가 없습니다.');}
function assign(o){let cursor=o.settings.startDate;for(const l of o.lessons){l.dates=[];for(let p=0;p<l.p;p++){cursor=nextDate(o.settings,cursor);l.dates.push(cursor);cursor=add(cursor,1);}l.date=l.dates[0];}return o;}
function fillDates(o){let cursor=o.settings.startDate;for(const l of o.lessons){if(l.dates.length!==l.p){l.dates=[];let d=l.date||nextDate(o.settings,cursor);for(let i=0;i<l.p;i++){l.dates.push(d);d=nextDate(o.settings,add(d,1));}}l.date=l.dates[0];cursor=add(l.dates.at(-1),1);}}
function sessions(o){let n=0;return o.lessons.flatMap(l=>l.dates.map((date,i)=>({key:l.id+'_'+(i+1),lid:l.id,part:i+1,number:++n,date,title:l.t,stage:l.stage,flow:l.s,record:o.records[l.id+'_'+(i+1)]||{status:'planned',note:'',followup:''}})));}
function move(o,key,to,following){if(!date(to))throw Error('올바른 이동 날짜를 선택해 주세요.');const list=sessions(o),index=list.findIndex(x=>x.key===key);if(index<0)throw Error('이동할 차시를 찾지 못했습니다.');let cursor=to;for(let i=index;i<(following?list.length:index+1);i++){const x=list[i],l=o.lessons.find(l=>l.id===x.lid);const d=i===index?to:nextDate(o.settings,cursor);l.dates[x.part-1]=d;l.date=l.dates[0];cursor=add(d,1);}return o;}
function schedule(o){
 const events=[],warnings=[],ss=sessions(o).sort((a,b)=>a.date.localeCompare(b.date)||a.number-b.number),byL=new Map(o.lessons.map(l=>[l.id,l])),byN=new Map(o.nodes.map(n=>[n.id,n])),dedup=new Set();
 const emit=e=>{const key=e.node+'|'+e.date+'|'+e.type;if(!dedup.has(key)){dedup.add(key);events.push(e);}};
 const snap=d=>ss.find(x=>x.date>=d);
 for(const [target,nid] of o.deps){const n=byN.get(nid),tl=byL.get(target),sl=n&&byL.get(n.src);if(!n||!tl||!sl)continue;const start=sl.dates.at(-1),dest=tl.date,g=gap(start,dest);if(g<=0){warnings.push(`「${tl.t}」에 필요한 「${n.c}」의 학습 순서를 확인하세요.`);continue;}
 const kind=g<=2?'absorb':g>=42?'long':'normal';emit({key:`R-${nid}-${target}`,type:'retrieval',kind,node:nid,target,date:dest,gap:g,alarm:g>2?add(dest,-1):null});
 if(g>=42){const mid=snap(add(start,Math.round(g/2)));if(mid&&mid.date<dest)emit({key:`R-${nid}-${mid.lid}-m`,type:'retrieval',kind:'mid',node:nid,target:mid.lid,date:mid.date,gap:gap(start,mid.date),alarm:add(mid.date,-1)});}
 }
 for(const n of o.nodes.filter(x=>x.k==='절차')){const sl=byL.get(n.src);let previous=sl.dates.at(-1);for(let rep=2;rep<=o.settings.repetitions;rep++){const slot=snap(add(previous,o.settings.minGap));if(!slot){warnings.push(`「${n.c}」 ${rep}회차 연습은 다음 단원에서 이어 주세요.`);continue;}const cross=sl.s!==slot.flow;emit({key:`P-${n.id}-${rep}`,type:'practice',node:n.id,target:slot.lid,date:slot.date,rep,cross,alarm:add(slot.date,-1)});previous=slot.date;if(cross)warnings.push(`「${n.c}」 연습을 「${slot.title}」 활동과 연결해 주세요.`);}}
 // A retrieval and a practice for the same skill on one day are one learning occasion.
 const merged=[];for(const e of events){const other=merged.find(x=>x.node===e.node&&x.date===e.date);if(other){if(e.type==='practice'){other.type='practice';other.rep=e.rep;other.key=e.key;other.alarm=e.alarm;other.combined=true;}}else merged.push({...e});}
 const carry=[];for(const n of o.nodes){const days=new Set([byL.get(n.src).dates.at(-1),...merged.filter(e=>e.node===n.id).map(e=>e.date)]);if(days.size<o.settings.repetitions&&ss.length)carry.push({id:n.id,c:n.c,n:days.size,when:add(ss.at(-1).date,o.settings.carryDays)});}
 const counts={};ss.forEach(x=>counts[x.date]=(counts[x.date]||0)+1);Object.entries(counts).filter(([,c])=>c>1).forEach(([d])=>warnings.push(`${d}에 여러 차시가 있습니다. 실제 시간표와 맞는지 확인하세요.`));
 return {events:merged.sort((a,b)=>a.date.localeCompare(b.date)),warnings:[...new Set(warnings)],carry};
}
function escapeIcs(s){return String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
function fold(line){let result='',length=0;for(const ch of line){const size=new TextEncoder().encode(ch).length;if(length+size>73){result+='\r\n ';length=1;}result+=ch;length+=size;}return result;}
function ics(o,sc,now=new Date()){
 const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z'),groups={};sc.events.filter(e=>e.alarm).forEach(e=>(groups[e.alarm]??=[]).push(e));
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//YoungClass//Lesson Runner 2//KO','CALSCALE:GREGORIAN','X-WR-CALNAME:'+escapeIcs(o.unit+' · 수업 준비')];
 for(const [d,evs] of Object.entries(groups).sort()){const start=new Date(d+'T'+String(o.settings.alarmHour).padStart(2,'0')+':00:00+09:00'),end=new Date(+start+15*60000),utc=x=>x.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');const summary=`[수업 준비] ${evs[0].date} · ${evs.length}건`;const body=evs.map(e=>{const n=o.nodes.find(n=>n.id===e.node);return `${e.type==='practice'?'기능 연습':'배움 꺼내기'}: ${n.c}\n${o.items[e.key]||'앱에서 문항을 준비해 주세요.'}`;}).join('\n\n');lines.push('BEGIN:VEVENT',`UID:${o.id}-${d}@lesson-runner`,'DTSTAMP:'+stamp,'DTSTART:'+utc(start),'DTEND:'+utc(end),'SUMMARY:'+escapeIcs(summary),'DESCRIPTION:'+escapeIcs(body),'BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:PT0S','DESCRIPTION:'+escapeIcs(summary),'END:VALARM','END:VEVENT');}
 lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
}
const api={VERSION,empty,normalize,assign,fillDates,sessions,schedule,move,nextDate,date,today,add,gap,ics,uid};if(typeof module!=='undefined')module.exports=api;else root.LR=api;
})(typeof globalThis!=='undefined'?globalThis:this);
