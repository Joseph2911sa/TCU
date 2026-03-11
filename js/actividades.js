/* ═══════════════════════════════════════════════════════════════
   ADECO · Sistema de Gestión Comunitaria
   Archivo: js/actividades.js
   Nuevo: ahora usa backend en lugar de localStorage
════════════════════════════════════════════════════════════════ */

// devolver lista desde el servidor
async function getActividades() {
  try {
    const list = await window.api.getActividades();
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('fetch actividades', e);
    return [];
  }
}

function openActividadModal(id) {
  const editId = String(id || '').trim();
  document.getElementById('a-edit-id').value = editId;

  // Limpiar campos primero
  document.getElementById('a-titulo').value = '';
  document.getElementById('a-fecha').value  = '';
  document.getElementById('a-hora').value   = '';
  document.getElementById('a-lugar').value  = '';
  document.getElementById('a-descripcion').value = '';

  if (editId) {
    // Modo edición: cargar datos existentes
    getActividades().then(actividades => {
      const act = actividades.find(a => a.id === editId);
      if (act) {
        document.getElementById('a-titulo').value = act.titulo || '';
        document.getElementById('a-fecha').value  = act.fecha || '';
        document.getElementById('a-hora').value   = act.hora || '';
        document.getElementById('a-lugar').value  = act.lugar || '';
        document.getElementById('a-descripcion').value = act.descripcion || '';
        document.querySelector('#modal-actividad h3').textContent = 'Editar Actividad';
      }
    });
  } else {
    document.querySelector('#modal-actividad h3').textContent = 'Nueva Actividad';
  }

  document.getElementById('modal-actividad').classList.add('open');
}

async function saveActividad() {
  const titulo = document.getElementById('a-titulo').value.trim();
  const fecha  = document.getElementById('a-fecha').value;
  const hora   = document.getElementById('a-hora').value;
  const lugar  = document.getElementById('a-lugar').value.trim();
  const descripcion = document.getElementById('a-descripcion').value.trim();
  const editId = document.getElementById('a-edit-id').value;

  if (!titulo || !fecha || !hora || !lugar) {
    alert('Por favor complete los campos obligatorios.');
    return;
  }

  try {
    const payload = {
      id: editId || window.uid(),
      titulo,
      fecha,
      hora,
      lugar,
      descripcion
    };
    const resp = await window.api.saveActividad(payload);
    if (resp.success) {
      await window.loadData();
      await renderActividadesAdmin();
      closeModal('modal-actividad');
    } else {
      throw new Error(resp.error || 'respuesta inesperada');
    }
  } catch (e) {
    console.error('Error guardando actividad', e);
    alert('No se pudo guardar la actividad.');
  }
}

async function renderActividadesAdmin() {
  const tbody = document.getElementById('actividades-tbody');
  if (!tbody) return;

  const list = await getActividades();
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No hay actividades registradas</td></tr>';
    return;
  }

  tbody.innerHTML = list.map((a) => {
    const actId = a.id || 'act_unknown';
    return `
    <tr>
      <td>${fmtDate(a.fecha)}</td>
      <td>${a.titulo}</td>
      <td>${a.lugar}</td>
      <td>
        <div class="action-btns">
          <button class="btn-sm edit"
            onclick="openActividadModal('${actId}')">
            ✏️ Editar
          </button>
          <button class="btn-sm delete"
            onclick="deleteActividad('${actId}')">
            🗑️ Borrar
          </button>
        </div>
      </td>
    </tr>
  `;
  }).join('');
}

window.deleteActividad = async function(id) {
  if (!confirm('¿Está seguro de que desea eliminar esta actividad?')) {
    return;
  }
  try {
    const resp = await window.api.deleteActividad(id);
    if (resp.success) {
      await renderActividadesAdmin();
    } else {
      throw new Error(resp.error || 'falló eliminación');
    }
  } catch (e) {
    console.error('Error borrando actividad', e);
    alert('No se pudo eliminar la actividad.');
  }
};