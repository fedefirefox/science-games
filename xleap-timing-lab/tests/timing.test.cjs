'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const context = vm.createContext({});
vm.runInContext(script.slice(0, script.indexOf('function tickStep')) + '\nglobalThis.api={model,INITIAL,freeSlipModule};', context);
const {model, INITIAL, freeSlipModule} = context.api;
let checks = 0;
function near(actual, expected) { assert.ok(Math.abs(actual-expected)<1e-9, `${actual} != ${expected}`); checks++; }
for (const mode of ['harmonic','independent']) {
 for (const [e1,e2] of [[365,730],[530,430],[510,535],[100,2000],[2000,100]]) {
  for (const n2 of [1,4,12]) {
   for (const chicane of [0,3.7,1000]) {
    const state={...INITIAL,mode,e1,e2,n2,chicane,odl:false};
    const off=model(state);
    near(off.t2-off.t1,off.delta);
    for (const optical of [0,7.3,15]) {
     const on=model({...state,odl:true,optical});
     near(on.t1-off.t1,optical); near(on.t2,off.t2); near(on.delta-off.delta,-optical);
     near(on.t2-on.t1,on.delta);
    }
    const delayed=model({...state,chicane:chicane+1});
    if(chicane<1000){near(delayed.delta-off.delta,1);near(delayed.t1-off.t1,-1);near(delayed.t2,off.t2);}
    if(n2<12)near(model({...state,n2:n2+1}).delta-off.delta,off.dr);
   }
  }
 }
}
// Independent anchors and measured harmonic slope, not just internal identities.
near(model({...INITIAL,mode:'independent',e1:530,e2:430,n2:1,odl:false}).delta,10);
near(freeSlipModule(740),87*4.135667696/740);
assert.ok(Math.abs(model({...INITIAL,e1:370}).dr-0.130)<0.019); checks++;
const normal=model(INITIAL);
near(normal.delta,0.2125 + 0.27 * 4 * 87 * 4.135667696 / 730);
assert.equal(model({...INITIAL,n2:0}).n2,1);
assert.equal(model({...INITIAL,n2:99}).n2,12);
assert.equal(model({...INITIAL,e1:500,e2:300}).e2,1000);
assert.equal(model({...INITIAL,mode:'independent',e1:500,e2:300}).e2,300);
console.log(`PASS: ${checks+4} timing and boundary checks`);
