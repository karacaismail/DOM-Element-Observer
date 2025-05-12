// Panel'i sürüklenebilir yapmak için content.js'e eklenmesi gereken kod

// Paneli sürüklenebilir yap
function makePanelDraggable() {
  const panel = document.getElementById('dom-inspector-panel');
  const header = panel.querySelector('.dom-inspector-header');

  let isDragging = false;
  let offsetX, offsetY;

  header.addEventListener('mousedown', function
