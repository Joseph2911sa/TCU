/* ═══════════════════════════════════════════════════════════════
   ADECO · Resumen del Sistema
   Archivo: js/resumen.js
   Funcionalidad: calcula totales y muestra los últimos movimientos
════════════════════════════════════════════════════════════════ */

// Se ejecuta cada vez que se navega a la vista o se recargan los datos
window.renderResumen = function () {
  // totales financieros
  const ingresos = window.finanzas
    .filter(t => t.tipo === 'Ingreso')
    .reduce((sum, t) => sum + Number(t.monto), 0);
  const egresos = window.finanzas
    .filter(t => t.tipo === 'Egreso')
    .reduce((sum, t) => sum + Number(t.monto), 0);
  const balance = ingresos - egresos;

  const reservasCount = window.reservas ? window.reservas.length : 0;
  const actividadesCount = window.actividades ? window.actividades.length : 0;

  // actualizar tarjetas
  document.getElementById('resumen-ingresos').textContent = window.fmtMoney(ingresos);
  document.getElementById('resumen-egresos').textContent  = window.fmtMoney(egresos);
  const balEl = document.getElementById('resumen-balance');
  if (balEl) {
    balEl.textContent = window.fmtMoney(balance);
    balEl.className = 'stat-value ' + (balance >= 0 ? 'positive' : 'negative');
  }
  document.getElementById('resumen-reservas').textContent = reservasCount;
  document.getElementById('resumen-actividades').textContent = actividadesCount;

  // construir lista de movimientos mixtos
  const movs = [];
  (window.finanzas || []).forEach(f => {
    movs.push({
      fecha: f.fecha,
      modulo: 'Finanzas',
      descripcion: f.descripcion || (f.tipo + ' ' + f.categoria),
      monto: window.fmtMoney(f.monto),
      estado: ''
    });
  });
  (window.reservas || []).forEach(r => {
    movs.push({
      fecha: r.fecha,
      modulo: 'Reservas',
      descripcion: `${r.nombre} – ${r.actividad}`,
      monto: '',
      estado: r.estado || ''
    });
  });
  (window.actividades || []).forEach(a => {
    movs.push({
      fecha: a.fecha,
      modulo: 'Actividades',
      descripcion: a.titulo || '',
      monto: '',
      estado: ''
    });
  });

  movs.sort((a, b) => b.fecha.localeCompare(a.fecha));
  const recent = movs.slice(0, 10);

  const tbody = document.getElementById('resumen-tbody');
  if (!tbody) return;

  if (!recent.length) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="empty-state">No hay movimientos recientes</td></tr>';
    return;
  }

  tbody.innerHTML = recent.map(m => `
    <tr>
      <td>${window.fmtDate(m.fecha)}</td>
      <td>${m.modulo}</td>
      <td>${m.descripcion}</td>
      <td>${m.monto || '—'}</td>
      <td>${m.estado || '—'}</td>
    </tr>
  `).join('');
};
