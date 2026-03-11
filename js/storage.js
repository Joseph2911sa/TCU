/* ═══════════════════════════════════════════════════════════════
   ADECO · Sistema de Gestión Comunitaria
   Archivo: js/storage.js
════════════════════════════════════════════════════════════════ */

/* ─── CLAVES DE ALMACENAMIENTO ─── */
const STORAGE_KEYS = {
  finanzas: 'adeco_finanzas',
  reservas: 'adeco_reservas',
};

/* ─── ESTADO GLOBAL ─── */
/* Las colecciones se inicializan con arrays vacíos; se rellenarán mediante
   requests al backend cuando el usuario se autentique */
window.finanzas = [];
window.reservas = [];
window.actividades = [];

/* ─── INTERFAZ DE LA API ─── */
window.APP_BASE = window.location.pathname
  .replace(/\/admin(?:\/.*)?$/, '/')
  .replace(/\/index\.html$/, '/');

window.apiFetch = function (path, options) {
  const requestOptions = Object.assign({ credentials: 'same-origin' }, options);

  return fetch(window.APP_BASE + path, requestOptions).then(async response => {
    const rawText = await response.text();
    let data = {};

    if (rawText.includes('document.cookie="__test=') || rawText.includes('slowAES.decrypt')) {
      throw new Error('InfinityFree esta bloqueando la API con su Browser Security. Abra el sitio en el navegador, espere la redireccion de seguridad y vuelva a intentar.');
    }

    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (error) {
      throw new Error(rawText || 'La API devolvio una respuesta invalida');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Error de servidor');
    }

    return data;
  });
};

window.api = {
  // finanzas
  getFinanzas: () => window.apiFetch('api/finanzas.php'),
  saveFinanza: data => window.apiFetch('api/finanzas.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteFinanza: id => window.apiFetch('api/finanzas.php?id=' + encodeURIComponent(id), {
    method: 'DELETE'
  }),
  // reservas
  getReservas: () => window.apiFetch('api/reservas.php'),
  saveReserva: data => window.apiFetch('api/reservas.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteReserva: id => window.apiFetch('api/reservas.php?id=' + encodeURIComponent(id), {
    method: 'DELETE'
  }),
  // actividades
  getActividades: () => window.apiFetch('api/actividades.php'),
  saveActividad: data => window.apiFetch('api/actividades.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteActividad: id => window.apiFetch('api/actividades.php?id=' + encodeURIComponent(id), {
    method: 'DELETE'
  }),
  login: credentials => window.apiFetch('api/login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  }),
};

/* carga inicial, debe llamarse después de hacer login */
window.loadData = async function () {
  try {
    const [fin, resv, acts] = await Promise.all([
      window.api.getFinanzas(),
      window.api.getReservas(),
      window.api.getActividades(),
    ]);

    if (!Array.isArray(fin) || !Array.isArray(resv) || !Array.isArray(acts)) {
      throw new Error('La API devolvio un formato invalido');
    }

    window.finanzas = fin || [];
    window.reservas = resv || [];
    window.actividades = acts || [];
  } catch (err) {
    window.finanzas = [];
    window.reservas = [];
    window.actividades = [];
    console.error('Error cargando datos:', err);
    window.toast('Error al cargar datos: ' + (err.message || 'desconocido'), 'error');
    return false;
  }

  if (window.renderFinanzas) window.renderFinanzas();
  if (window.renderSalon) window.renderSalon();
  if (window.updateDashboard) window.updateDashboard();
  if (window.renderActividadesAdmin) window.renderActividadesAdmin();
  if (window.renderResumen) window.renderResumen();

  return true;
};

window.getPublicIndexUrl = function () {
  return window.APP_BASE + 'index.html';
};

/* ─── UTILIDADES GENERALES ─── */

window.uid = function () {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

window.fmtMoney = function (n) {
  return '₡' + Number(n).toLocaleString('es-CR', {
    minimumFractionDigits: 0,
  });
};

window.fmtDate = function (d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};