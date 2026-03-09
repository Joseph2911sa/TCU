function getActividades() {
  let actividades = JSON.parse(localStorage.getItem("actividades")) || [];
  
  // Migrar actividades antiguas que no tienen ID
  actividades = actividades.map((act, idx) => {
    if (!act.id) {
      act.id = 'act_' + Date.now() + '_' + idx;
    }
    return act;
  });
  
  // Guardar la versión migrada
  if (actividades.some(a => !a.id)) {
    localStorage.setItem("actividades", JSON.stringify(actividades));
  }
  
  return actividades;
}

/**
 * Muestra el modal de creación/edición de actividad.
 * Si se pasa un ID, carga los datos existentes para edición.
 * Si no, muestra el formulario vacío para crear.
 * @param {string} [id] - ID de la actividad a editar (opcional)
 */
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
    const actividades = getActividades();
    const act = actividades.find(a => a.id === editId);
    
    if (act) {
      // Cargar cada campo con los datos existentes
      document.getElementById('a-titulo').value = act.titulo || '';
      document.getElementById('a-fecha').value  = act.fecha || '';
      document.getElementById('a-hora').value   = act.hora || '';
      document.getElementById('a-lugar').value  = act.lugar || '';
      document.getElementById('a-descripcion').value = act.descripcion || '';
      document.querySelector('#modal-actividad h3').textContent = 'Editar Actividad';
    }
  } else {
    // Modo creación: formulario vacío
    document.querySelector('#modal-actividad h3').textContent = 'Nueva Actividad';
  }

  document.getElementById('modal-actividad').classList.add('open');
}


function saveActividad() {
  const titulo = document.getElementById("a-titulo").value.trim();
  const fecha  = document.getElementById("a-fecha").value;
  const hora   = document.getElementById("a-hora").value;
  const lugar  = document.getElementById("a-lugar").value.trim();
  const descripcion = document.getElementById("a-descripcion").value.trim();
  const editId = document.getElementById("a-edit-id").value;

  // Validación básica
  if (!titulo || !fecha || !hora || !lugar) {
    alert('Por favor complete los campos obligatorios.');
    return;
  }

  const actividades = getActividades();

  if (editId) {
    // Modo edición: actualizar actividad existente
    const idx = actividades.findIndex(a => a.id === editId);
    if (idx !== -1) {
      actividades[idx] = {
        id: editId,
        titulo,
        fecha,
        hora,
        lugar,
        descripcion
      };
    }
  } else {
    // Modo creación: agregar nueva actividad con ID único
    const newId = 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    const newActividad = {
      id: newId,
      titulo,
      fecha,
      hora,
      lugar,
      descripcion
    };
    actividades.push(newActividad);
  }

  localStorage.setItem("actividades", JSON.stringify(actividades));

  // actualizar la tabla del área administrativa
  if (typeof renderActividadesAdmin === "function") {
    renderActividadesAdmin();
  }

  closeModal("modal-actividad");
}


/* ─── RENDERIZADO ADMINISTRATIVO ─── */

function renderActividadesAdmin() {
  const tbody = document.getElementById('actividades-tbody');
  if (!tbody) return;

  const list = getActividades();
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No hay actividades registradas</td></tr>';
    return;
  }

  tbody.innerHTML = list.map((a) => {
    // Asegurar que cada actividad tiene un ID
    const actId = a.id || 'act_unknown';
    return `
    <tr>
      <td>${fmtDate(a.fecha)}</td>
      <td>${a.titulo}</td>
      <td>${a.lugar}</td>
      <td>
        <button class="btn-small btn-edit" data-id="${actId}" title="Editar">✏️</button>
        <button class="btn-small btn-delete" data-id="${actId}" title="Eliminar">🗑️</button>
      </td>
    </tr>
  `;
  }).join('');

  // Agregar event listeners a los botones
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      openActividadModal(id);
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      deleteActividad(id);
    });
  });
}

window.deleteActividad = function(id) {
  // Guardar el ID para usarlo en confirmDelete()
  window.pendingDeleteId = id;
  // Mostrar el modal de confirmación
  document.getElementById('modal-confirm-delete').classList.add('open');
};

window.confirmDelete = function() {
  const id = window.pendingDeleteId;
  
  if (!id) {
    return;
  }
  
  const acts = getActividades();
  const filtered = acts.filter(a => a.id !== id);
  
  localStorage.setItem("actividades", JSON.stringify(filtered));
  
  document.getElementById('modal-confirm-delete').classList.remove('open');
  renderActividadesAdmin();
  window.pendingDeleteId = null;
};