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
/* Se adjuntan al objeto window para que todos los módulos puedan acceder */

window.finanzas = JSON.parse(
  localStorage.getItem(STORAGE_KEYS.finanzas) || '[]'
);

window.reservas = JSON.parse(
  localStorage.getItem(STORAGE_KEYS.reservas) || '[]'
);

/* ─── FUNCIONES DE PERSISTENCIA ─── */
window.saveToStorage = function () {
  localStorage.setItem(STORAGE_KEYS.finanzas, JSON.stringify(window.finanzas));
  localStorage.setItem(STORAGE_KEYS.reservas, JSON.stringify(window.reservas));
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