// galeria.js — Módulo de Galería de Imágenes (panel admin)

let galeriaItems = [];

async function loadGaleria() {
  try {
    const res = await fetch('../api/galeria.php');
    galeriaItems = await res.json();
    renderGaleriaAdmin();
  } catch (e) {
    toast('Error al cargar la galería.', 'error');
  }
}
window.loadGaleria = loadGaleria;

function renderGaleriaAdmin() {
  const grid = document.getElementById('galeria-admin-grid');
  if (!grid) return;

  if (!galeriaItems.length) {
    grid.innerHTML = '<p class="empty-state">No hay imágenes en la galería. Sube la primera imagen.</p>';
    return;
  }

  grid.innerHTML = galeriaItems.map(item => `
    <div class="galeria-admin-card" id="gcard-${item.id}">
      <div class="galeria-admin-img-wrap">
        <img src="../${item.ruta}" alt="${escapeHtml(item.caption)}" onerror="this.src='../assets/img/logo.png'">
      </div>
      <div class="galeria-admin-info">
        <input
          type="text"
          class="form-control galeria-caption-input"
          placeholder="Descripción de la imagen"
          value="${escapeHtml(item.caption)}"
          onchange="updateCaption('${item.id}', this.value)"
        >
        <button class="btn-delete-img" onclick="deleteGaleriaItem('${item.id}')">🗑️ Eliminar</button>
      </div>
    </div>
  `).join('');
}

async function uploadGaleriaImage() {
  const input = document.getElementById('galeria-file-input');
  const caption = document.getElementById('galeria-caption-new').value.trim();
  const file = input.files[0];

  if (!file) {
    toast('Seleccione una imagen primero.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('imagen', file);
  formData.append('caption', caption);
  formData.append('orden', galeriaItems.length);

  const btn = document.getElementById('btn-upload-img');
  btn.disabled = true;
  btn.textContent = 'Subiendo...';

  try {
    const res = await fetch('../api/galeria.php', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      toast('Imagen subida correctamente.', 'success');
      input.value = '';
      document.getElementById('galeria-caption-new').value = '';
      await loadGaleria();
    } else {
      toast('Error: ' + (data.error || 'No se pudo subir la imagen.'), 'error');
    }
  } catch (e) {
    toast('Error de conexión al subir la imagen.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '⬆️ Subir imagen';
  }
}
window.uploadGaleriaImage = uploadGaleriaImage;

async function updateCaption(id, caption) {
  try {
    const res = await fetch('../api/galeria.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, caption })
    });
    const data = await res.json();
    if (data.success) {
      toast('Descripción actualizada.', 'success');
    }
  } catch (e) {
    toast('Error al actualizar la descripción.', 'error');
  }
}
window.updateCaption = updateCaption;

async function deleteGaleriaItem(id) {
  if (!confirm('¿Eliminar esta imagen de la galería?')) return;
  try {
    const res = await fetch('../api/galeria.php?id=' + encodeURIComponent(id), { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast('Imagen eliminada.', 'success');
      await loadGaleria();
    } else {
      toast('Error: ' + (data.error || 'No se pudo eliminar.'), 'error');
    }
  } catch (e) {
    toast('Error de conexión al eliminar.', 'error');
  }
}
window.deleteGaleriaItem = deleteGaleriaItem;

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
