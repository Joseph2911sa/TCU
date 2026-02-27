/* ═══════════════════════════════════════════════════════════════
   ADECO · Sistema de Gestión Comunitaria
   Archivo: js/storage.js
   Descripción: Estado global de la aplicación y persistencia
                en localStorage. Todos los demás módulos leen
                y escriben sobre estas variables.
════════════════════════════════════════════════════════════════ */

/* ─── CLAVES DE ALMACENAMIENTO ─── */
const STORAGE_KEYS = {
  finanzas: 'adeco_finanzas',
  reservas: 'adeco_reservas',
};

/* ─── ESTADO GLOBAL ─── */

/**
 * Array de transacciones financieras.
 * Cada objeto tiene la forma:
 * { id, fecha, tipo, categoria, descripcion, monto }
 */
let finanzas = JSON.parse(localStorage.getItem(STORAGE_KEYS.finanzas) || '[]');

/**
 * Array de reservas del salón comunal.
 * Cada objeto tiene la forma:
 * { id, fecha, nombre, telefono, actividad, estado }
 */
let reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.reservas) || '[]');

/* ─── FUNCIONES DE PERSISTENCIA ─── */

/**
 * Persiste el estado actual de finanzas y reservas en localStorage.
 * Debe llamarse después de cualquier operación de escritura (crear,
 * editar o eliminar).
 */
function saveToStorage() {
  localStorage.setItem(STORAGE_KEYS.finanzas, JSON.stringify(finanzas));
  localStorage.setItem(STORAGE_KEYS.reservas,  JSON.stringify(reservas));
}

/* ─── UTILIDADES GENERALES ─── */

/**
 * Genera un identificador único basado en timestamp y aleatoriedad.
 * @returns {string} ID único
 */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Formatea un número como moneda en colones costarricenses.
 * @param {number} n - Valor a formatear
 * @returns {string} Ej: "₡12.500"
 */
function fmtMoney(n) {
  return '₡' + Number(n).toLocaleString('es-CR', { minimumFractionDigits: 0 });
}

/**
 * Convierte una fecha ISO (YYYY-MM-DD) al formato local DD/MM/YYYY.
 * @param {string} d - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
function fmtDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}