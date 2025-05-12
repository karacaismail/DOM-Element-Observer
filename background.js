// background.js (Service Worker)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(
    "Background: Mesaj alındı. Eylem:", message.action,
    "Gönderen Sekme ID:", sender.tab ? sender.tab.id : "Yok (Eklenti içi)",
    "Gönderen URL:", sender.tab ? sender.tab.url : (sender.url || "Bilinmeyen")
  );

  if (message.action === "contentScriptReady") {
    console.log(
      `Background: Content script ID ${sender.tab?.id} (${sender.tab?.url || "Bilinmeyen URL"}) olan sekmede hazır.`
    );
    // sendResponse({ status: "Background script acknowledged content script." }); // Yanıt gerekmiyorsa kaldırılabilir
  } else if (message.action === "exportRecordedData") {
    console.log("Background: 'exportRecordedData' eylemi işleniyor.");
    console.log("Background: Alınan format:", message.format);
    console.log("Background: Alınan veri adedi:", message.data ? message.data.length : "Veri yok/null");

    if (message.data && message.data.length > 0) {
      exportData(message.format || "json", message.data, sendResponse);
    } else {
      console.warn("Background: Dışa aktarılacak veri bulunamadı (onMessage içinde).");
      sendResponse({
        status: "No data to export",
        error: true,
        message: "Dışa aktarılacak kayıtlı element bulunamadı.",
      });
    }
    return true; // Asenkron yanıt için (exportData sendResponse'u çağıracak)
  }
  // Diğer mesajlar için return true; sadece sendResponse asenkron çağrılacaksa gereklidir.
  // Eğer senkron bir işlemse veya yanıt gönderilmiyorsa false dönebilir veya hiçbir şey dönmeyebilir.
  // Şimdilik genel bir return true bırakmak, gelecekteki asenkron işlemler için sorun yaratmaz.
  return true;
});

chrome.action.onClicked.addListener((tab) => {
  console.log(`Background: Eklenti ikonuna tıklandı. Hedef sekme ID: ${tab.id}, URL: ${tab.url}`);
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "togglePanel" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn(
          `Background: Panel toggle mesajı sekme ${tab.id}'ye gönderilemedi:`,
          chrome.runtime.lastError.message
        );
      } else {
        console.log(`Background: Panel toggle mesajına yanıt alındı (sekme ${tab.id}):`, response);
      }
    });
  } else {
    console.error("Background: Eklenti ikonuna tıklandı ancak aktif sekme ID'si alınamadı.");
  }
});

function exportData(format, dataToExport, sendResponse) {
  console.log(`Background: exportData fonksiyonu çağrıldı. Format: ${format}`);
  if (!dataToExport || dataToExport.length === 0) {
    console.warn("Background: Dışa aktarılacak veri yok (exportData fonksiyonu içinde).");
    if (sendResponse) {
      sendResponse({
        status: "No data to export in function",
        error: true,
        message: "Dışa aktarılacak veri bulunamadı (fonksiyon içi kontrol).",
      });
    }
    return;
  }

  let fileContent, filename, mimeType;
  if (format === "json") {
    fileContent = JSON.stringify(dataToExport, null, 2);
    filename = `dom-elements-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    mimeType = "application/json;charset=utf-8";
  } else {
    fileContent = formatDataAsTxt(dataToExport);
    filename = `dom-elements-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    mimeType = "text/plain;charset=utf-8";
  }

  console.log(`Background: İndirilecek dosya adı: ${filename}, MIME türü: ${mimeType}`);
  const blob = new Blob([fileContent], { type: mimeType });
  // Service Worker içinde `self.URL` kullanmak daha güvenlidir
  const url = self.URL.createObjectURL(blob);
  console.log("Background: Blob URL oluşturuldu:", url);

  console.log("Background: chrome.downloads.download API'si çağrılıyor...");
  chrome.downloads.download(
    {
      url: url,
      filename: filename,
      saveAs: false, // Otomatik indirme için false
    },
    (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Background: İndirme API hatası:", chrome.runtime.lastError.message);
        if (sendResponse) {
          sendResponse({
            status: "Export failed",
            error: true,
            message: `Dosya indirilemedi: ${chrome.runtime.lastError.message}`,
          });
        }
      } else if (downloadId === undefined) {
        console.warn("Background: İndirme başlatılamadı, downloadId tanımsız.");
        if (sendResponse) {
          sendResponse({
            status: "Export failed",
            error: true,
            message: "Dosya indirme işlemi başlatılamadı (ID alınamadı).",
          });
        }
      } else {
        console.log("Background: Dosya indirme başarıyla başlatıldı. Download ID:", downloadId);
        if (sendResponse) {
          sendResponse({
            status: "Export successfully started",
            downloadId: downloadId,
          });
        }
      }
      self.URL.revokeObjectURL(url); // `self` ile kullan
      console.log("Background: Blob URL serbest bırakıldı:", url);
    }
  );
}

function formatDataAsTxt(data) {
  let result = "DOM ELEMENTS INSPECTOR EXPORT\n";
  result += `Export Date: ${new Date().toLocaleString()}\n`;
  result += `Total Elements: ${data.length}\n\n`;
  data.forEach((item) => { // index kaldırıldı, uniqueId kullanılacak
    result += `--- ELEMENT (ID: ${item.uniqueId || 'N/A'}) ---\n`; // Benzersiz ID eklendi
    result += `Gerçek Tip: ${item.originalType || item.type || "N/A"}\n`;
    if (item.timestamp) result += `Timestamp: ${item.timestamp}\n`;
    if (item.url) result += `URL: ${item.url}\n`;
    const info = item.elementInfo;
    if (info) {
      result += `Tag: ${info.tagName || "N/A"}\n`;
      if (info.id) result += `ID: ${info.id}\n`;
      if (info.classes && info.classes.length > 0) result += `Classes: ${info.classes.join(" ")}\n`;
      if (info.textContent) result += `Text: ${info.textContent}\n`;
      if (info.xpath) result += `XPath: ${info.xpath}\n`;
      if (info.cssSelector) result += `CSS Selector: ${info.cssSelector}\n`;
      if (info.attributes && Object.keys(info.attributes).length > 0) {
        result += "Attributes:\n";
        for (const [key, value] of Object.entries(info.attributes)) {
          result += `  ${key}: ${value}\n`;
        }
      }
    } else {
      result += "Element Info: N/A\n";
    }
    result += "\n";
  });
  return result;
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log("Background: Eklenti yüklendi/güncellendi. Detaylar:", details);
  if (details.reason === "install") {
    console.log("Background: Bu eklentinin ilk kurulumu.");
  } else if (details.reason === "update") {
    const thisVersion = chrome.runtime.getManifest().version;
    console.log(`Background: Eklenti ${details.previousVersion} versiyonundan ${thisVersion} versiyonuna güncellendi.`);
  }
});

console.log("Background: Service worker (background.js) başlatıldı.");
