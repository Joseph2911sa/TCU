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

window.saveFinanza = async function () {

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

  try {
    const data = await window.api.saveFinanza({
      id: editId || window.uid(),
      fecha,
      tipo,
      categoria,
      monto,
      descripcion
    });

    if (!data.success) {
      throw new Error(data.error || 'Error guardando');
    }

    const loaded = await window.loadData();

    if (!loaded) {
      throw new Error('No se pudo recargar la informacion');
    }

    window.toast(
      editId ? 'Transacción actualizada.' : 'Transacción registrada.'
    );

    window.closeModal('modal-finanza');
    window.renderFinanzas();
    window.updateDashboard();

  } catch (err) {

    console.error('saveFinanza error', err);
    window.toast(err.message || 'No se pudo guardar la transacción.', 'error');

  }
};

/* ════════════════════════════════════════════
   ELIMINAR
════════════════════════════════════════════ */

window.deleteFinanza = async function (id) {

  if (!confirm('¿Eliminar esta transacción? Esta acción no se puede deshacer.'))
    return;

  try {
    const resp = await window.api.deleteFinanza(id);
    if (resp.success) {
      await window.loadData();
      window.toast('Transacción eliminada.', 'warning');
    } else {
      throw new Error(resp.error || 'falló eliminación');
    }
  } catch (err) {
    console.error('deleteFinanza error', err);
    window.toast(err.message || 'No se pudo borrar la transacción.', 'error');
  }
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
        <div class="action-btns">
          <button class="btn-sm edit" onclick="openFinanzaModal('${t.id}')">
            ✏️ Editar
          </button>
          <button class="btn-sm delete" onclick="deleteFinanza('${t.id}')">
            🗑️ Borrar
          </button>
        </div>
      </td>
    </tr>
  `).join('');
};