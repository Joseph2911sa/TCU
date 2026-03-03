/* ═══════════════════════════════════════════════════════════════
   ADECO · Sistema de Gestión Comunitaria
   Archivo: js/app.js
════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   NAVEGACIÓN ENTRE PÁGINAS
════════════════════════════════════════════ */

window.showPage = function (name, btn) {

  document.querySelectorAll('.page')
    .forEach(p => p.classList.remove('active'));

  document.querySelectorAll('.nav-item')
    .forEach(b => b.classList.remove('active'));

  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');

  if (btn) {
    btn.classList.add('active');
  }

  window.closeSidebar();

  if (name === 'dashboard' && typeof window.updateDashboard === "function") {
    window.updateDashboard();
  }
};

/* ════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════ */

window.toggleSidebar = function () {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('sidebar-overlay')?.classList.toggle('open');
};

window.closeSidebar = function () {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
};

/* ════════════════════════════════════════════
   TOAST
════════════════════════════════════════════ */

window.toast = function (msg, type = '') {

  const container = document.getElementById('toast-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;

  container.appendChild(el);

  setTimeout(() => el.remove(), 3500);
};

/* ════════════════════════════════════════════
   MODAL
════════════════════════════════════════════ */

window.closeModal = function (id) {
  document.getElementById(id)?.classList.remove('open');
};

/* Esperar a que cargue el DOM para eventos */
document.addEventListener("DOMContentLoaded", function () {

  document.querySelectorAll('.modal-overlay')
    .forEach(overlay => {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          overlay.classList.remove('open');
        }
      });
    });

});

/* ════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════ */

window.updateDashboard = function () {

  const totalIngresos = window.finanzas
    .filter(t => t.tipo === 'Ingreso')
    .reduce((sum, t) => sum + Number(t.monto), 0);

  const totalEgresos = window.finanzas
    .filter(t => t.tipo === 'Egreso')
    .reduce((sum, t) => sum + Number(t.monto), 0);

  const balance = totalIngresos - totalEgresos;

  const reservasActivas = window.reservas
    .filter(r => r.estado === 'Confirmada' || r.estado === 'Pendiente')
    .length;

  document.getElementById('dash-ingresos').textContent = window.fmtMoney(totalIngresos);
  document.getElementById('dash-egresos').textContent  = window.fmtMoney(totalEgresos);
  document.getElementById('dash-reservas').textContent = reservasActivas;

  const balEl = document.getElementById('dash-balance');
  balEl.textContent = window.fmtMoney(balance);
  balEl.className   = 'stat-value ' + (balance >= 0 ? 'positive' : 'negative');

  const tbody  = document.getElementById('dash-recent-tbody');

  const recent = [...window.finanzas]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5);

  if (!recent.length) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="empty-state">No hay transacciones aún</td></tr>';
    return;
  }

  tbody.innerHTML = recent.map(t => `
    <tr>
      <td>${window.fmtDate(t.fecha)}</td>
      <td>${t.tipo}</td>
      <td>${t.categoria}</td>
      <td>${t.descripcion || '—'}</td>
      <td>${window.fmtMoney(t.monto)}</td>
    </tr>
  `).join('');
};