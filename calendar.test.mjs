import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readCalendarDocument, datesInWindow } from './calendar.mjs';

function fixture({ month = 10, year = 2026, available = [], count, ariaMissing = false, conflict = false } = {}) {
  const n = count ?? new Date(year, month+1, 0).getDate();
  return {
    querySelector: s => s.includes('--month') ? {value:String(month)} : {value:String(year)},
    querySelectorAll: () => Array.from({length:n}, (_,i) => ({
      querySelector: () => ({textContent:String(i+1)}),
      getAttribute: s => s === 'aria-disabled' ? (ariaMissing ? null : String(!available.includes(i+1))) : '',
      classList: {contains: () => conflict || !available.includes(i+1)},
      hasAttribute: () => false, textContent:String(i+1)
    }))
  };
}
function read(options) { globalThis.document = fixture(options); try { return readCalendarDocument(); } finally { delete globalThis.document; } }
test('all disabled days produce no availability', () => assert.deepEqual(read().days, []));
test('one and multiple available days are detected among disabled days', () => assert.deepEqual(read({available:[16,25,30]}).days,[16,25,30]));
test('leap February has 29 days', () => assert.equal(read({month:1,year:2028}).totalDays,29));
test('partial calendar fails instead of returning no appointments', () => assert.throws(()=>read({count:27}),/beklenen/));
test('missing availability attribute fails closed', () => assert.throws(()=>read({ariaMissing:true}),/belirsiz/));
test('contradictory availability fails closed', () => assert.throws(()=>read({available:[16],conflict:true}),/çelişiyor/));
test('past and beyond-horizon dates excluded, boundary included', () => assert.deepEqual(datesInWindow({year:2026,month:10,days:[14,15,16,30]},'2026-11-15','2026-11-16'),['2026-11-15','2026-11-16']));
