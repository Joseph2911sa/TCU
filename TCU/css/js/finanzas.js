/* ═══════════════════════════════════════════════════════════════
   ADECO · Sistema de Gestión Comunitaria
   Archivo: js/finanzas.js
   Descripción: CRUD completo del módulo financiero.
                Gestiona el modal de creación/edición,
                la tabla con filtros y las operaciones de
                guardar y eliminar transacciones.
                Depende de: storage.js, app.js
════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   MODAL: ABRIR
════════════════════════════════════════════ */

/**
 * Abre el modal de transacción.
 * Si se pasa un id, precarga los datos para edición.
 * Si no se pasa id, muestra el formulario vacío para crear.
 *
 * @param {string} [id] - ID de la transacción a editar (opcional)
 */
function openFinanzaModal(id) {
  const editId = id || '';
  document.getElementById('f-edit-id').value = editId;
  document.getElementById('modal-finanza-title').textContent =
    editId ? 'Editar Transacción' : 'Nueva Transacción';

  if (editId) {
    // Modo edición: cargar datos existentes
    const transaccion = finanzas.find(f => f.id === editId);
    document.getElementById('f-fecha').value       = transaccion.fecha;
    document.getElementById('f-tipo').value        = transaccion.tipo;
    document.getElementById('f-categoria').value   = transaccion.categoria;
    document.getElementById('f-monto').value       = transaccion.monto;
    document.getElementById('f-descripcion').value = transaccion.descripcion;
  } else {
    // Modo creación: formulario vacío con fecha de hoy
    document.getElementById('f-fecha').value       = new Date().toISOString().split('T')[0];
    document.getElementById('f-tipo').value        = '';
    document.getElementById('f-categoria').value   = '';
    document.getElementById('f-monto').value       = '';
    document.getElementById('f-descripcion').value = '';
  }

  document.getElementById('modal-finanza').classList.add('open');
}

/* ════════════════════════════════════════════
   GUARDAR (CREAR / ACTUALIZAR)
════════════════════════════════════════════ */

/**
 * Lee el formulario, valida los datos y crea o actualiza
 * la transacción en el array global `finanzas`.
 * Persiste en localStorage y refresca las vistas.
 */
function saveFinanza() {
  const fecha       = document.getElementById('f-fecha').value;
  const tipo        = document.getElementById('f-tipo').value;
  const categoria   = document.getElementById('f-categoria').value;
  const monto       = Number(document.getElementById('f-monto').value);
  const descripcion = document.getElementById('f-descripcion').value.trim();
  const editId      = document.getElementById('f-edit-id').value;

  // ── Validaciones ──
  if (!fecha || !tipo || !categoria || !monto) {
    toast('Complete todos los campos obligatorios.', 'error');
    return;
  }
  if (monto <= 0) {
    toast('El monto debe ser mayor que cero.', 'error');
    return;
  }

  if (editId) {
    // Actualizar registro existente
    const idx = finanzas.findIndex(f => f.id === editId);
    finanzas[idx] = { id: editId, fecha, tipo, categoria, monto, descripcion };
    toast('Transacción actualizada.');
  } else {
    // Crear nuevo registro
    finanzas.push({ id: uid(), fecha, tipo, categoria, monto, descripcion });
    toast('Transacción registrada.');
  }

  saveToStorage();
  closeModal('modal-finanza');
  renderFinanzas();
  updateDashboard();
}

/* ════════════════════════════════════════════
   ELIMINAR
════════════════════════════════════════════ */

/**
 * Solicita confirmación y elimina la transacción indicada.
 *
 * @param {string} id - ID de la transacción a eliminar
 */
function deleteFinanza(id) {
  if (!confirm('¿Eliminar esta transacción? Esta acción no se puede deshacer.')) return;

  finanzas = finanzas.filter(f => f.id !== id);
  saveToStorage();
  renderFinanzas();
  updateDashboard();
  toast('Transacción eliminada.', 'warning');
}

/* ════════════════════════════════════════════
   RENDERIZAR TABLA CON FILTROS
════════════════════════════════════════════ */

/**
 * Aplica los filtros activos (tipo, mes, año) y renderiza
 * la tabla de transacciones en el módulo financiero.
 * También se llama desde los onchange de los select de filtro.
 */
function renderFinanzas() {
  const filtroTipo = document.getElementById('filter-tipo').value;
  const filtroMes  = document.getElementById('filter-mes').value;
  const filtroAnio = document.getElementById('filter-anio').value;

  // Ordenar por fecha descendente y aplicar filtros
  let lista = [...finanzas].sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (filtroTipo) lista = lista.filter(t => t.tipo === filtroTipo);
  if (filtroMes)  lista = lista.filter(t => t.fecha.slice(5, 7) === filtroMes);
  if (filtroAnio) lista = lista.filter(t => t.fecha.slice(0, 4) === filtroAnio);

  const tbody = document.getElementById('finanzas-tbody');

  if (!lista.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-state">Sin resultados con los filtros seleccionados</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map(t => `
    <tr>
      <td>${fmtDate(t.fecha)}</td>
      <td>
        <span class="badge badge-${t.tipo === 'Ingreso' ? 'income' : 'expense'}">
          ${t.tipo}
        </span>
      </td>
      <td>${t.categoria}</td>
      <td>${t.descripcion || '—'}</td>
      <td class="${t.tipo === 'Ingreso' ? 'amount-positive' : 'amount-negative'}">
        ${fmtMoney(t.monto)}
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-sm edit"
            onclick="showPage('finanzas', null); openFinanzaModal('${t.id}')">
            ✏️ Editar
          </button>
          <button class="btn-sm delete"
            onclick="deleteFinanza('${t.id}')">
            🗑️ Borrar
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}