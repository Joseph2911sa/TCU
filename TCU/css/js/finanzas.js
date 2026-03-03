/* ═══════════════════════════════════════════════════════════════
   ADECO · Sistema de Gestión Comunitaria
   Archivo: js/finanzas.js
════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   MODAL
════════════════════════════════════════════ */

window.openFinanzaModal = function (id) {

  const editId = id || '';

  document.getElementById('f-edit-id').value = editId;
  document.getElementById('modal-finanza-title').textContent =
    editId ? 'Editar Transacción' : 'Nueva Transacción';

  if (editId) {
    const transaccion = window.finanzas.find(f => f.id === editId);
    if (!transaccion) return;

    document.getElementById('f-fecha').value       = transaccion.fecha;
    document.getElementById('f-tipo').value        = transaccion.tipo;
    document.getElementById('f-categoria').value   = transaccion.categoria;
    document.getElementById('f-monto').value       = transaccion.monto;
    document.getElementById('f-descripcion').value = transaccion.descripcion;
  } else {
    document.getElementById('f-fecha').value =
      new Date().toISOString().split('T')[0];

    document.getElementById('f-tipo').value        = '';
    document.getElementById('f-categoria').value   = '';
    document.getElementById('f-monto').value       = '';
    document.getElementById('f-descripcion').value = '';
  }

  document.getElementById('modal-finanza')?.classList.add('open');
};

/* ════════════════════════════════════════════
   GUARDAR
════════════════════════════════════════════ */

window.saveFinanza = function () {

  const fecha       = document.getElementById('f-fecha').value;
  const tipo        = document.getElementById('f-tipo').value;
  const categoria   = document.getElementById('f-categoria').value;
  const monto       = Number(document.getElementById('f-monto').value);
  const descripcion = document.getElementById('f-descripcion').value.trim();
  const editId      = document.getElementById('f-edit-id').value;

  if (!fecha || !tipo || !categoria || !monto) {
    window.toast('Complete todos los campos obligatorios.', 'error');
    return;
  }

  if (monto <= 0) {
    window.toast('El monto debe ser mayor que cero.', 'error');
    return;
  }

  if (editId) {
    const idx = window.finanzas.findIndex(f => f.id === editId);
    if (idx !== -1) {
      window.finanzas[idx] =
        { id: editId, fecha, tipo, categoria, monto, descripcion };
      window.toast('Transacción actualizada.');
    }
  } else {
    window.finanzas.push({
      id: window.uid(),
      fecha,
      tipo,
      categoria,
      monto,
      descripcion
    });
    window.toast('Transacción registrada.');
  }

  window.saveToStorage();
  window.closeModal('modal-finanza');
  window.renderFinanzas();
  window.updateDashboard();
};

/* ════════════════════════════════════════════
   ELIMINAR
════════════════════════════════════════════ */

window.deleteFinanza = function (id) {

  if (!confirm('¿Eliminar esta transacción? Esta acción no se puede deshacer.'))
    return;

  window.finanzas = window.finanzas.filter(f => f.id !== id);

  window.saveToStorage();
  window.renderFinanzas();
  window.updateDashboard();
  window.toast('Transacción eliminada.', 'warning');
};

/* ════════════════════════════════════════════
   RENDER TABLA
════════════════════════════════════════════ */

window.renderFinanzas = function () {

  const filtroTipo = document.getElementById('filter-tipo')?.value || '';
  const filtroMes  = document.getElementById('filter-mes')?.value || '';
  const filtroAnio = document.getElementById('filter-anio')?.value || '';

  let lista = [...window.finanzas]
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (filtroTipo)
    lista = lista.filter(t => t.tipo === filtroTipo);

  if (filtroMes)
    lista = lista.filter(t => t.fecha.slice(5, 7) === filtroMes);

  if (filtroAnio)
    lista = lista.filter(t => t.fecha.slice(0, 4) === filtroAnio);

  const tbody = document.getElementById('finanzas-tbody');
  if (!tbody) return;

  if (!lista.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-state">Sin resultados</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map(t => `
    <tr>
      <td>${window.fmtDate(t.fecha)}</td>
      <td>${t.tipo}</td>
      <td>${t.categoria}</td>
      <td>${t.descripcion || '—'}</td>
      <td>${window.fmtMoney(t.monto)}</td>
      <td>
        <button onclick="openFinanzaModal('${t.id}')">Editar</button>
        <button onclick="deleteFinanza('${t.id}')">Borrar</button>
      </td>
    </tr>
  `).join('');
};
