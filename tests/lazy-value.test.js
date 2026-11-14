'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const root=path.join(__dirname,'..');
const {Lazy}=require('lazy-val');

test('deferred adapter caches exact scalar values without eager evaluation',()=>{
 for(const expected of [undefined,null,false,0,'',{},Symbol('value')]){
  let calls=0;const value=new Lazy(()=>{calls++;return expected;});
  assert.equal(calls,0);assert.equal(value.hasValue,false);
  assert.equal(value.value,expected);assert.equal(value.value,expected);
  assert.equal(calls,1);assert.equal(value.hasValue,true);
 }
});
test('deferred adapter shares in-flight promises and retains rejection until replaced',async()=>{
 let finish,calls=0;const promise=new Promise(resolve=>{finish=resolve;});
 const value=new Lazy(()=>{calls++;return promise;});
 assert.equal(value.value,promise);assert.equal(value.value,promise);assert.equal(calls,1);
 finish(42);assert.equal(await value.value,42);
 const error=Error('expected failure'),rejected=Promise.reject(error);
 value.value=rejected;assert.equal(value.value,rejected);
 await assert.rejects(value.value,e=>e===error);assert.equal(value.value,rejected);
 value.value=Promise.resolve('recovered');assert.equal(await value.value,'recovered');
});
test('deferred adapter retries synchronous failures and permits explicit assignment',()=>{
 let calls=0;const value=new Lazy(()=>{if(++calls===1)throw Error('retry');return 7;});
 assert.throws(()=>value.value,/retry/);assert.equal(value.hasValue,false);
 assert.equal(value.value,7);assert.equal(calls,2);
 const assigned=new Lazy(()=>{throw Error('must not run');});
 assigned.value=undefined;assert.equal(assigned.hasValue,true);assert.equal(assigned.value,undefined);
 value.value=null;assert.equal(value.value,null);
});
test('every installed consumer resolves the project adapter, never the upstream package',()=>{
 const lock=require('../package-lock.json');
 for(const [location,pkg]of Object.entries(lock.packages)){
  if(!pkg.dependencies?.['lazy-val'])continue;
  const req=createRequire(path.join(root,location,'package.json'));
  assert.equal(req('lazy-val').Lazy,Lazy,location);
  assert.equal(req('lazy-val/package.json').name,'@femboy-launcher/lazy-value',location);
 }
 assert.equal(require('lazy-val/package.json').license,'GPL-3.0-only');
 for(const [location,pkg]of Object.entries(lock.packages)){
  if(/(?:^|\/)node_modules\/lazy-val$/.test(location)){
   assert.equal(pkg.name,'@femboy-launcher/lazy-value');
   assert.match(pkg.resolved,/^file:vendor\//);assert.ok(pkg.integrity);
  }
 }
});
test('vendored archive contains exactly the reviewed source and license bytes',()=>{
 const zlib=require('node:zlib');const tar=zlib.gunzipSync(fs.readFileSync(path.join(root,'vendor/femboy-launcher-lazy-value-1.0.0.tgz')));
 const files=[];
 for(let offset=0;offset+512<=tar.length;){
  const header=tar.subarray(offset,offset+512);if(header.every(b=>b===0))break;
  const name=header.subarray(0,100).toString().replace(/\0.*$/s,'');
  const size=parseInt(header.subarray(124,136).toString().replace(/\0.*$/s,'').trim(),8)||0;
  assert.match(name,/^package\/(?:index\.js|index\.d\.ts|LICENSE|README\.md|package\.json)$/);
  assert.deepEqual(tar.subarray(offset+512,offset+512+size),fs.readFileSync(path.join(root,'vendor/lazy-value',name.slice(8))));
  files.push(name);offset+=512+Math.ceil(size/512)*512;
 }
 assert.equal(files.length,5);assert.equal(new Set(files).size,5);
});
test('real electron-updater config cache uses the local adapter and resets safely',async()=>{
 // Only the Electron binding is stubbed; AppUpdater and its cache are real.
 const Module=require('node:module'),load=Module._load;
 let AppUpdater;
 try{Module._load=function(id,...args){if(id==='electron')return {};return load.call(this,id,...args);};
  ({AppUpdater}=require('electron-updater/out/AppUpdater'));
 }finally{Module._load=load;}
 const updater=new AppUpdater(undefined,{version:'0.10.2',isPackaged:true});
 let calls=0;updater.loadUpdateConfig=async()=>({sequence:++calls});
 assert.ok(updater.configOnDisk instanceof Lazy);assert.equal(calls,0);
 const first=updater.configOnDisk.value;assert.equal(first,updater.configOnDisk.value);
 assert.deepEqual(await first,{sequence:1});
 updater.updateConfigPath=path.join(root,'unused-test-update-config.yml');
 assert.equal(updater.configOnDisk.hasValue,false);
 assert.deepEqual(await updater.configOnDisk.value,{sequence:2});
 updater.getOrCreateStagingUserId=async()=> 'mock-staging-id';
 assert.equal(await updater.stagingUserIdPromise.value,'mock-staging-id');
});
