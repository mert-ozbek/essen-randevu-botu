# Essen 16d randevu kontrolü

## Bilgisayar kapalıyken çalışma

Tarama GitHub Actions üzerinde çalışır. cron-job.org, `kontrol.yml` iş akışını 5 dakikada bir, `durum.yml` iş akışını Europe/Berlin saat diliminde 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00 ve 21:00 saatlerinde başlatır. Hizmetlerde gecikme olabilir; tamamlanan taramayı GitHub çalışma kayıtlarından doğrulayın. Çift çalışmayı önlemek için GitHub'ın yerleşik cron tetikleyicileri kaldırılmıştır.

Telegram grup bilgileri GitHub Actions Secrets içinde `TELEGRAM_BOT_TOKEN` ve `TELEGRAM_CHAT_ID` olarak tutulur. GitHub erişim anahtarı yalnızca cron-job.org Authorization başlığında tutulur; koda, sohbete veya kayıt dosyalarına koymayın. Anahtar 16 Şubat 2027 tarihinde sona erer; süre dolmadan yenileyip iki cron işinde de güncelleyin.

## Zamanlayıcı istekleri

İki iş de POST yöntemiyle GitHub API'sine çağrı yapar. Başlıklar: `Accept: application/vnd.github+json`, `Content-Type: application/json`, `Authorization: Bearer <gizli anahtar>`.

Tarama URL'si: `https://api.github.com/repos/mert-ozbek/essen-randevu-botu/actions/workflows/kontrol.yml/dispatches`

İstek gövdesi: `{"ref":"main","inputs":{"scan_only":false}}`

Durum raporu URL'si: `https://api.github.com/repos/mert-ozbek/essen-randevu-botu/actions/workflows/durum.yml/dispatches`

İstek gövdesi: `{"ref":"main"}`

HTTP 204, GitHub'ın başlatma isteğini kabul ettiğini gösterir; taramanın başarılı olduğunu göstermez. GitHub Actions içindeki tamamlanmış yeşil iş ve aylık tarama kayıtları ayrıca kontrol edilmelidir. Dış zamanlayıcı ile başlatılan işler GitHub'da `workflow_dispatch` / Manually run olarak görünür. Otomatik çağrının kanıtı cron-job.org History kaydı ile eşleşen GitHub çalışmasıdır.

## Ne taranır?

Bot §16d (Ärzte/Apotheker) → Ja → 1 kişi yolunu izler. Bugün ile bir yıl sonrası arasındaki seçilebilir günleri 13 takvim ayı görünümünde kontrol eder. Gün/saat seçmez, rezervasyon yapmaz, kişisel bilgi girmez. Uygun gün, saat veya rezervasyon garantisi değildir.

Uygun gün bulunursa gruba “🚨 ÖNEMLİ — RANDEVU BULUNDU” bildirimi gider. Üç saatlik başarılı tam tarama sonrasında 🔄 durum raporu gönderilir. Hata, “randevu yok” olarak değerlendirilmez. Takvim yapısı değişirse kontrol hata verir; CAPTCHA veya erişim engeli aşılmaz.

## Doğrulama ve yerel kullanım

`node --test calendar.test.mjs status.test.mjs` takvim ayrıştırma ve rapor testlerini çalıştırır. GitHub'daki manuel “Takvim doğrulama ve kanıt raporu” işi ekran görüntüleri ve JSON kanıtları üretir; Telegram mesajı göndermez.

Yerel kullanım için Node.js kurulu olmalıdır:

```powershell
npm install
npx playwright install chromium
npm run check
```

Sürekli yerel kullanım: `npm start` veya `baslat.cmd`. Yerel kullanımda bilgisayar açık ve uyanık kalmalıdır. `CHECK_SECONDS` varsayılan 300 saniyedir; `SHOW_BROWSER=1` görünür tarayıcı açar. Bulut kullanımında bilgisayarın açık olması gerekmez.

Uygun gün aynı kalırsa ayrı GitHub çalıştırmalarında bildirim tekrarlanabilir. Açık depo GitHub Actions kullanım koşulları ve ücretsiz kullanım sınırlarına tabidir. Gizli bilgiler yalnızca ilgili hizmetin gizli alanlarında saklanmalıdır.
