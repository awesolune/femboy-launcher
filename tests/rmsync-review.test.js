const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../src/core/rmsync-compat.js'),'utf8');
function load(){const calls=[];const mock={rmSync(){},existsSync:()=>false,lstatSync:()=>{const e=new Error('access denied');e.code='EACCES';throw e;},unlinkSync:p=>calls.push(p)};const ctx={module:{exports:{}},require:n=>n==='fs'?mock:require(n),process:{platform:'win32'},URL,Buffer,SharedArrayBuffer,Int32Array,Atomics};vm.runInNewContext(source,ctx);return {remove:ctx.module.exports.rmTreeSync,calls};}
test('force must not hide access-denied errors',()=>{const x=load();assert.throws(()=>x.remove(path.resolve('work/electron-review/inaccessible'),{force:true}),{code:'EACCES'});});
test('non-path arguments must fail before filesystem access',()=>{const x=load();assert.throws(()=>x.remove(null,{force:true}),{code:'ERR_INVALID_ARG_TYPE'});});
