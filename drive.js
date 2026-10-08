/* Google Drive: explicit, immutable unit snapshots. OAuth tokens stay in memory. */
(function(root){
'use strict';
const SCOPE='https://www.googleapis.com/auth/drive.file',API='https://www.googleapis.com/drive/v3',MAX=5*1024*1024;
function validClient(id){return /^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(id);}
function snapshot(unit,normalize){
 const safe=normalize(unit);
 // Whitelist workspace fields. Never serialize browser settings, API keys or OAuth state.
 const fields=['version','id','unit','source','profile','settings','fw','lessons','nodes','deps','items','mats','ppt','records','updatedAt'];
 const data=Object.fromEntries(fields.map(k=>[k,safe[k]]));
 const defaults=['startDate','weekdays','holidays','minGap','repetitions','carryDays','alarmHour'];
 data.settings=Object.fromEntries(defaults.map(k=>[k,safe.settings[k]]));
 const text=JSON.stringify(data);if(new Blob([text]).size>MAX)throw Error('단원 자료가 5MB를 넘습니다. 작업 파일 백업을 이용해 주세요.');return text;
}
class Client{
 constructor(fetcher=fetch){this.fetcher=fetcher;this.token='';this.expires=0;}
 authorize(response){if(!response.access_token||!String(response.scope||'').split(' ').includes(SCOPE))throw Error('드라이브 파일 권한이 승인되지 않았습니다. 다시 연결해 주세요.');this.token=response.access_token;this.expires=Date.now()+Math.max(0,Number(response.expires_in)||0)*1000-30000;}
 clear(){this.token='';this.expires=0;}
 ready(){return !!this.token&&Date.now()<this.expires;}
 async request(url,options={},raw=false){
  if(!this.ready()){this.clear();throw Error('구글 연결이 만료되었거나 연결되지 않았습니다. 다시 연결해 주세요.');}
  if(!/^https:\/\/www\.googleapis\.com\/(?:upload\/)?drive\/v3\//.test(url))throw Error('허용되지 않은 드라이브 주소입니다.');
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),60000);
  try{const r=await this.fetcher(url,{...options,headers:{...options.headers,Authorization:'Bearer '+this.token},signal:abort.signal});
   if(r.status===401){this.clear();throw Error('구글 연결이 만료되었습니다. 다시 연결해 주세요.');}
   if(!r.ok){if(r.status===403)throw Error('Drive API 활성화와 구글 계정의 파일 권한·저장 용량을 확인해 주세요.');if(r.status===404)throw Error('저장본을 찾을 수 없습니다. 목록을 새로고침해 주세요.');throw Error('드라이브 요청 실패 ('+r.status+'). 다시 시도해 주세요.');}
   if(raw){const text=await r.text();if(new Blob([text]).size>MAX)throw Error('불러올 자료가 5MB를 넘습니다.');return text;}return await r.json();
  }catch(e){if(e.name==='AbortError')throw Error('드라이브 응답 시간이 초과되었습니다. 저장 중이었다면 목록을 확인한 뒤 다시 시도해 주세요.');throw e;}finally{clearTimeout(timer);}
 }
 async files(q){const all=[];let token='';const seen=new Set();do{const params=new URLSearchParams({q,spaces:'drive',pageSize:'100',fields:'nextPageToken,files(id,name,createdTime,size,appProperties)',orderBy:'createdTime desc',...(token?{pageToken:token}:{})});const r=await this.request(API+'/files?'+params);all.push(...(r.files||[]));token=r.nextPageToken||'';if(token&&seen.has(token))throw Error('목록을 다시 불러와 주세요.');seen.add(token);}while(token);return all;}
 async list(){return this.files("trashed = false and appProperties has { key='lessonRunner' and value='snapshot-v1' }");}
 async folder(){const folders=await this.files("trashed = false and mimeType = 'application/vnd.google-apps.folder' and appProperties has { key='lessonRunner' and value='folder-v1' }");if(folders.length)return folders[0].id;
  const r=await this.request(API+'/files?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'수업 실행 도우미',mimeType:'application/vnd.google-apps.folder',appProperties:{lessonRunner:'folder-v1'}})});return r.id;
 }
 async save(unit,normalize){const text=snapshot(unit,normalize),parent=await this.folder(),stamp=new Date().toISOString();
  const metadata={name:unit.unit.slice(0,100)+'_'+stamp.replace(/[:.]/g,'-')+'.json',mimeType:'application/json',parents:[parent],appProperties:{lessonRunner:'snapshot-v1'}};
  const boundary='lesson_runner_'+Math.random().toString(36).slice(2);
  const body=new Blob(['--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n',JSON.stringify(metadata),'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n',text,'\r\n--'+boundary+'--'],{type:'multipart/related; boundary='+boundary});
  return this.request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime',{method:'POST',headers:{'Content-Type':body.type},body});
 }
 async read(file){if(!/^[\w-]+$/.test(file.id)||Number(file.size)>MAX)throw Error('저장본의 크기 또는 형식을 확인해 주세요.');return this.request(API+'/files/'+encodeURIComponent(file.id)+'?alt=media',{},true);}
}
const exported={Client,snapshot,validClient,SCOPE};if(typeof module!=='undefined'){module.exports=exported;return;}root.LRDrive=exported;
const client=new Client();let working=false,authPending=false,oauth=null,expiryTimer=null,files=[];
const el=id=>document.getElementById(id);
function state(message){el('driveStatus').textContent=message;el('driveBadge').textContent=client.ready()?'연결됨':'연결 필요';for(const b of document.querySelectorAll('[data-drive]'))b.disabled=working||authPending||(b.dataset.drive!=='connect'&&!client.ready());el('driveClientId').disabled=working||authPending;}
function fail(e){state(e instanceof TypeError?'드라이브에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.':e.message||String(e));}
function connect(){
 const id=el('driveClientId').value.trim();if(!validClient(id)){el('driveSetup').open=true;state('앱용 OAuth 클라이언트 ID를 먼저 등록해 주세요. Gemini API 키가 아닙니다.');return;}
 if(!root.google?.accounts?.oauth2){state('Google 연결 도구를 준비 중입니다. 잠시 뒤 다시 눌러 주세요. 학교망에서 accounts.google.com 접근이 허용되어야 합니다.');return;}
 try{localStorage.setItem('lr_drive_client_id',id);}catch{}
 client.clear();files=[];render();authPending=true;state('Google 창에서 계정을 선택해 주세요.');
 oauth=root.google.accounts.oauth2.initTokenClient({client_id:id,scope:SCOPE,include_granted_scopes:false,
  callback:async r=>{authPending=false;try{if(r.error)throw Error('구글 연결이 승인되지 않았습니다. 다시 연결해 주세요.');client.authorize(r);clearTimeout(expiryTimer);expiryTimer=setTimeout(()=>{client.clear();files=[];render();state('구글 연결이 만료되었습니다. 다시 연결해 주세요.');},Math.max(0,client.expires-Date.now()));await run(async()=>{await list();state('연결되었습니다. 이 앱에서 만든 저장본을 불러오거나 현재 단원을 저장하세요.');});}catch(e){client.clear();fail(e);}},
  error_callback:()=>{authPending=false;state('구글 연결 창이 닫혔거나 차단되었습니다. 팝업을 허용한 뒤 다시 연결해 주세요.');}});
 try{oauth.requestAccessToken({prompt:'select_account'});}catch(e){authPending=false;fail(e);}
}
function render(){el('driveList').innerHTML=files.length?files.map((f,i)=>`<div class="drive-file"><div><strong>${escapeHTML(f.name)}</strong><small>${escapeHTML(new Date(f.createdTime).toLocaleString('ko-KR'))} · 이전 저장본도 보존됩니다.</small></div><button data-drive="load" data-drive-index="${i}">사본 불러오기</button></div>`).join(''):'<p class="muted">'+(client.ready()?'아직 저장본이 없습니다. 현재 단원을 드라이브에 저장해 보세요.':'구글 계정을 연결하면 저장본이 표시됩니다.')+'</p>';}
async function list(){const next=await client.list();files=next;render();}
async function run(fn){if(working||busy)return;working=true;busy=true;state('드라이브 작업 중…');try{await fn();}catch(e){fail(e);}finally{working=false;busy=false;state(el('driveStatus').textContent);}}
document.addEventListener('click',event=>{const b=event.target.closest('[data-drive]');if(!b||b.disabled||busy||working||authPending)return;const action=b.dataset.drive;
 if(action==='connect'){connect();return;}
 if(action==='disconnect'){client.clear();clearTimeout(expiryTimer);files=[];render();state('이 기기의 연결을 해제했습니다. 구글 계정의 앱 권한과 드라이브 파일은 유지됩니다.');return;}
 void run(async()=>{
  if(action==='list'){await list();state('저장본 목록을 갱신했습니다.');}
  if(action==='save'){
   captureInputs();saveAuto();const data=structuredClone(S);const saved=await client.save(data,LR.normalize);
   state('드라이브 저장 완료 · '+data.unit+' · '+new Date().toLocaleTimeString('ko-KR'));
   try{await list();}catch{state('저장은 완료됐지만 목록을 갱신하지 못했습니다. 저장본 새로고침을 눌러 주세요.');}
  }
  if(action==='load'){
   const f=files[Number(b.dataset.driveIndex)];if(!f)throw Error('저장본을 다시 선택해 주세요.');const text=await client.read(f),data=JSON.parse(text);
   const imported=cleanUnit(LR.normalize(data));captureInputs();saveAuto();
   if(units.some(u=>u.id===imported.id)){imported.id=LR.uid();imported.unit+=' (드라이브 사본)';}
   units.push(imported);S=imported;selectedSession='';syncInputs();refreshData();saveAuto();
   state(storageBroken?'자료를 열었지만 기기 저장에 실패했습니다. 작업 파일로 백업해 주세요.':'단원을 불러왔습니다. 오늘의 수업이나 자료 보관함에서 확인하세요.');toast('단원을 불러왔습니다. 기존 단원은 보존됩니다.');
  }
 });
});
el('driveClientId').value=root.LR_GOOGLE_CLIENT_ID||readStorage('lr_drive_client_id')||'';
el('driveClientId').addEventListener('input',()=>{client.clear();clearTimeout(expiryTimer);files=[];render();state('연결 설정이 바뀌었습니다. 다시 연결해 주세요.');});
render();state(validClient(el('driveClientId').value)?'구글 계정을 연결해 주세요.':'최초 1회 앱용 Google 인증 설정이 필요합니다. 아래 설정 안내를 펼쳐 주세요.');
// Load GIS ahead of a click so the account chooser remains a direct user gesture.
const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onerror=()=>state('Google 연결 도구를 불러오지 못했습니다. 네트워크를 확인하고 새로고침해 주세요.');document.head.append(script);
})(typeof globalThis!=='undefined'?globalThis:this);
