import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { readCalendarDocument, datesInWindow } from './calendar.mjs';

const URL = 'https://termine.essen.de/?link=9eb2';
const interval = Number(process.env.CHECK_SECONDS || 300);
if (!Number.isFinite(interval) || interval < 60) throw new Error('CHECK_SECONDS en az 60 olmalı.');
const once = process.argv.includes('--once');
const audit = process.env.BOT_AUDIT === '1';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const stamp = () => new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Berlin' });
let stopping = false;
process.on('SIGINT', () => { stopping = true; process.exit(0); });

async function alertUser(dates) {
  console.log('\x07\n*** UYGUN GÜN BULUNDU ***\n' + dates.join('\n') + '\n' + URL);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (token && chat) {
    let response;
    try {
      response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: `Essen 16d: seçilebilir gün bulundu!\n${dates.join('\n')}\n${URL}\nRandevu oluşturulmadı; siteden kontrol edin.` }),
        signal: AbortSignal.timeout(20000)
      });
    } catch { throw new Error('Telegram bağlantısı başarısız; bildirim gönderilemedi.'); }
    if (!response.ok || !(await response.json()).ok) throw new Error('Telegram bildirimi gönderilemedi. Secrets ayarlarını kontrol edin.');
  } else if (process.env.GITHUB_ACTIONS === 'true') {
    throw new Error('Telegram Secrets eksik; bildirim gönderilemedi.');
  }
  if (process.platform === 'win32') {
    // Sabit komut: site içeriği PowerShell koduna eklenmez.
    spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command',
      '[console]::Beep(1000,800); [console]::Beep(1200,800); Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show("Essen 16d için seçilebilir gün bulundu. Bot penceresine ve uygun-gunler.json dosyasına bakın.", "Randevu uyarısı")'],
    { windowsHide: true, stdio: 'ignore' }).unref();
  }
}

async function scan() {
  const browser = await chromium.launch({ headless: process.env.SHOW_BROWSER !== '1' });
  const context = await browser.newContext({ locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('radio', { name: 'Berufliche Anerkennung § 16d (Ärzte/Apotheker)', exact: true }).check();
    await page.locator('#next-button').click();
    await page.getByRole('radio', { name: 'Ja', exact: true }).check();
    await page.locator('#next-button').click();
    await page.getByRole('button', { name: 'Berufliche Anerkennung Ärzte/Apotheker (§16d) - Onlinetermin', exact: true }).click();
    await page.locator('#activity-count-0').selectOption({ label: '1' });
    await page.locator('#next-button').click();
    await page.getByRole('heading', { name: 'Schritt 4 - Benötigte Unterlagen', exact: true }).waitFor();
    await page.locator('#next-button').click();
    await page.locator('#date-select').click();
    await page.locator('.duet-date__dialog.is-active').waitFor();
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
    today.setHours(0, 0, 0, 0);
    const end = new Date(today); end.setFullYear(end.getFullYear() + 1);
    const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dates = [], months = [], evidence = [];
    if (audit) await mkdir('audit', { recursive: true });
    // İçinde bulunduğumuz ay + 12 ay: son ayda yıldönümünü aşan günler elenir.
    for (let i = 0; i < 13; i++) {
      // A delayed/partial render is an error, never an empty-availability result.
      await page.waitForFunction(({year, month}) => {
        const m = Number(document.querySelector('.duet-date__select--month')?.value);
        const y = Number(document.querySelector('.duet-date__select--year')?.value);
        const expected = new Date(year, month + 1, 0).getDate();
        const cells = [...document.querySelectorAll('.duet-date__day.is-month')];
        return m === month && y === year && cells.length === expected && cells.every((e,j) => Number(e.querySelector('[aria-hidden="true"]')?.textContent) === j + 1);
      }, {year: today.getFullYear() + Math.floor((today.getMonth()+i)/12), month: (today.getMonth()+i)%12});
      const state = await page.evaluate(readCalendarDocument);
      months.push(`${state.year}-${String(state.month + 1).padStart(2, '0')}`);
      const key = months.at(-1);
      console.log(`${key}: ${state.totalDays} gün okundu, ${state.days.length} seçilebilir gün.`);
      dates.push(...datesInWindow(state, iso(today), iso(end)));
      evidence.push(state);
      if (audit) {
        await page.locator('#date-picker-container').screenshot({path: `audit/${key}.png`});
        await writeFile(`audit/${key}.html`, await page.locator('#date-picker-container').evaluate(e => e.outerHTML));
        await writeFile(`audit/${key}.json`, JSON.stringify(state, null, 2));
      }
      if (i < 12) {
        await page.getByRole('button', { name: 'Nächster Monat', exact: true }).click();
        await page.waitForFunction(({year, month}) => Number(document.querySelector('.duet-date__select--month')?.value) !== month || Number(document.querySelector('.duet-date__select--year')?.value) !== year, state);
        await page.waitForTimeout(300);
      }
    }
    if (new Set(months).size !== 13) throw new Error('Bütün aylar taranamadı.');
    if (audit) await writeFile('audit/report.json', JSON.stringify({time: stamp(), start:iso(today), end:iso(end), months:evidence, dates},null,2));
    await writeFile('son-kontrol.json', JSON.stringify({ time: stamp(), months, dates }, null, 2));
    if (dates.length) {
      await writeFile('uygun-gunler.json', JSON.stringify({ time: stamp(), dates, url: URL }, null, 2));
      await page.screenshot({ path: 'uygun-gun-takvim.png', fullPage: true });
    }
    return dates;
  } catch (error) {
    await mkdir('hatalar', { recursive: true });
    await page.screenshot({ path: 'hatalar/son-hata.png', fullPage: true }).catch(() => {});
    throw error;
  } finally { await browser.close(); }
}

let previous = '', failures = 0;
do {
  try {
    const dates = await scan();
    failures = 0;
    console.log(`[${stamp()}] ${dates.length ? dates.join(', ') : 'Uygun gün yok.'}`);
    const current = dates.join(',');
    if (current && current !== previous) await alertUser(dates);
    previous = current;
  } catch (error) {
    failures++;
    console.error(`[${stamp()}] KONTROL BAŞARISIZ (randevu yok anlamına gelmez): ${error.message}`);
    if (once) process.exitCode = 1;
  }
  if (once || stopping) break;
  await sleep(Math.min(interval * 2 ** Math.min(failures, 4), 3600) * 1000 + Math.random() * 15000);
} while (!stopping);
