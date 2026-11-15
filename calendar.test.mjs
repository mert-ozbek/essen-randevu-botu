import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readCalendarDocument, datesInWindow } from './calendar.mjs';

function fixture({ month = 10, year = 2026, available = [], count, ariaMissing = false, conflict = false, liveFormat = false, missingTitle = false } = {}) {
  const n = count ?? new Date(year, month+1, 0).getDate();
  return {
    querySelector: s => s.includes('--month') ? {value:String(month)} : {value:String(year)},
    querySelectorAll: () => Array.from({length:n}, (_,i) => ({
      querySelector: () => ({textContent:String(i+1)}),
      getAttribute: s => s === 'aria-disabled' ? (ariaMissing || (liveFormat && available.includes(i+1)) ? null : String(!available.includes(i+1))) : (missingTitle ? null : (available.includes(i+1) ? 'Datum ist verfügbar' : 'Datum nicht verfügbar')),
      classList: {contains: () => conflict || !available.includes(i+1)},
      hasAttribute: () => false, textContent:String(i+1)
    }))
  };
}
function read(options) { globalThis.document = fixture(options); try { return readCalendarDocument(); } finally { delete globalThis.document; } }
test('all disabled days produce no availability', () => assert.deepEqual(read().days, []));
test('one and multiple available days are detected among disabled days', () => assert.deepEqual(read({available:[16,25,30]}).days,[16,25,30]));
test('real site enabled days omit aria-disabled', () => assert.deepEqual(read({available:[16,17,18,19,20],liveFormat:true}).days,[16,17,18,19,20]));
test('disabled cells added after February can lack a tooltip', () => assert.deepEqual(read({month:2,missingTitle:true}).days,[]));
test('leap February has 29 days', () => assert.equal(read({month:1,year:2028}).totalDays,29));
test('partial calendar fails instead of returning no appointments', () => assert.throws(()=>read({count:27}),/beklenen/));
test('missing availability attribute fails closed', () => assert.throws(()=>read({ariaMissing:true}),/belirsiz/));
test('contradictory availability fails closed', () => assert.throws(()=>read({available:[16],conflict:true}),/çelişiyor/));
test('past and beyond-horizon dates excluded, boundary included', () => assert.deepEqual(datesInWindow({year:2026,month:10,days:[14,15,16,30]},'2026-11-15','2026-11-16'),['2026-11-15','2026-11-16']));
