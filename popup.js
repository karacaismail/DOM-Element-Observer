// DOM elementlerine referanslar
const startButton = document.getElementById('startRecording');
const stopButton = document.getElementById('stopRecording');
const exportButton = document.getElementById('exportData');
const statusMessage = document.getElementById('statusMessage');
const statsContainer = document.getElementById('statsContainer');
const elementCountSpan = document.getElementById('elementCount');

// Kayıt durumu
let isRecording = false;
let recordedElementsCount = 0;

// Sayfa yüklendiğinde durum güncellemesi yap
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Background script'ten kayıt durumunu ve verileri al
    const response = await chrome.runtime.sendMessage({action: "getRecordedData"});

    if (response && response.data && response.data.length > 0) {
      // Daha önce kaydedilmiş veriler varsa göster
      recordedElementsCount = response.data.length;
      updateStatsDisplay();
      showSuccessMessage(`${recordedElementsCount} element kaydedildi. Dışa aktarabilirsiniz.`);
    }
  } catch (error) {
    console.error("Başlangıç durumu alınamadı:", error);
  }
});

// "Kayıt Başlat" düğmesi işleyicisi
startButton.addEventListener('click', async () => {
  try {
    // Kayıt başlatma isteği gönder
    const response = await chrome.runtime.sendMessage({action: "startRecording"});

    // UI güncellemesi
    startButton.disabled = true;
    stopButton.disabled = false;
    isRecording = true;

    showInfoMessage("Kayıt yapılıyor... Sayfada elementlere tıklayın ve dinamik içerikleri açın.");
  } catch (error) {
    console.error("Kayıt başlatılamadı:", error);
    showErrorMessage("Kayıt başlatılamadı. Lütfen sayfayı yenileyin ve tekrar deneyin.");
  }
});

// "Kayıt Durdur" düğmesi işleyicisi
stopButton.addEventListener('click', async () => {
  try {
    // Kayıt durdurma isteği gönder
    const response = await chrome.runtime.sendMessage({action: "stopRecording"});

    // Cevaba göre UI güncellemesi
    if (response && response.status === "Recording stopped") {
      startButton.disabled = false;
      stopButton.disabled = true;
      isRecording = false;

      // Element sayısını güncelle
      recordedElementsCount = response.count || 0;
      updateStatsDisplay();

      // Başarılı mesajı göster
      showSuccessMessage(`Kayıt tamamlandı! ${recordedElementsCount} element kaydedildi.`);
    }
  } catch (error) {
    console.error("Kayıt durdurulamadı:", error);
    showErrorMessage("Kayıt durdurulurken bir hata oluştu.");
  }
});

// "Dışa Aktar" düğmesi işleyicisi
exportButton.addEventListener('click', async () => {
  try {
    // Seçilen format
    const format = document.querySelector('input[name="exportFormat"]:checked').value;

    // Dışa aktarma isteği gönder
    await chrome.runtime.sendMessage({
      action: "exportRecordedData",
      format: format
    });

    showSuccessMessage(`Veriler ${format.toUpperCase()} formatında dışa aktarılıyor...`);
  } catch (error) {
    console.error("Dışa aktarma hatası:", error);
    showErrorMessage("Veriler dışa aktarılamadı.");
  }
});

// İstatistik görüntülemesini güncelle
function updateStatsDisplay() {
  if (recordedElementsCount > 0) {
    statsContainer.style.display = 'block';
    elementCountSpan.textContent = recordedElementsCount;
  } else {
    statsContainer.style.display = 'none';
  }
}

// Bilgi mesajı göster
function showInfoMessage(message) {
  statusMessage.className = 'status info';
  statusMessage.textContent = message;
}

// Başarı mesajı göster
function showSuccessMessage(message) {
  statusMessage.className = 'status success';
  statusMessage.textContent = message;
}

// Hata mesajı göster
function showErrorMessage(message) {
  statusMessage.className = 'status error';
  statusMessage.textContent = message;
}
