const test=require('node:test'),assert=require('node:assert/strict');
const {publish}=require('../build/publish-spaceweb');
const {remote,plan}=require('./spaceweb-remote-fixture');
const R=require('../build/spaceweb-recovery');
test('FTP expiry after HTTP checks reconnects and completes the verified website',async()=>{
 const r=remote(),get=r.get;let armed=false,failed=false;
 r.get=async(...args)=>{if(armed&&!failed&&args[0]===R.LOCK+'/owner.json'){failed=true;throw Object.assign(Error('fixture expired FTP session'),{code:421});}return get(...args);};
 await publish(plan(),r,{verify:async()=>{armed=true;}});
 assert.equal(failed,true);assert.ok(r.reconnects>0);
 assert.equal((await r.get(R.ROOT+'/index.html')).toString(),'Femboy Launcher NEW');
 assert.equal(await r.exists(R.LOCK),false);
});
test('lost completion-write acknowledgement is safely replayed',async()=>{
 let failed=false;const r=remote({fault(op,args,phase){if(!failed&&op==='put'&&args[0]===R.LOCK+'/complete.json'&&phase==='after'){failed=true;throw Object.assign(Error('fixture lost completion reply'),{code:421});}}});
 await publish(plan(),r);assert.equal(failed,true);assert.ok(r.reconnects>0);
 assert.equal((await r.get(R.ROOT+'/index.html')).toString(),'Femboy Launcher NEW');
 assert.equal(await r.exists(R.LOCK),false);
});
test('persistent completion expiry still fails and restores the previous website',async()=>{
 const r=remote(),get=r.get;let failures=0,armed=false;const logs=[];
 r.get=async(...args)=>{if(armed&&failures<3&&args[0]===R.LOCK+'/owner.json'){failures++;throw Object.assign(Error('fixture FTP unavailable'),{code:421});}return get(...args);};
 await assert.rejects(publish(plan(),r,{verify:async()=>{armed=true;},log:s=>logs.push(s)}),e=>e.code===421);
 assert.equal(failures,3);assert.equal((await r.get(R.ROOT+'/index.html')).toString(),'Femboy Launcher OLD');
 assert.ok(logs.includes('SpaceWeb: stopped in phase completion'));assert.equal(await r.exists(R.LOCK),false);
});
