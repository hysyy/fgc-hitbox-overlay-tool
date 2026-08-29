const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvasContainer');

let zoom = 1, panX = 0, panY = 0;
let dragMode = null;
let dragStartX = 0, dragStartY = 0;
let initialObjX = 0, initialObjY = 0;

function createLayer() {
  return { images: [], frameIndex: 0, x: 0, y: 0, scale: 1.0, opacity: 1, visible: true, flipped: false };
}

const p1 = createLayer();
const p2 = createLayer();
p2.opacity = 0.6;

function resizeCanvas() {
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  draw();
}
window.addEventListener('resize', resizeCanvas);

function resetAll() {
  zoom = 1;
  panX = canvas.width / 2 - 200;
  panY = canvas.height / 2 - 200;

  p1.x = 0; p1.y = 0; p1.scale = 1.0;
  document.getElementById('p1ScaleSlider').value = 100;
  document.getElementById('p1ScaleInput').value = 100;

  p2.x = 0; p2.y = 0; p2.scale = 1.0;
  document.getElementById('p2ScaleSlider').value = 100;
  document.getElementById('p2ScaleInput').value = 100;

  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  renderLayer(p1);
  renderLayer(p2);

  ctx.restore();
}

function renderLayer(layer) {
  if (!layer.visible || layer.images.length === 0) return;
  const img = layer.images[layer.frameIndex];
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const renderWidth = img.width * layer.scale;
  const renderHeight = img.height * layer.scale;

  ctx.save();
  ctx.globalAlpha = layer.opacity;
  ctx.translate(layer.x, layer.y);

  if (layer.flipped) {
    ctx.scale(-1, 1);
    ctx.drawImage(img, -renderWidth, 0, renderWidth, renderHeight);
  } else {
    ctx.drawImage(img, 0, 0, renderWidth, renderHeight);
  }
  ctx.restore();
}

function getBoundingBox(layer) {
  if (!layer.visible || layer.images.length === 0) return null;
  const img = layer.images[layer.frameIndex];
  if (!img || !img.complete) return null;

  const width = img.width * layer.scale;
  const height = img.height * layer.scale;

  return { x: layer.x, y: layer.y, width: width, height: height };
}

function isPointInLayer(worldX, worldY, layer) {
  const box = getBoundingBox(layer);
  if (!box) return false;
  return worldX >= box.x && worldX <= box.x + box.width &&
         worldY >= box.y && worldY <= box.y + box.height;
}

function loadLocalFiles(files, layerObj, labelEl) {
  layerObj.images = [];
  layerObj.frameIndex = 0;
  let loaded = 0;

  const fileArray = Array.from(files);
  if (fileArray.length === 0) return;

  fileArray.forEach((file, i) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      loaded++;
      if (loaded === fileArray.length) {
        updateFrameLabel(layerObj, labelEl);
        draw();
      }
    };

    img.src = url;
    layerObj.images[i] = img;
  });
}

function updateFrameLabel(layer, labelEl) {
  const total = layer.images.length;
  const current = total > 0 ? layer.frameIndex + 1 : 0;
  labelEl.textContent = `Image: ${current} / ${total}`;
}

function bindScaleEvents(layer, sliderId, inputId, resetBtnId) {
  const slider = document.getElementById(sliderId);
  const input = document.getElementById(inputId);
  const resetBtn = document.getElementById(resetBtnId);

  function updateScale(val) {
    val = Math.max(10, Math.min(300, val));
    layer.scale = val / 100;
    slider.value = val;
    input.value = val;
    draw();
  }

  slider.addEventListener('input', e => updateScale(parseFloat(e.target.value)));
  input.addEventListener('change', e => updateScale(parseFloat(e.target.value)));
  
  resetBtn.addEventListener('click', () => {
    layer.x = 0;
    layer.y = 0;
    updateScale(100);
  });
}

bindScaleEvents(p1, 'p1ScaleSlider', 'p1ScaleInput', 'p1ResetScale');
bindScaleEvents(p2, 'p2ScaleSlider', 'p2ScaleInput', 'p2ResetScale');

document.getElementById('matchP1WidthBtn').addEventListener('click', () => {
  const img1 = p1.images[p1.frameIndex];
  const img2 = p2.images[p2.frameIndex];
  if (img1 && img2) {
    const targetWidth = img1.width * p1.scale;
    const newScaleRatio = targetWidth / img2.width;
    p2.scale = newScaleRatio;
    const percent = Math.round(newScaleRatio * 100);
    document.getElementById('p2ScaleSlider').value = percent;
    document.getElementById('p2ScaleInput').value = percent;
    draw();
  }
});

document.getElementById('p1Files').addEventListener('change', (e) => {
  loadLocalFiles(e.target.files, p1, document.getElementById('p1FrameLabel'));
});

document.getElementById('p2Files').addEventListener('change', (e) => {
  loadLocalFiles(e.target.files, p2, document.getElementById('p2FrameLabel'));
});

document.getElementById('p1PrevFrame').addEventListener('click', () => {
  if (p1.images.length) { p1.frameIndex = (p1.frameIndex - 1 + p1.images.length) % p1.images.length; updateFrameLabel(p1, document.getElementById('p1FrameLabel')); draw(); }
});
document.getElementById('p1NextFrame').addEventListener('click', () => {
  if (p1.images.length) { p1.frameIndex = (p1.frameIndex + 1) % p1.images.length; updateFrameLabel(p1, document.getElementById('p1FrameLabel')); draw(); }
});

document.getElementById('p2PrevFrame').addEventListener('click', () => {
  if (p2.images.length) { p2.frameIndex = (p2.frameIndex - 1 + p2.images.length) % p2.images.length; updateFrameLabel(p2, document.getElementById('p2FrameLabel')); draw(); }
});
document.getElementById('p2NextFrame').addEventListener('click', () => {
  if (p2.images.length) { p2.frameIndex = (p2.frameIndex + 1) % p2.images.length; updateFrameLabel(p2, document.getElementById('p2FrameLabel')); draw(); }
});

document.getElementById('p1Opacity').addEventListener('input', e => { p1.opacity = parseFloat(e.target.value); draw(); });
document.getElementById('p2Opacity').addEventListener('input', e => { p2.opacity = parseFloat(e.target.value); draw(); });

document.getElementById('p1ToggleVis').addEventListener('click', e => { p1.visible = !p1.visible; e.target.textContent = p1.visible ? "Hide" : "Show"; draw(); });
document.getElementById('p2ToggleVis').addEventListener('click', e => { p2.visible = !p2.visible; e.target.textContent = p2.visible ? "Hide" : "Show"; draw(); });

document.getElementById('p1Flip').addEventListener('click', () => { p1.flipped = !p1.flipped; draw(); });
document.getElementById('p2Flip').addEventListener('click', () => { p2.flipped = !p2.flipped; draw(); });

document.getElementById('nudgeLeft').addEventListener('click', () => { p2.x -= 1; draw(); });
document.getElementById('nudgeRight').addEventListener('click', () => { p2.x += 1; draw(); });
document.getElementById('nudgeUp').addEventListener('click', () => { p2.y -= 1; draw(); });
document.getElementById('nudgeDown').addEventListener('click', () => { p2.y += 1; draw(); });

container.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const worldX = (mouseX - panX) / zoom;
  const worldY = (mouseY - panY) / zoom;

  if (isPointInLayer(worldX, worldY, p2)) {
    dragMode = 'p2';
    dragStartX = mouseX;
    dragStartY = mouseY;
    initialObjX = p2.x;
    initialObjY = p2.y;
    canvas.style.cursor = 'grabbing';
  } else if (isPointInLayer(worldX, worldY, p1)) {
    dragMode = 'p1';
    dragStartX = mouseX;
    dragStartY = mouseY;
    initialObjX = p1.x;
    initialObjY = p1.y;
    canvas.style.cursor = 'grabbing';
  } else {
    dragMode = 'pan';
    dragStartX = e.clientX - panX;
    dragStartY = e.clientY - panY;
    canvas.style.cursor = 'grabbing';
  }
});

window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (!dragMode) {
    const worldX = (mouseX - panX) / zoom;
    const worldY = (mouseY - panY) / zoom;

    if (isPointInLayer(worldX, worldY, p2) || isPointInLayer(worldX, worldY, p1)) {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
    return;
  }

  if (dragMode === 'pan') {
    panX = e.clientX - dragStartX;
    panY = e.clientY - dragStartY;
  } else if (dragMode === 'p1') {
    const dx = (mouseX - dragStartX) / zoom;
    const dy = (mouseY - dragStartY) / zoom;
    p1.x = initialObjX + dx;
    p1.y = initialObjY + dy;
  } else if (dragMode === 'p2') {
    const dx = (mouseX - dragStartX) / zoom;
    const dy = (mouseY - dragStartY) / zoom;
    p2.x = initialObjX + dx;
    p2.y = initialObjY + dy;
  }

  draw();
});

window.addEventListener('mouseup', () => {
  dragMode = null;
  canvas.style.cursor = 'default';
});

container.addEventListener('wheel', e => {
  e.preventDefault();
  zoom *= (e.deltaY < 0 ? 1.1 : 0.9);
  draw();
});

document.getElementById('resetViewBtn').addEventListener('click', resetAll);

// Export Canvas as PNG
document.getElementById('savePngBtn').addEventListener('click', () => {
  // Create a temporary link element
  const link = document.createElement('a');
  link.download = 'aligned-overlay.png';
  
  // Convert canvas content to Data URL and trigger download
  link.href = canvas.toDataURL('image/png');
  link.click();
});

resizeCanvas();
resetAll();