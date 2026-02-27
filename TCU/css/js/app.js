/* ═══════════════════════════════════════════════════════════════
   ADECO · Sistema de Gestión Comunitaria
   Archivo: js/app.js
   Descripción: Navegación entre páginas, control del sidebar,
                utilidades de UI (toast, modal) y lógica del
                dashboard principal.
                Depende de: storage.js
════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   NAVEGACIÓN ENTRE PÁGINAS
════════════════════════════════════════════ */

/**
 * Activa la página solicitada y marca el ítem del menú
 * correspondiente como activo.
 *
 * @param {string}          name - ID de la página ('dashboard' | 'finanzas' | 'salon')
 * @param {HTMLElement|null} btn  - Botón del sidebar que fue clicado (puede ser null
 *                                  cuando se navega programáticamente)
 */
function showPage(name, btn) {
  // Ocultar todas las páginas y desactivar todos los nav-items
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  // Activar la página solicitada
  document.getElementById('page-' + name).classList.add('active');

  // Marcar el nav-item: si se pasó el botón directamente úsalo;
  // si no, búscalo por coincidencia de texto
  if (btn) {
    btn.classList.add('active');
  } else {
    document.querySelectorAll('.nav-item').forEach(b => {
      if (b.textContent.toLowerCase().includes(name === 'salon' ? 'sal' : name)) {
        b.classList.add('active');
      }
    });
  }

  // Cerrar sidebar en móvil al navegar
  closeSidebar();

  // Actualizar dashboard al volver a él
  if (name === 'dashboard') updateDashboard();
}

/* ════════════════════════════════════════════
   SIDEBAR (MENÚ LATERAL)
════════════════════════════════════════════ */

/** Alterna la visibilidad del sidebar en dispositivos móviles. */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}

/** Cierra el sidebar en dispositivos móviles. */
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

/* ════════════════════════════════════════════
   UTILIDADES DE INTERFAZ
════════════════════════════════════════════ */

/**
 * Muestra una notificación temporal (toast) en la esquina inferior derecha.
 *
 * @param {string} msg  - Texto del mensaje
 * @param {string} type - Clase de estilo: '' (éxito) | 'error' | 'warning'
 */
function toast(msg, type = '') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/**
 * Cierra un modal eliminando la clase 'open' de su overlay.
 *
 * @param {string} id - ID del elemento .modal-overlay a cerrar
 */
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

/* ─── Cierre de modales al hacer clic fuera ─── */
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

/* ════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════ */

/**
 * Recalcula y renderiza las tarjetas de estadísticas
 * y la tabla de últimas transacciones del dashboard.
 * Debe llamarse cada vez que cambien finanzas o reservas.
 */
function updateDashboard() {
  // ── Cálculo del balance ──
  const totalIngresos = finanzas
    .filter(t => t.tipo === 'Ingreso')
    .reduce((sum, t) => sum + Number(t.monto), 0);

  const totalEgresos = finanzas
    .filter(t => t.tipo === 'Egreso')
    .reduce((sum, t) => sum + Number(t.monto), 0);

  const balance = totalIngresos - totalEgresos;

  const reservasActivas = reservas.filter(
    r => r.estado === 'Confirmada' || r.estado === 'Pendiente'
  ).length;

  // ── Actualizar tarjetas ──
  document.getElementById('dash-ingresos').textContent = fmtMoney(totalIngresos);
  document.getElementById('dash-egresos').textContent  = fmtMoney(totalEgresos);
  document.getElementById('dash-reservas').textContent = reservasActivas;

  const balEl = document.getElementById('dash-balance');
  balEl.textContent = fmtMoney(balance);
  balEl.className   = 'stat-value ' + (balance >= 0 ? 'positive' : 'negative');

  // ── Últimas 5 transacciones ──
  const tbody  = document.getElementById('dash-recent-tbody');
  const recent = [...finanzas]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5);

  if (!recent.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay transacciones aún</td></tr>';
    return;
  }

  tbody.innerHTML = recent.map(t => `
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
    </tr>
  `).join('');
}