import assert from 'node:assert/strict';
function monthsInclusive(a,b){const x=new Date(a+'T00:00:00Z'),y=new Date(b+'T00:00:00Z');if(y<x)return 0;return (y.getUTCFullYear()-x.getUTCFullYear())*12+y.getUTCMonth()-x.getUTCMonth()+1}
function shiftMonth(s,n){const d=new Date(s+'T00:00:00Z'),day=d.getUTCDate(),f=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+n,1)),last=new Date(Date.UTC(f.getUTCFullYear(),f.getUTCMonth()+1,0)).getUTCDate();f.setUTCDate(Math.min(day,last));return f.toISOString().slice(0,10)}
assert.equal(monthsInclusive('2026-10-01','2026-12-30'),3);
assert.equal(3000*monthsInclusive('2026-10-01','2026-12-30'),9000);
assert.equal(monthsInclusive('2026-10-15','2026-10-14'),0);
assert.equal(shiftMonth('2026-01-31',1),'2026-02-28');
assert.equal(shiftMonth('2028-01-31',1),'2028-02-29');
assert.equal(shiftMonth('2026-10-01',2),'2026-12-01');
console.log('Billing math: 6/6 tests passed');
