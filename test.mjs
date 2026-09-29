import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from './server.mjs';
const token='test-only-token-012345678901234567890';
async function fixture(t,options={}){
 const calls=[];
 const server=createApp({apiKey:'test-key',accessToken:token,fetchFn:async(url,options)=>{calls.push({url,...options});return Response.json({output:[{content:[{type:'output_text',text:'x = 4'}]}]})},...options});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections()}));
 const base=`http://127.0.0.1:${server.address().port}`;
 const ask=(body,auth=token)=>fetch(base+'/ask',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+auth},body:JSON.stringify(body)});
 return {ask,calls,base};
}
test('health, authentication, validation and successful response',async t=>{
 const {ask,calls,base}=await fixture(t);
 assert.equal((await fetch(base+'/health')).status,200);
 assert.equal((await ask({question:'2x = 8',mode:'explain'},'wrong')).status,401);
 for(const body of [null,{}, {question:'',mode:'hint'},{question:'hi',mode:'__proto__'}])assert.equal((await ask(body)).status,400);
 assert.equal(calls.length,0);
 const result=await ask({question:'2x = 8',mode:'explain'});
 assert.deepEqual(await result.json(),{answer:'x = 4',incomplete:false});
 const payload=JSON.parse(calls[0].body);
 assert.equal(payload.input,'2x = 8');assert.equal(payload.store,false);
 assert.equal(calls[0].headers.Authorization,'Bearer test-key');
 assert.equal(payload.model,'gpt-5-mini');
});
test('daily limit prevents further paid requests',async t=>{
 const {ask,calls}=await fixture(t,{maxDaily:1});
 assert.equal((await ask({question:'hi',mode:'hint'})).status,200);
 assert.equal((await ask({question:'hi',mode:'hint'})).status,429);
 assert.equal(calls.length,1);
});
test('provider errors do not leak response content',async t=>{
 const {ask}=await fixture(t,{fetchFn:async()=>new Response('private provider detail',{status:401})});
 const r=await ask({question:'hi',mode:'check'});assert.equal(r.status,502);
 assert.ok(!(await r.text()).includes('private provider detail'));
});
