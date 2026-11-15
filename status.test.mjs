import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statusMessage, failureMessage } from './status.mjs';
const report = {time:'15.11.2026 23:30:00',start:'2026-11-15',end:'2027-11-15',months:Array(13).fill('month'),dates:[]};
test('success reports the completed interval and no availability',()=>{
  const message=statusMessage(report);
  assert.match(message,/15\.11\.2026 – 15\.11\.2027/);
  assert.match(message,/uygun gün bulunamadı/);
  assert.match(message,/23:30:00/);
});
test('available dates never described as unavailable',()=>{
  const message=statusMessage({...report,dates:['2026-11-16']});
  assert.match(message,/16\.11\.2026/); assert.doesNotMatch(message,/uygun gün bulunamadı/);
});
test('partial results cannot produce a success status',()=>assert.throws(()=>statusMessage({...report,months:[]})));
test('failure is distinct from no appointment',()=>{
  const message=failureMessage(report.time); assert.match(message,/başarısız/); assert.match(message,/randevu yok.*anlamına gelmez/);
});
