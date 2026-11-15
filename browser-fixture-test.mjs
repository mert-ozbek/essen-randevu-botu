import { chromium } from 'playwright';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { readCalendarDocument } from './calendar.mjs';

// Local clone of a captured real calendar: never changes the live website.
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const file = (await readdir('audit')).filter(f=>f.endsWith('.html')).sort()[0];
  await page.setContent(await readFile(`audit/${file}`,'utf8'));
  const captured = JSON.parse(await readFile(`audit/${file.replace('.html','.json')}`,'utf8'));
  // A select's live value is not serialized by outerHTML; restore captured values.
  await page.locator('.duet-date__select--month').selectOption(String(captured.month));
  await page.locator('.duet-date__select--year').selectOption(String(captured.year));
  const before = await page.evaluate(readCalendarDocument);
  const candidate = before.records.find(r => !r.available);
  assert.ok(candidate, 'Positive fixture needs a disabled day');
  await page.evaluate(day => {
    const cell = [...document.querySelectorAll('.duet-date__day.is-month')].find(e => Number(e.querySelector('[aria-hidden="true"]').textContent) === day);
    cell.classList.remove('is-disabled'); cell.removeAttribute('disabled'); cell.setAttribute('aria-disabled','false');
  }, candidate.day);
  const after = await page.evaluate(readCalendarDocument);
  assert.ok(after.days.includes(candidate.day));
  assert.equal(after.days.length,before.days.length+1);
  await writeFile('audit/fixture-test.json', JSON.stringify({type:'SYNTHETIC LOCAL CLONE, NOT REAL AVAILABILITY',result:'PASS',source:file,injectedDay:candidate.day,before:before.days,after:after.days},null,2));
  console.log('PASS: gerçek takvim HTML kopyasına eklenen yapay uygun gün, üretimdeki aynı okuyucu tarafından algılandı. Telegram gönderilmedi.');
} finally { await browser.close(); }
