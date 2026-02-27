/* ═══════════════════════════════════════════════════════════════
   ADECO · Sistema de Gestión Comunitaria
   Archivo: js/reservas.js
   Descripción: CRUD completo del módulo de reservas del salón
                comunal. Incluye verificación de disponibilidad
                para evitar dobles reservas en la misma fecha.
                Depende de: storage.js, app.js
════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   MODAL: ABRIR
════════════════════════════════════════════ */

/**
 * Abre el modal de reserva.
 * Si se pasa un id, precarga los datos para edición.
 * Si no se pasa id, muestra el formulario vacío para crear.
 *
 * @param {string} [id] - ID de la reserva a editar (opcional)
 */
function openReservaModal(id) {
  const editId = id || '';
  document.getElementById('r-edit-id').value = editId;
  document.getElementById('modal-reserva-title').textContent =
    editId ? 'Editar Reserva' : 'Nueva Reserva';

  // Limpiar el indicador de disponibilidad
  document.getElementById('avail-status').innerHTML = '';

  if (editId) {
    // Modo edición: cargar datos existentes
    const reserva = reservas.find(r => r.id === editId);
    document.getElementById('r-fecha').value    = reserva.fecha;
    document.getElementById('r-nombre').value   = reserva.nombre;
    document.getElementById('r-telefono').value = reserva.telefono;
    document.getElementById('r-actividad').value = reserva.actividad;
    document.getElementById('r-estado').value   = reserva.estado;

    // Mostrar disponibilidad para la fecha precargada
    checkAvailability();
  } else {
    // Modo creación: formulario vacío
    document.getElementById('r-fecha').value     = '';
    document.getElementById('r-nombre').value    = '';
    document.getElementById('r-telefono').value  = '';
    document.getElementById('r-actividad').value = '';
    document.getElementById('r-estado').value    = 'Confirmada';
  }

  document.getElementById('modal-reserva').classList.add('open');
}

/* ════════════════════════════════════════════
   VERIFICACIÓN DE DISPONIBILIDAD
════════════════════════════════════════════ */

/**
 * Verifica si la fecha seleccionada en el modal ya tiene
 * una reserva confirmada (excluyendo la reserva que se está
 * editando, si aplica).
 * Muestra un indicador visual de disponibilidad.
 * Se llama desde el onchange del campo r-fecha.
 */
function checkAvailability() {
  const fecha  = document.getElementById('r-fecha').value;
  const editId = document.getElementById('r-edit-id').value;
  const el     = document.getElementById('avail-status');

  if (!fecha) {
    el.innerHTML = '';
    return;
  }

  const conflicto = reservas.find(
    r => r.fecha === fecha && r.id !== editId && r.estado === 'Confirmada'
  );

  if (conflicto) {
    el.innerHTML = `
      <div class="reserva-availability avail-no">
        ⚠️ Fecha no disponible (ya existe una reserva confirmada)
      </div>`;
  } else {
    el.innerHTML = `
      <div class="reserva-availability avail-ok">
        ✅ Fecha disponible
      </div>`;
  }
}

/* ════════════════════════════════════════════
   GUARDAR (CREAR / ACTUALIZAR)
════════════════════════════════════════════ */

/**
 * Lee el formulario, valida los datos y crea o actualiza
 * la reserva en el array global `reservas`.
 * Bloquea la creación si ya existe una reserva confirmada
 * en la misma fecha (RF6 – Control de disponibilidad).
 * Persiste en localStorage y refresca las vistas.
 */
function saveReserva() {
  const fecha     = document.getElementById('r-fecha').value;
  const nombre    = document.getElementById('r-nombre').value.trim();
  const telefono  = document.getElementById('r-telefono').value.trim();
  const actividad = document.getElementById('r-actividad').value;
  const estado    = document.getElementById('r-estado').value;
  const editId    = document.getElementById('r-edit-id').value;

  // ── Validaciones ──
  if (!fecha || !nombre || !telefono || !actividad) {
    toast('Complete todos los campos obligatorios.', 'error');
    return;
  }

  // ── Control de disponibilidad (solo para reservas Confirmadas) ──
  if (estado === 'Confirmada') {
    const conflicto = reservas.find(
      r => r.fecha === fecha && r.id !== editId && r.estado === 'Confirmada'
    );
    if (conflicto) {
      toast('Ya existe una reserva confirmada en esa fecha.', 'error');
      return;
    }
  }

  if (editId) {
    // Actualizar registro existente
    const idx = reservas.findIndex(r => r.id === editId);
    reservas[idx] = { id: editId, fecha, nombre, telefono, actividad, estado };
    toast('Reserva actualizada.');
  } else {
    // Crear nuevo registro
    reservas.push({ id: uid(), fecha, nombre, telefono, actividad, estado });
    toast('Reserva registrada.');
  }

  saveToStorage();
  closeModal('modal-reserva');
  renderSalon();
  updateDashboard();
}

/* ════════════════════════════════════════════
   ELIMINAR
════════════════════════════════════════════ */

/**
 * Solicita confirmación y elimina la reserva indicada.
 *
 * @param {string} id - ID de la reserva a eliminar
 */
function deleteReserva(id) {
  if (!confirm('¿Eliminar esta reserva? Esta acción no se puede deshacer.')) return;

  reservas = reservas.filter(r => r.id !== id);
  saveToStorage();
  renderSalon();
  updateDashboard();
  toast('Reserva eliminada.', 'warning');
}

/* ════════════════════════════════════════════
   RENDERIZAR TABLA
════════════════════════════════════════════ */

/**
 * Renderiza la tabla de reservas en el módulo del salón comunal.
 * Ordena las reservas por fecha ascendente.
 */
function renderSalon() {
  const lista = [...reservas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const tbody = document.getElementById('salon-tbody');

  if (!lista.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-state">No hay reservas registradas</td></tr>';
    return;
  }

  // Mapa de estado → clase CSS del badge
  const badgeClass = {
    Confirmada: 'badge-confirmed',
    Pendiente:  'badge-pending',
    Cancelada:  'badge-cancelled',
  };

  tbody.innerHTML = lista.map(r => `
    <tr>
      <td>${fmtDate(r.fecha)}</td>
      <td>${r.nombre}</td>
      <td>${r.telefono}</td>
      <td>${r.actividad}</td>
      <td>
        <span class="badge ${badgeClass[r.estado] || 'badge-pending'}">
          ${r.estado}
        </span>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-sm edit"
            onclick="openReservaModal('${r.id}')">
            ✏️ Editar
          </button>
          <button class="btn-sm delete"
            onclick="deleteReserva('${r.id}')">
            🗑️ Borrar
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}