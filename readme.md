```markdown
# DOM Element Observer

*DOM Element Observer*, web sayfalarındaki DOM (Document Object Model) elementlerini incelemenize, tıklanan elementleri, fareyle üzerine gelinenleri ve dinamik içerikleri kaydetmenize olanak tanıyan, geliştiricilere yönelik, sayfa içi bir panel ile çalışan bir Chrome eklentisidir.

Bu eklenti, özellikle web otomasyonu, test senaryoları oluşturma veya DOM yapısını derinlemesine analiz etme ihtiyacı duyan geliştiriciler için tasarlanmıştır.

![Eklenti Arayüzü (Örnek Görsel Ekleyebilirsiniz)](./images/screenshot.png)
*(Not: Yukarıdaki satıra projenize bir ekran görüntüsü ekleyip yolunu belirtmeniz önerilir)*

##  Temel Özellikler
* Etkileşim Kaydı:* Tıklanan elementlerin ID, class, XPath, CSS seçicisi, text içeriği ve diğer özniteliklerini detaylı olarak kaydeder.*
* Hover ile İnceleme:* Kayıt modundayken fare ile üzerine gelinen elementi anlık olarak vurgular ve bilgilerini gösterir (kaydetmek için tıklamanız gerekir).*
* Dinamik İçerik Takibi:* Sayfada dinamik olarak yüklenen veya değişen elementleri (modallar, pop-up'lar, AJAX ile yüklenen içerikler vb.) yakalar.*
* Kayıt Kontrolü:* Kullanıcı dostu sayfa içi panel üzerinden kaydı kolayca başlatın, durdurun ve yönetin.*
* Sayfa İçi Kontrol Paneli:*
    * Web sayfasının üzerinde konumlanan, sürüklenip bırakılabilen arayüz.
    * Paneli daraltma, genişletme ve kapatma seçenekleri.
    * Anlık durum bilgisi ve toplanan element sayısı gösterimi.*
* Veri Dışa Aktarma:* Toplanan element verilerini *JSON* veya *TXT* formatlarında dışa aktarın.*
* Veri Önizleme ve Kopyalama:* Dışa aktarma öncesinde toplanan verileri formatlı bir şekilde modal pencerede görüntüleyin, text içeriğini gösterip/gizleyin ve kolayca panoya kopyalayın.

##  Hedef Kitle
*
* Web Geliştiricileri:* DOM yapısını analiz etmek, hızlıca seçiciler (selector) bulmak, dinamik değişiklikleri izlemek ve otomasyon scriptleri için veri toplamak isteyenler.
* *🧪 Kalite Güvence (QA) Uzmanları / Test Mühendisleri:* Otomasyon testleri (Selenium, Puppeteer, Playwright vb.) için güvenilir element tanımlayıcıları (XPath, CSS) elde etmek ve test senaryolarını oluşturmak isteyenler.*
* UI/UX Analistleri ve Tasarımcılar:* Sayfa yapısını ve elementlerin özelliklerini detaylıca incelemek isteyenler.

## 🚀 Nasıl Kullanılır?

1.  *Paneli Aç/Kapat:* Chrome araç çubuğundaki eklenti ikonuna (`🧩`) tıklayarak sayfa içi kontrol panelini açın veya kapatın.
2.  *Kaydı Başlat:* Paneldeki `Kayıt Başlat` düğmesine tıklayın.
3.  *Elementlerle Etkileşim Kurun:*
    * İncelemek istediğiniz elementlere *tıklayın*. Tıklanan her elementin bilgileri kaydedilecektir.
    * Fareyi elementlerin *üzerine getirerek* anlık bilgi alın (kayıt için tıklama gereklidir).
    * Dinamik içeriklerin (modal, açılır menü vb.) yüklenmesini tetikleyin ve içlerindeki elementlere tıklayın.
4.  *Kaydı Durdur:* Paneldeki `Kayıt Durdur` düğmesine tıklayın.
5.  *Veriyi İncele ve Dışa Aktar:*
    * Toplanan toplam element sayısını panelde görün.
    * İstediğiniz formatı (`JSON` veya `TXT`) seçin.
    * `Dışa Aktar` düğmesine tıklayın. Veriler seçtiğiniz formatta indirilecektir.
    * (Eğer indirme başarısız olursa veya veriyi indirmeden görmek isterseniz) Toplanan veriler, biçimlendirilmiş olarak bir modal pencerede gösterilir. Buradan içeriği kopyalayabilirsiniz.

## Örnek Veri Çıktıları

Eklenti ile topladığınız veriler aşağıdaki formatlarda dışa aktarılır:

### JSON Formatı Örneği

```json
[
  {
    "uniqueId": "click-1715506714123", // Benzersiz olay kimliği
    "type": "click", // Olay tipi
    "timestamp": "2025-05-12T09:38:34.123Z", // Zaman damgası
    "url": "[https://ornek-website.com/sayfa](https://ornek-website.com/sayfa)", // Olayın gerçekleştiği URL
    "elementInfo": {
      "tagName": "BUTTON",
      "id": "submit-button",
      "classes": ["btn", "btn-primary", "large"],
      "textContent": "Gönder",
      "xpath": "/html/body/div[1]/main/form/button[1]",
      "cssSelector": "div#app > main > form > button.btn.btn-primary",
      "attributes": {
        "type": "submit",
        "data-testid": "submit-form"
      }
    },
    "originalType": "BUTTON" // Elementin asıl tag adı
  },
  {
    "uniqueId": "dom-mutation-1715506718456",
    "type": "dom-mutation", // DOM değişikliği olayı
    "timestamp": "2025-05-12T09:38:38.456Z",
    "url": "[https://ornek-website.com/sayfa](https://ornek-website.com/sayfa)",
    "elementInfo": {
      "tagName": "DIV",
      "id": "success-modal",
      "classes": ["modal", "fade", "show"],
      "textContent": "İşlem Başarılı!",
      "xpath": "/html/body/div[3]/div/div/div[2]",
      "cssSelector": "div#success-modal > div > div > div.modal-body",
      "attributes": {
        "role": "alert"
      }
    },
    "originalType": "DIV"
  }
  // ... diğer elementler
]
```

### TXT Formatı Örneği

```text
DOM ELEMENTS OBSERVER EXPORT
Export Date: 12.05.2025 12:38:40
Total Elements: 2

--- ELEMENT (ID: click-1715506714123) ---
Gerçek Tip: BUTTON
Timestamp: 2025-05-12T09:38:34.123Z
URL: [https://ornek-website.com/sayfa](https://ornek-website.com/sayfa)
Tag: BUTTON
ID: submit-button
Classes: btn btn-primary large
Text: Gönder
XPath: /html/body/div[1]/main/form/button[1]
CSS Selector: div#app > main > form > button.btn.btn-primary
Attributes:
  type: submit
  data-testid: submit-form

--- ELEMENT (ID: dom-mutation-1715506718456) ---
Gerçek Tip: DIV
Timestamp: 2025-05-12T09:38:38.456Z
URL: [https://ornek-website.com/sayfa](https://ornek-website.com/sayfa)
Tag: DIV
ID: success-modal
Classes: modal fade show
Text: İşlem Başarılı!
XPath: /html/body/div[3]/div/div/div[2]
CSS Selector: div#success-modal > div > div > div.modal-body
Attributes:
  role: alert

```

##  Örnek Kullanım Senaryosu (JavaScript ile)

Dışa aktarılan JSON verisini bir otomasyon script'inde (örneğin Puppeteer kullanarak) nasıl kullanabileceğinize dair basit bir örnek:

```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');

// Kaydedilen JSON verisini oku
const recordedData = JSON.parse(fs.readFileSync('dom-elements-export.json', 'utf-8'));

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('[https://ornek-website.com/sayfa](https://ornek-website.com/sayfa)'); // İlgili sayfaya git

  // Kaydedilen ilk tıklama elementini bul ve tıkla
  const firstClickElement = recordedData.find(item => item.type === 'click');
  if (firstClickElement && firstClickElement.elementInfo.cssSelector) {
    try {
      const selector = firstClickElement.elementInfo.cssSelector;
      console.log(`Tıklanacak Element (CSS Selector): ${selector}`);
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.click(selector);
      console.log('Element başarıyla tıklandı.');
    } catch (error) {
      console.error(`Element bulunamadı veya tıklanamadı: ${firstClickElement.elementInfo.cssSelector}`, error);
      // Alternatif olarak XPath kullanılabilir:
      // const xpath = firstClickElement.elementInfo.xpath;
      // const elements = await page.$x(xpath);
      // if (elements.length > 0) await elements[0].click();
    }
  }

  // ... diğer adımlar eklenebilir ...

  await browser.close();
})();
```

## � Kurulum (Yerel Geliştirme Ortamı)

Bu eklenti bir geliştirici aracı olduğu için Chrome Web Mağazası'nda yayınlanması planlanmamaktadır. Yerel olarak kurmak için:

1.  Bu repoyu bilgisayarınıza klonlayın veya ZIP olarak indirin ve dosyaları bir klasöre çıkarın.
2.  Google Chrome'u açın ve adres çubuğuna `chrome://extensions` yazıp Enter'a basın.
3.  Sağ üst köşedeki *"Geliştirici modu"* anahtarını etkinleştirin.
4.  Sol üstteki *"Paketlenmemiş öğe yükle"* düğmesine tıklayın.
5.  Eklenti dosyalarının bulunduğu klasörü (bu `README.md` dosyasının olduğu ana klasörü) seçin.
6.  Eklenti yüklenecek ve Chrome araç çubuğunda `🧩` ikonu görünecektir. Artık kullanmaya başlayabilirsiniz!

## � Gelecek Geliştirme Planları (Yol Haritası)

Eklentiyi daha da geliştirmek için planlanan bazı özellikler şunlardır:

*[ ] Gelişmiş Filtreleme/Arama:* Toplanan elementler listesinde tag adı, class, ID veya text içeriğine göre filtreleme ve arama yapabilme.
*[ ] Otomatik Kod Üretimi:* Seçilen element(ler) için popüler otomasyon kütüphanelerine (Selenium, Puppeteer, Playwright) uygun seçici kod parçacıklarını (örn. `findElement(By.xpath('...'))`) otomatik oluşturma.
*[ ] Görsel Alan Seçimi:* Sayfada bir alanı fare ile seçerek o bölgedeki tüm elementleri veya belirli tipteki elementleri toplu olarak kaydetme.
*[ ] Kullanıcı Eylemi Kaydı (Step Recorder):* Sadece tıklamaları değil, aynı zamanda input alanlarına yazı yazma gibi temel kullanıcı eylemlerini de bir senaryo olarak kaydetme ve dışa aktarma.
*[ ] DOM Karşılaştırma:* Farklı zamanlarda yapılan kayıtlar arasında DOM yapısındaki değişiklikleri vurgulayan bir karşılaştırma aracı.
*[ ] Özelleştirme Seçenekleri:* Kaydedilecek öznitelikleri (ID, class, XPath vb.) seçme veya panel görünümünü özelleştirme imkanı.
*[ ] Klavye Kısayolları:* Paneli açma/kapama, kaydı başlatma/durdurma gibi sık kullanılan işlevler için klavye kısayolları tanımlama.

## 🤝 Katkıda Bulunma

Bu proje açık kaynaklıdır ve katkılarınız değerlidir! 💖

* Hata bildirimi veya özellik önerisi için lütfen bir *Issue* açın.
* Koda doğrudan katkıda bulunmak isterseniz, lütfen projeyi *Fork*'layın, değişikliklerinizi yapın ve bir *Pull Request* gönderin.

1.  Projeyi Fork'layın.
2.  Yeni bir özellik dalı oluşturun (`git checkout -b feature/yeni-ozellik`).
3.  Değişikliklerinizi commit'leyin (`git commit -m 'feat: Yeni özellik eklendi'`). *Conventional Commits standardına uymanız önerilir.*
4.  Dalınızı push'layın (`git push origin feature/yeni-ozellik`).
5.  Bir Pull Request oluşturun ve değişikliklerinizi açıklayın.

##  Lisans

Bu proje [MIT Lisansı](LICENSE.md) altında lisanslanmıştır.
```
