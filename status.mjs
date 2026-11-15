const prettyDate = iso => iso.split('-').reverse().join('.');
export function statusMessage(result) {
  if (!result.start || !result.end || result.months?.length !== 13 || !Array.isArray(result.dates)) throw new Error('Eksik tarama için başarı mesajı üretilemez.');
  const outcome = result.dates.length
    ? `Seçilebilir günler: ${result.dates.map(prettyDate).join(', ')}`
    : 'Bu taramada uygun gün bulunamadı.';
  return `🔄 Essen 16d botu — durum raporu\n\nSon başarılı tarama: ${result.time} (Almanya saati)\nTaranan aralık: ${prettyDate(result.start)} – ${prettyDate(result.end)}\nKontrol edilen takvim: ${result.months.length} ay görünümü\n${outcome}\n\nOtomatik izleme cron-job.org üzerinden 5 dakikada bir tetiklenir; tarama GitHub Actions üzerinde çalışır. Çalıştırmalarda gecikme olabilir. Bu mesaj yalnızca yukarıdaki tamamlanan taramayı doğrular.\nRandevu bulunduğunda ayrıca bildirim gönderilir.`;
}
export function failureMessage(time) {
  return `⚠️ Essen 16d botu — durum kontrolü başarısız\n\nKontrol zamanı: ${time} (Almanya saati)\nTarama tamamlanamadı veya bildirim gönderiminde hata oldu. Bu sonuç “randevu yok” anlamına gelmez.\nAyrıntılar: https://github.com/mert-ozbek/essen-randevu-botu/actions\ncron-job.org bir sonraki 5 dakikalık aralıkta yeni kontrolü başlatmayı deneyecek.`;
}
