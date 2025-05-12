// content.js

let collectedElements = [];
let isRecording = false;
let domMutationObserver = null; // MutationObserver globalde tanımlı
let controlPanel = null;
let recordingIndicator = null;
let clickCounter = 0;
let hoverOverlay = null;

// === HOVER İNCELEME MODU ===
function createHoverOverlay() {
  if (hoverOverlay && document.body.contains(hoverOverlay)) {
    return hoverOverlay;
  }
  hoverOverlay = document.createElement('div');
  hoverOverlay.id = 'dom-inspector-hover-overlay';
  hoverOverlay.className = 'dom-inspector-hover-overlay';
  hoverOverlay.style.position = 'absolute';
  hoverOverlay.style.zIndex = '2147483643';
  hoverOverlay.style.pointerEvents = 'none';
  hoverOverlay.style.display = 'none';
  hoverOverlay.style.border = '2px dashed rgba(59, 130, 246, 0.8)';
  hoverOverlay.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
  hoverOverlay.style.boxSizing = 'border-box';
  document.body.appendChild(hoverOverlay);
  return hoverOverlay;
}

function updateHoverOverlay(targetElement) {
  if (!isRecording || !targetElement || targetElement === document.body || targetElement === document.documentElement) {
    if (hoverOverlay) hoverOverlay.style.display = 'none';
    return;
  }
  if (targetElement.closest('#dom-inspector-panel') ||
      targetElement.closest('#dom-inspector-data-modal') ||
      targetElement.closest('#dom-inspector-recording-indicator') ||
      targetElement.id === 'dom-inspector-hover-overlay') {
    if (hoverOverlay) hoverOverlay.style.display = 'none';
    return;
  }

  const overlay = hoverOverlay || createHoverOverlay(); // hoverOverlay null ise yeniden oluştur
  const rect = targetElement.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  overlay.style.left = `${scrollLeft + rect.left}px`;
  overlay.style.top = `${scrollTop + rect.top}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.display = 'block';
}

function pageMouseOverListener(event) {
  if (isRecording) {
    updateHoverOverlay(event.target);
  }
}

function pageMouseOutListener(event) {
    // Hover overlay'i sadece fare eklentinin kendi UI elemanlarından birine girmediyse gizle
    if (isRecording && hoverOverlay && (!event.relatedTarget ||
        (!event.relatedTarget.closest('#dom-inspector-panel') &&
         !event.relatedTarget.closest('#dom-inspector-data-modal') &&
         !event.relatedTarget.closest('#dom-inspector-recording-indicator') &&
         event.relatedTarget.id !== 'dom-inspector-hover-overlay' &&
         event.relatedTarget !== document.body && // Sayfanın dışına çıkınca da gizle
         event.relatedTarget !== document.documentElement
        ))) {
        // Eğer relatedTarget yoksa (sayfa dışı) veya eklenti elemanı değilse overlay'ı gizle
        // Ancak, eğer fare hala geçerli bir element üzerindeyse updateHoverOverlay onu tekrar gösterecektir.
        // Bu mantık biraz karmaşıklaşabilir, en iyisi updateHoverOverlay'in tek sorumlu olması.
        // Şimdilik, fare başka bir elemente geçtiğinde updateHoverOverlay zaten çalışacak.
        // Sadece sayfa dışına çıkıldığında gizlemek için ek bir kontrol gerekebilir.
        // Ya da basitçe:
        // if (!document.elementFromPoint(event.clientX, event.clientY) || // Fare sayfa dışında mı?
        //     document.elementFromPoint(event.clientX, event.clientY) === document.documentElement) {
        //     hoverOverlay.style.display = 'none';
        // }
    }
     // Basitleştirilmiş: Eğer fare bir elementten çıkıyorsa, yeni element için mouseover tetiklenecek,
     // o da overlay'i güncelleyecek. Eğer sayfa dışına çıkıyorsa, mouseover olmayacak ve overlay kalabilir.
     // Bu yüzden mouseout'ta explicit gizleme (sadece sayfa dışına çıkış için) daha iyi olabilir.
    if (isRecording && hoverOverlay && !event.relatedTarget) { // Fare pencere dışına çıktıysa
        hoverOverlay.style.display = 'none';
    }
}


// === PANEL OLUŞTURMA VE YÖNETİMİ ===
function createControlPanel() {
  if (document.getElementById('dom-inspector-panel')) {
    controlPanel = document.getElementById('dom-inspector-panel'); // Referansı güncelle
    // Eğer zaten varsa ve gizliyse göster, değilse toggle etme (togglePanel yönetecek)
    if (controlPanel.style.display === 'none') {
        controlPanel.style.display = 'block';
    }
    // Panelin ve içeriğin başlangıç durumunu ayarla
    const panelContent = document.getElementById('dom-inspector-panel-content');
    const expandButton = document.getElementById('dom-inspector-expand-button');
    if (panelContent) panelContent.style.display = 'block'; // Başlangıçta içerik açık
    if (expandButton) {
        expandButton.querySelector('.icon-minimize').style.display = 'inline';
        expandButton.querySelector('.icon-expand').style.display = 'none';
        expandButton.title = 'Paneli Daralt';
    }
    return controlPanel;
  }

  controlPanel = document.createElement('div');
  controlPanel.id = 'dom-inspector-panel';
  controlPanel.className = 'dom-inspector-panel';
  // Başlangıçta panel görünür olsun
  controlPanel.style.display = 'block';

  controlPanel.innerHTML = `
    <div class="dom-inspector-header">
      <div class="dom-inspector-window-controls">
        <button id="dom-inspector-close-button" class="dom-inspector-window-button dom-inspector-close-btn" title="Paneli Kapat">
          <svg class="window-icon" viewBox="0 0 12 12"><path d="M11.25,1.82L10.18,0.75L6,4.93L1.82,0.75L0.75,1.82L4.93,6L0.75,10.18L1.82,11.25L6,7.07L10.18,11.25L11.25,10.18L7.07,6L11.25,1.82Z"></path></svg>
        </button>
        <button id="dom-inspector-minimize-main-button" class="dom-inspector-window-button dom-inspector-minimize-btn" title="İçeriği Gizle">
           <svg class="window-icon icon-main-minimize" viewBox="0 0 12 12"><path d="M2,5H10V7H2V5Z"></path></svg> {/* Başlangıçta eksi ikonu */}
        </button>
        <button id="dom-inspector-expand-button" class="dom-inspector-window-button dom-inspector-expand-btn" title="Paneli Daralt"> {/* Bu buton artık minimizeMainButton ile aynı işlevi yapacak */}
          <svg class="window-icon icon-expand-toggle icon-minimize" viewBox="0 0 12 12"><path d="M2,5H10V7H2V5Z"></path></svg>
          <svg class="window-icon icon-expand-toggle icon-expand" viewBox="0 0 12 12" style="display:none;"><path d="M10,5H7V2H5V5H2V7H5V10H7V7H10V5Z"></path></svg>
        </button>
      </div>
      <h3 class="dom-inspector-title">DOM Inspector</h3>
    </div>
    <div class="dom-inspector-content" id="dom-inspector-panel-content" style="display: block;"> {/* Başlangıçta içerik açık */}
      <div class="dom-inspector-status dom-inspector-info" id="dom-inspector-status">
        Elementleri kaydetmek için "Kayıt Başlat"a tıklayın.
      </div>
      <div class="dom-inspector-controls">
        <button id="dom-inspector-start-button" class="dom-inspector-button dom-inspector-start" title="Sayfadaki tıklamaları ve DOM değişikliklerini kaydetmeye başla">Kayıt Başlat</button>
        <button id="dom-inspector-stop-button" class="dom-inspector-button dom-inspector-stop" title="Kaydı durdur ve sonuçları gör" disabled>Kayıt Durdur</button>
      </div>
      <div class="dom-inspector-stats" id="dom-inspector-stats" style="display: none;">
        <p><strong>Toplanan element:</strong> <span id="dom-inspector-count">0</span></p>
        <div class="dom-inspector-export-options">
          <label title="Veriyi JSON formatında dışa aktar">
            <input type="radio" name="dom-inspector-format" value="json" checked> JSON
          </label>
          <label title="Veriyi TXT formatında dışa aktar">
            <input type="radio" name="dom-inspector-format" value="txt"> TXT
          </label>
        </div>
        <button id="dom-inspector-export-button" class="dom-inspector-button dom-inspector-export" title="Toplanan veriyi seçilen formatta indir">Dışa Aktar</button>
      </div>
    </div>
  `;

  document.body.appendChild(controlPanel);
  setupPanelControls();
  makePanelDraggable(controlPanel, controlPanel.querySelector('.dom-inspector-header'));
  if (!hoverOverlay) createHoverOverlay(); // hoverOverlay'i oluştur
  return controlPanel;
}

function setupPanelControls() {
  if (!controlPanel) return;

  const startButton = document.getElementById('dom-inspector-start-button');
  const stopButton = document.getElementById('dom-inspector-stop-button');
  const exportButton = document.getElementById('dom-inspector-export-button');
  const closeButton = document.getElementById('dom-inspector-close-button');
  const minimizeMainButton = document.getElementById('dom-inspector-minimize-main-button');
  const expandButton = document.getElementById('dom-inspector-expand-button'); // Bu butonu da kullanacağız
  const panelContent = document.getElementById('dom-inspector-panel-content');

  closeButton.addEventListener('click', () => {
    if (controlPanel) {
      controlPanel.style.display = 'none';
      if (isRecording) stopRecording();
      updateStatus('Panel kapatıldı. Yeniden açmak için eklenti ikonuna tıklayın.', 'info');
    }
  });

  const toggleContentVisibility = () => {
    if (!panelContent) return;
    const isContentVisible = panelContent.style.display !== 'none';
    panelContent.style.display = isContentVisible ? 'none' : 'block';

    const iconMinimizeSvg = '<path d="M2,5H10V7H2V5Z"></path>'; // Eksi
    const iconExpandSvg = '<path d="M10,5H7V2H5V5H2V7H5V10H7V7H10V5Z"></path>'; // Artı

    if (expandButton) {
        expandButton.querySelector('.icon-minimize').style.display = isContentVisible ? 'none' : 'inline';
        expandButton.querySelector('.icon-expand').style.display = isContentVisible ? 'inline' : 'none';
        expandButton.title = isContentVisible ? 'Paneli Genişlet' : 'Paneli Daralt';
    }
    if (minimizeMainButton && minimizeMainButton.firstElementChild) {
        minimizeMainButton.firstElementChild.innerHTML = isContentVisible ? iconExpandSvg : iconMinimizeSvg;
        minimizeMainButton.title = isContentVisible ? 'İçeriği Göster' : 'İçeriği Gizle';
    }
  };

  minimizeMainButton.addEventListener('click', toggleContentVisibility);
  expandButton.addEventListener('click', toggleContentVisibility);

  // Başlangıç durumunu ayarla (panel ilk oluşturulduğunda içerik açık olsun)
  if (panelContent) panelContent.style.display = 'block';
  if (expandButton) {
      expandButton.querySelector('.icon-minimize').style.display = 'inline';
      expandButton.querySelector('.icon-expand').style.display = 'none';
      expandButton.title = 'Paneli Daralt';
  }
   if (minimizeMainButton && minimizeMainButton.firstElementChild) {
      minimizeMainButton.firstElementChild.innerHTML = '<path d="M2,5H10V7H2V5Z"></path>'; // Eksi ikonu
      minimizeMainButton.title = 'İçeriği Gizle';
  }


  startButton.addEventListener('click', () => {
    startRecording();
    startButton.disabled = true;
    stopButton.disabled = false;
    updateStatus('Kayıt yapılıyor... Elementlere tıklayın veya üzerlerinde gezinin.', 'info');
  });

  stopButton.addEventListener('click', () => {
    stopRecording();
    startButton.disabled = false;
    stopButton.disabled = true;
    updateStatus(`Kayıt tamamlandı! ${collectedElements.length} element toplandı.`, 'success');
    updateStatsDisplay();
  });

  exportButton.addEventListener('click', () => {
    const formatRadio = controlPanel.querySelector('input[name="dom-inspector-format"]:checked');
    if (!formatRadio) {
      updateStatus('Lütfen bir dışa aktarma formatı seçin.', 'error'); return;
    }
    const format = formatRadio.value;
    if (collectedElements.length === 0) {
      updateStatus('Dışa aktarılacak element bulunmuyor.', 'info'); return;
    }
    updateStatus(`Veriler ${format.toUpperCase()} formatında dışa aktarılıyor...`, 'info');
    chrome.runtime.sendMessage({ action: "exportRecordedData", format: format, data: collectedElements }, (response) => {
      if (chrome.runtime.lastError) {
        const reason = `Dosya indirilemedi (Mesaj gönderim hatası: ${chrome.runtime.lastError.message})`;
        updateStatus(reason, 'error'); showDataInModal(collectedElements, format, reason);
      } else if (response) {
        if (response.status === "Export successfully started") {
          updateStatus(`Dosya indirme işlemi başlatıldı (ID: ${response.downloadId}).`, 'success');
        } else if (response.status === "Export failed" || (response.error && response.message)) {
          const reason = `Dosya indirilemedi (Sebep: ${response.message || 'Bilinmeyen bir hata oluştu.'})`;
          updateStatus(reason, 'error'); showDataInModal(collectedElements, format, reason);
        } else if (response.status === "No data to export" || response.status === "No data to export in function") {
          updateStatus('Dışa aktarılacak veri bulunamadı (background yanıtı).', 'info');
        } else {
          updateStatus(`Dışa aktarma durumu: ${response.status || 'Bilinmeyen yanıt'}`, 'info');
        }
      } else {
        const reason = 'Dosya indirilemedi (Background scriptten yanıt alınamadı).';
        updateStatus(reason, 'error'); showDataInModal(collectedElements, format, reason);
      }
    });
  });
}

// ... (updateStatus, updateStatsDisplay, makePanelDraggable aynı) ...
// === VERİ GÖSTERME MODALI, TEXT TEMİZLEME VE SATIR NUMARALARI ===
// ... (formatDataForModalTxt ve formatDataForModalJson aynı) ...

function showDataInModal(data, format, reason = "Veriler aşağıda gösteriliyor.") {
  const existingModal = document.getElementById('dom-inspector-data-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'dom-inspector-data-modal';
  modal.className = 'dom-inspector-modal';
  let textContentIncluded = true;

  modal.innerHTML = `
    <div class="dom-inspector-modal-content">
      <div class="dom-inspector-modal-header">
        <h3>Toplanan Veri (${format.toUpperCase()})</h3>
        <button id="dom-inspector-modal-close-button" class="dom-inspector-modal-close-button" title="Kapat">&times;</button>
      </div>
      <p class="dom-inspector-modal-reason">${reason}</p>
      <div class="dom-inspector-modal-editor-area">
        <div class="dom-inspector-line-numbers" id="dom-inspector-modal-line-numbers"></div>
        <textarea readonly class="dom-inspector-modal-textarea" id="dom-inspector-modal-main-textarea"></textarea>
      </div>
      <div class="dom-inspector-modal-actions">
        <button id="dom-inspector-modal-toggle-text-button" class="dom-inspector-button dom-inspector-toggle-text" title="Metin içeriklerini göster/gizle">Text'i Gizle</button>
        <button id="dom-inspector-modal-copy-button" class="dom-inspector-button dom-inspector-copy" title="Görüntülenen tüm içeriği panoya kopyala">İçeriği Kopyala</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const mainTextarea = document.getElementById('dom-inspector-modal-main-textarea');
  const lineNumbersDiv = document.getElementById('dom-inspector-modal-line-numbers');

  const renderTextareaContent = () => {
    let formattedDataContent;
    if (format === 'json') {
      formattedDataContent = formatDataForModalJson(data, textContentIncluded);
    } else {
      formattedDataContent = formatDataForModalTxt(data, reason, textContentIncluded);
    }
    mainTextarea.value = formattedDataContent;
    updateLineNumbers();
  };

  const updateLineNumbers = () => {
    if (format !== 'json' || !mainTextarea || !lineNumbersDiv) {
        lineNumbersDiv.innerHTML = '';
        lineNumbersDiv.style.display = 'none';
        if(mainTextarea) mainTextarea.style.paddingLeft = '15px';
        return;
    }
    lineNumbersDiv.style.display = 'block';
    if(mainTextarea) mainTextarea.style.paddingLeft = '55px'; // Biraz daha fazla yer satır numaraları için

    const lines = mainTextarea.value.split('\n');
    const lineCount = lines.length;
    let lineNumbersHTML = '';
    // Textarea'nın gerçek satır yüksekliğini hesaplamaya çalışalım
    const computedStyle = window.getComputedStyle(mainTextarea);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);

    for (let i = 1; i <= lineCount; i++) {
      // Her satırın yüksekliğini yaklaşık olarak hesaplayabiliriz
      // Daha doğru bir yöntem, her satırın içeriğini bir span'e koyup yüksekliğini ölçmektir ama bu karmaşık olur.
      // Şimdilik her satır için bir div kullanalım.
      lineNumbersHTML += `<div class="line-number-item">${i}</div>`;
    }
    lineNumbersDiv.innerHTML = lineNumbersHTML;
    // Scroll senkronizasyonu
    lineNumbersDiv.scrollTop = mainTextarea.scrollTop;
  };

  mainTextarea.addEventListener('scroll', () => {
    if (format === 'json' && lineNumbersDiv) {
        lineNumbersDiv.scrollTop = mainTextarea.scrollTop;
    }
  });
  // Textarea içeriği veya boyutu değiştiğinde de satır numaralarını güncelle
  mainTextarea.addEventListener('input', updateLineNumbers);
  const ro = new ResizeObserver(updateLineNumbers); // Textarea boyutu değişirse
  ro.observe(mainTextarea);

  renderTextareaContent();

  document.getElementById('dom-inspector-modal-close-button').addEventListener('click', () => {
    ro.disconnect(); // ResizeObserver'ı temizle
    modal.remove();
  });

  document.getElementById('dom-inspector-modal-toggle-text-button').addEventListener('click', (e) => {
    textContentIncluded = !textContentIncluded;
    e.target.textContent = textContentIncluded ? "Text'i Gizle" : "Text'i Göster";
    e.target.title = textContentIncluded ? "Metin içeriklerini gizle" : "Metin içeriklerini göster";
    renderTextareaContent();
  });
  document.getElementById('dom-inspector-modal-copy-button').addEventListener('click', () => {
    mainTextarea.select(); document.execCommand('copy');
    updateStatus('Veri panoya kopyalandı!', 'success');
    if (window.getSelection) window.getSelection().removeAllRanges();
  });
  makePanelDraggable(modal, modal.querySelector('.dom-inspector-modal-header'));
}

// ... (getElementInfo, getXPath, getCssSelector, globalClickListener, setupMutationObserver, showTooltip, startRecording, stopRecording, showRecordingIndicator aynı) ...
// === BAŞLANGIÇ VE MESAJLAŞMA ===
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script mesaj aldı:", message);
  if (message.action === "togglePanel") {
    if (!controlPanel || !document.body.contains(controlPanel)) {
      controlPanel = createControlPanel(); // Paneli oluştur ve göster
    } else {
      // Panelin mevcut görünürlüğünü toggle et
      const panelWasVisible = controlPanel.style.display !== 'none';
      controlPanel.style.display = panelWasVisible ? 'none' : 'block';
    }

    // Panel durumuna göre butonları senkronize et (createControlPanel zaten başlangıçta doğru ayarlar)
    if (controlPanel && controlPanel.style.display !== 'none') {
        const panelContent = document.getElementById('dom-inspector-panel-content');
        const expandButton = document.getElementById('dom-inspector-expand-button');
        const minimizeMainButton = document.getElementById('dom-inspector-minimize-main-button');
        if (panelContent && expandButton && minimizeMainButton) {
            const isContentVisible = panelContent.style.display !== 'none';
            expandButton.querySelector('.icon-minimize').style.display = isContentVisible ? 'inline' : 'none';
            expandButton.querySelector('.icon-expand').style.display = isContentVisible ? 'none' : 'inline';
            expandButton.title = isContentVisible ? 'Paneli Daralt' : 'Paneli Genişlet';
            if (minimizeMainButton.firstElementChild) {
                minimizeMainButton.firstElementChild.innerHTML = isContentVisible ?
                    '<path d="M2,5H10V7H2V5Z"></path>' : // Eksi
                    '<path d="M10,5H7V2H5V5H2V7H5V10H7V7H10V5Z"></path>'; // Artı
            }
            minimizeMainButton.title = isContentVisible ? 'İçeriği Gizle' : 'İçeriği Göster';
        }
    }
    sendResponse({ status: "Panel durumu değiştirildi", visible: controlPanel ? controlPanel.style.display !== 'none' : false });
  }
  return true;
});

// Sayfa ilk yüklendiğinde content script'in hazır olduğunu bildir.
// Paneli hemen oluşturmuyoruz, eklenti ikonuna ilk tıklandığında oluşturulacak.
// Veya istenirse burada createControlPanel() çağrılıp sonra display:none yapılabilir.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!hoverOverlay) createHoverOverlay(); // Hover için overlay her zaman hazır olsun
        if (!domMutationObserver) setupMutationObserver();
        chrome.runtime.sendMessage({ action: "contentScriptReady", from: "content.js" });
        console.log("Content script DOMContentLoaded sonrası yüklendi ve `contentScriptReady` mesajı gönderildi.");
    });
} else {
    if (!hoverOverlay) createHoverOverlay();
    if (!domMutationObserver) setupMutationObserver();
    chrome.runtime.sendMessage({ action: "contentScriptReady", from: "content.js" });
    console.log("Content script (zaten hazırdı) yüklendi ve `contentScriptReady` mesajı gönderildi.");
}

// ÖNEMLİ NOT: Geri kalan getElementInfo, getXPath, getCssSelector, globalClickListener,
// setupMutationObserver (bu zaten sonda çağrılıyor), showTooltip, startRecording, stopRecording,
// showRecordingIndicator ve diğer yardımcı formatlama fonksiyonları bir önceki tam kodda olduğu gibi kalacak.
// Bu yüzden sadece değişen ve eklenen kısımları yukarıda verdim.
// Lütfen bir önceki mesajdaki TAM content.js kodunu alın ve sadece yukarıdaki
// createControlPanel, setupPanelControls, showDataInModal (özellikle updateLineNumbers kısmı)
// ve hover ile ilgili fonksiyonları/listener eklemelerini/güncellemelerini yapın.
