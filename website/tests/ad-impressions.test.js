import {test} from 'node:test';
import assert from 'node:assert/strict';
import {observeAd} from '../src/scripts/ad-impressions.mjs';
const drain=()=>new Promise(r=>setImmediate(r));
function setup(hidden=false,send=async()=>{}){
  let callback,listener,disconnected=0; const retries=[];
  const card={dataset:{adErid:'MvGzQC9JbZnS6fV7CXrHCtaz'}};
  const doc={visibilityState:hidden?'hidden':'visible',addEventListener:(n,fn)=>listener=fn,removeEventListener:()=>{}};
  class Observer{constructor(fn){callback=fn;}observe(){}disconnect(){disconnected++;}}
  observeAd(card,{document:doc,Observer,send,uuid:()=> '00000000-0000-4000-8000-000000000001',later:fn=>retries.push(fn)});
  return {enter:(ratio=1)=>callback([{target:card,isIntersecting:ratio>0,intersectionRatio:ratio}]),show:()=>{doc.visibilityState='visible';listener();},retries};
}
test('below-fold and hidden-tab visits do not count; becoming visible counts once',async()=>{const calls=[];const s=setup(true,async p=>calls.push(p));s.enter(0);await drain();assert.equal(calls.length,0);s.enter();await drain();assert.equal(calls.length,0);s.show();await drain();assert.equal(calls.length,1);s.enter();s.show();await drain();assert.equal(calls.length,1);});
test('retries preserve event ID and stop after success',async()=>{const calls=[];const s=setup(false,async p=>{calls.push(p);if(calls.length===1)throw Error();});s.enter();await drain();assert.equal(s.retries.length,1);s.retries.shift()();await drain();assert.equal(calls.length,2);assert.deepEqual(calls[0],calls[1]);assert.equal(s.retries.length,0);});
test('persistent failure has a bounded retry count',async()=>{let calls=0;const s=setup(false,async()=>{calls++;throw Error();});s.enter();await drain();while(s.retries.length){s.retries.shift()();await drain();}assert.equal(calls,3);});
