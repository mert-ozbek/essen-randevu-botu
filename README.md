# Essen 16d randevu kontrolü

## GitHub Actions ile bilgisayar kapalıyken

GitHub'da `essen-randevu-botu` adlı Public repository oluşturun. Bu klasörün kod dosyalarını ve `.github/workflows/kontrol.yml` dosyasını varsayılan dala yükleyin. `node_modules`, sonuçlar ve hata ekran görüntülerini yüklemeyin.

Telegram'da resmi @BotFather hesabına `/newbot` göndererek bot oluşturun. Verdiği token gizlidir; sohbete veya kod dosyasına yapıştırmayın. Kendi botunuzu açıp Start'a basın. Kendi sohbetinizin chat ID değerini edinmeniz de gerekir.

GitHub repository → Settings → Secrets and variables → Actions → New repository secret yolundan `TELEGRAM_BOT_TOKEN` ve `TELEGRAM_CHAT_ID` ekleyin.

Actions → Essen 16d randevu kontrolü → Run workflow ile ilk kontrolü başlatın. Yeşil sonuç tam taramanın tamamlandığını, kırmızı sonuç kontrol veya bildirim hatasını gösterir. Henüz bulutta çalıştırılarak doğrulanmamıştır.

Zamanlama yaklaşık 5 dakikada birdir; GitHub geciktirebilir veya yoğunlukta çalıştırmayı düşürebilir. Açık depoda 60 gün etkinlik yoksa zamanlama devre dışı kalabilir. Her görev yeni başladığından uygun gün devam ederse her kontrolde tekrar bildirim gönderir. GitHub Actions kullanım kuralları ve ücretsiz plan sınırları geçerlidir. Telegram anahtarı yalnızca Secrets içinde tutulmalıdır.

Bot 16d (Ärzte/Apotheker) → Ja → 1 kişi yolunu izler ve bugün ile bir yıl sonrası arasındaki seçilebilir günleri kontrol eder. Gün veya saat seçmez, rezervasyon yapmaz, kişisel bilgi girmez, 6. adıma geçmez.

## Kurulum

Node.js kurulu olmalı. Bu klasörde PowerShell açıp:

```powershell
npm install
npx playwright install chromium
npm run check
```

Tek kontrol başarılıysa sürekli çalıştırmak için `baslat.cmd` dosyasını çift tıklayın veya `npm start` yazın. Pencere açık, bilgisayar uyanık ve internet bağlı olmalı. Durdurmak için Ctrl+C.

Varsayılan aralık 5 dakika (+ en fazla 15 saniye gecikme). Değiştirmek için:

```powershell
$env:CHECK_SECONDS="300"
npm start
```

Görünür tarayıcıyla teşhis için `$env:SHOW_BROWSER="1"` ayarlayın.

## Bildirim ve sonuçlar

Uygun gün bulunduğunda Windows sesli uyarı ve mesaj penceresi gösterir. `uygun-gunler.json` tarihleri ve bağlantıyı içerir. Aynı sonuç değişmedikçe aynı çalıştırmada tekrar uyarı verilmez. Randevuyu bağlantıdan kendiniz almalısınız; seçilebilir gün bir uygunluk sinyalidir, saat veya rezervasyon garantisi değildir.

`son-kontrol.json` yalnızca tamamlanan taramadan sonra güncellenir. Hata, randevu yok olarak değerlendirilmez; konsolda açıkça belirtilir ve `hatalar/son-hata.png` kaydedilir. Hatalarda kontrol aralığı artar. CAPTCHA/erişim engeli aşılmaz; böyle bir durumda kontrol başarısız olur.

Bu sürüm yerel bilgisayarda bildirim verir, telefona mesaj göndermez. Bilgisayar kapalıyken çalışmaz. Site değişirse seçicilerin güncellenmesi gerekebilir. Tek örnek çalıştırın.
