// Self-contained: this same function runs inside Playwright and in fixture tests.
export function readCalendarDocument() {
  const monthSelect = document.querySelector('.duet-date__select--month');
  const yearSelect = document.querySelector('.duet-date__select--year');
  if (!monthSelect || !yearSelect) throw new Error('Takvim ay/yıl alanları eksik.');
  const month = Number(monthSelect.value), year = Number(yearSelect.value);
  if (!Number.isInteger(month) || month < 0 || month > 11 || !Number.isInteger(year) || year < 2000) throw new Error('Takvim ay/yıl bilgisi geçersiz.');
  const cells = [...document.querySelectorAll('.duet-date__day.is-month')];
  const expectedCount = new Date(year, month + 1, 0).getDate();
  if (cells.length !== expectedCount) throw new Error('Takvimde beklenen sayıda gün yok.');
  const records = cells.map(e => {
    const day = Number(e.querySelector('[aria-hidden="true"]')?.textContent);
    const aria = e.getAttribute('aria-disabled');
    const classDisabled = e.classList.contains('is-disabled');
    const nativeDisabled = e.hasAttribute('disabled');
    const title = e.getAttribute('title') || '';
    // The live site omits aria-disabled entirely for available days.
    const availableTitle = title.startsWith('Datum ist verfügbar');
    const unavailableTitle = title.startsWith('Datum nicht verfügbar');
    const available = !nativeDisabled && !classDisabled && aria !== 'true' && availableTitle;
    // Newly added cells (e.g. Feb -> March 29-31) can omit their tooltip.
    const unavailable = aria === 'true' && classDisabled && !availableTitle && (unavailableTitle || title === '');
    if (!available && !unavailable) throw new Error('Gün durumu belirsiz veya çelişiyor; takvim işaretleri değişmiş.');
    if (!Number.isInteger(day) || day < 1 || day > expectedCount) throw new Error('Geçersiz gün numarası.');
    if (aria === 'false' && (classDisabled || nativeDisabled)) throw new Error('Günün seçilebilirlik işaretleri çelişiyor.');
    return { day, ariaDisabled: aria, classDisabled, nativeDisabled, available, label: e.querySelector('.duet-date__vhidden')?.textContent.trim() || `${day}`, title };
  });
  if (new Set(records.map(r => r.day)).size !== expectedCount) throw new Error('Tekrarlanan/eksik takvim günü.');
  return { year, month, totalDays: records.length, days: records.filter(r => r.available).map(r => r.day), records };
}

export function datesInWindow(state, start, end) {
  return state.days.map(day => `${state.year}-${String(state.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    .filter(date => date >= start && date <= end);
}
