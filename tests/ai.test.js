const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function context(provider='gemini',key='test-key',model='gemini-test'){
 const source=fs.readFileSync(require.resolve('../app.js'),'utf8');const values={prov:{value:provider},apiKey:{value:key}};const requests=[];
 const context={$:id=>values[id],currentModel:()=>model,request:async(url,options)=>{requests.push({url,options});return provider==='gemini'?{candidates:[{content:{parts:[{text:'確認',thought:true},{text:'확인'}]}}]}:{content:[{type:'text',text:'확인'}]};},Error,JSON,encodeURIComponent};vm.createContext(context);vm.runInContext(source.slice(source.indexOf('async function ai('),source.indexOf('async function task(')),context);return {context,requests};
}
test('empty Gemini key fails locally and never falls through to Anthropic',async()=>{const {context:c,requests}=context('gemini','');await assert.rejects(()=>c.ai('test'),/키/);assert.equal(requests.length,0);});
test('Gemini key stays in header and visible text excludes thought parts',async()=>{const {context:c,requests}=context();assert.equal(await c.ai('test',100,true),'확인');assert.ok(!requests[0].url.includes('test-key'));assert.equal(requests[0].options.headers['x-goog-api-key'],'test-key');assert.equal(JSON.parse(requests[0].options.body).generationConfig.responseMimeType,'application/json');});
test('Claude respects selected model',async()=>{const {context:c,requests}=context('anthropic','test-key','claude-test');assert.equal(await c.ai('test'),'확인');assert.equal(JSON.parse(requests[0].options.body).model,'claude-test');});
test('truncated model output is rejected before rendering',async()=>{const {context:c}=context();c.request=async()=>({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'partial'}]}}]});await assert.rejects(()=>c.ai('test'),/잘렸/);});
test('invalid structured AI output is rejected',()=>{const {context:c}=context();assert.equal(c.parseJson('```json\n{"a":1}\n```').a,1);assert.throws(()=>c.parseJson('not json'),/형식/);});
function catalogContext(){
 const source=fs.readFileSync(require.resolve('../app.js'),'utf8'),storage={},values={prov:{value:'gemini'},apiKey:{value:'test-key'},modelSel:{value:'gemini-3.5-flash-lite'},modelName:{value:''},customWrap:{},modelHelp:{}};
 const c={$:id=>values[id],readStorage:k=>storage[k],localStorage:{setItem:(k,v)=>storage[k]=v},escapeHTML:s=>String(s),requireAI:()=>true,task:async(_,fn)=>fn(),connectionState:()=>{},saveKeyPrefs:()=>{}};vm.createContext(c);
 vm.runInContext(source.slice(source.indexOf('const MODELS='),source.indexOf('function updateKeyLink()')),c);
 vm.runInContext(source.slice(source.indexOf('async function listModels()')),c);
 return {c,values,storage};
}
test('catalog excludes non-text models, removes duplicates and sorts versions numerically',()=>{
 const {c}=catalogContext(),m=id=>({name:'models/'+id,supportedGenerationMethods:['generateContent']});
 const rows=c.textModels(['gemini-3.8-flash','gemini-3.10-flash','gemini-3.8-flash','gemini-nano-banana-2.1','gemini-omni-1.1-flash','gemini-3.8-flash-tts','gemini-3.5-transcribe'].map(m));
 assert.deepEqual(Array.from(rows,r=>r[0]),['gemini-3.10-flash','gemini-3.8-flash']);
});
test('catalog fetches all pages, persists no key and preserves absent selected model',async()=>{
 const {c,values,storage}=catalogContext(),urls=[];c.request=async url=>{urls.push(url);return {models:[{name:'models/gemini-3.8-flash',supportedGenerationMethods:['generateContent']}],...(urls.length===1?{nextPageToken:'page 2'}:{})};};
 await c.listModels();assert.equal(urls.length,2);assert.ok(urls[1].includes('pageToken=page%202'));assert.equal(values.modelSel.value,'__custom__');assert.equal(values.modelName.value,'gemini-3.5-flash-lite');assert.ok(!storage.lr_gemini_catalog.includes('test-key'));assert.equal(JSON.parse(storage.lr_gemini_catalog).models.length,1);
});
test('catalog fetch failure leaves prior selection and cache intact',async()=>{
 const {c,values,storage}=catalogContext();c.request=async()=>{throw Error('403');};await assert.rejects(()=>c.listModels(),/403/);assert.equal(values.modelSel.value,'gemini-3.5-flash-lite');assert.equal(storage.lr_gemini_catalog,undefined);
});
