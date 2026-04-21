/* ═══════════════════════════════════════════════════════════════
  ADECO · Portal Público Comunitario
  Archivo: public/js/public.js
  Descripción: Lógica completa del portal informativo público.
           Consume la API pública para renderizar reservas,
           actividades y finanzas.
════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   ESTADO DEL PORTAL
════════════════════════════════════════════ */

/** Mes y año actualmente visibles en el calendario */
const calState = {
  year:  new Date().getFullYear(),
  month: new Date().getMonth(), // 0-indexed
};

const publicState = {
  reservas: [],
  actividades: [],
  finanzas: [],
};

/* ════════════════════════════════════════════
   UTILIDADES
════════════════════════════════════════════ */

/**
 * Devuelve una fecha futura en formato legible (DD/MM/YYYY).
 * @param {number} diasDesdeHoy
 * @returns {string}
 */
function obtenerFechaRelativa(diasDesdeHoy) {
  const d = new Date();
  d.setDate(d.getDate() + diasDesdeHoy);
  return d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Convierte fecha ISO (YYYY-MM-DD) a formato local DD/MM/YYYY.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Formatea un número como moneda en colones costarricenses.
 * @param {number} n
 * @returns {string}
 */
function formatMoney(n) {
  return '₡' + Number(n).toLocaleString('es-CR', { minimumFractionDigits: 0 });
}

function getApiBase() {
  return window.location.pathname.replace(/\/index\.html$/, '/');
}

async function publicFetch(path) {
  const response = await fetch(getApiBase() + path, { credentials: 'same-origin' });
  const rawText = await response.text();

  let data = [];
  try {
    data = rawText ? JSON.parse(rawText) : [];
  } catch (error) {
    throw new Error(rawText || 'Respuesta invalida del servidor');
  }

  if (!response.ok) {
    throw new Error(data.error || 'Error de servidor');
  }

  return data;
}

/**
 * Nombre del mes en español.
 * @param {number} monthIndex - 0-indexed
 * @returns {string}
 */
function nombreMes(monthIndex) {
  const meses = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
  ];
  return meses[monthIndex];
}

/* ════════════════════════════════════════════
   CARGA DE DATOS
════════════════════════════════════════════ */

/**
 * Lee las reservas confirmadas desde localStorage
 * y devuelve solo las futuras (o de hoy en adelante).
 * @returns {Array}
 */
function cargarReservas() {
  const todas = publicState.reservas;
  const hoy   = new Date().toISOString().split('T')[0];
  return todas
    .filter(r => r.estado === 'Confirmada' && r.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/**
 * Lee todas las reservas (cualquier estado y fecha)
 * para marcarlas en el calendario.
 * @returns {Set<string>} Conjunto de fechas ISO reservadas
 */
function cargarFechasReservadas() {
  const todas = publicState.reservas;
  return new Set(
    todas
      .filter(r => r.estado === 'Confirmada')
      .map(r => r.fecha)
  );
}

/**
 * Lee las transacciones financieras desde localStorage.
 * @returns {{ ingresos: number, egresos: number, balance: number, lista: Array }}
 */
function cargarFinanzas() {
  const lista = [...publicState.finanzas];
  const ingresos = lista
    .filter(t => t.tipo === 'Ingreso')
    .reduce((s, t) => s + Number(t.monto), 0);
  const egresos = lista
    .filter(t => t.tipo === 'Egreso')
    .reduce((s, t) => s + Number(t.monto), 0);
  return {
    ingresos,
    egresos,
    balance: ingresos - egresos,
    lista: lista.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 10),
  };
}

/* ════════════════════════════════════════════
   RENDERIZADO: HERO STATS
════════════════════════════════════════════ */

/**
 * Actualiza las estadísticas rápidas en el área hero.
 */
function renderHeroStats() {
  const fin  = cargarFinanzas();
  const res  = cargarReservas();

  document.getElementById('hs-ingresos').textContent = formatMoney(fin.ingresos);
  document.getElementById('hs-reservas').textContent = res.length;

  const balEl = document.getElementById('hs-balance');
  balEl.textContent = formatMoney(fin.balance);
  balEl.style.color = fin.balance >= 0 ? '#7ec8a0' : '#e8907a';
}

/* ════════════════════════════════════════════
   RENDERIZADO: TABLA DE RESERVAS
════════════════════════════════════════════ */

/**
 * Renderiza la tabla pública de reservas confirmadas.
 */
function renderTablaReservas() {
  const reservas = cargarReservas();
  const tbody     = document.getElementById('pub-reservas-tbody');
  const countEl   = document.getElementById('reservas-count');

  countEl.textContent = reservas.length + ' reserva' + (reservas.length !== 1 ? 's' : '');

  if (!reservas.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="pub-empty">
          <span>📅</span>
          <p>No hay reservas confirmadas próximamente.</p>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = reservas.map(r => `
    <tr>
      <td>${formatDate(r.fecha)}</td>
      <td>${r.actividad || r.tipo_actividad || '—'}</td>
      <td>
        <span class="pub-badge pub-badge-confirmed">✓ Confirmada</span>
      </td>
    </tr>
  `).join('');
}

/* ════════════════════════════════════════════
   RENDERIZADO: CALENDARIO
════════════════════════════════════════════ */

/**
 * Construye y renderiza el calendario mensual con días marcados.
 * Usa calState.year y calState.month para determinar qué mostrar.
 */
function renderCalendario() {
  const fechasReservadas = cargarFechasReservadas();
  const { year, month }  = calState;
  const hoy              = new Date();
  const primerDia        = new Date(year, month, 1).getDay(); // 0=dom
  const diasEnMes        = new Date(year, month + 1, 0).getDate();

  // Actualizar etiqueta de mes
  document.getElementById('cal-month-label').textContent =
    `${nombreMes(month)} ${year}`;

  // Nombres de días (abreviados)
  const dias = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  let html = '<div class="cal-grid">';

  // Cabecera con nombres de días
  dias.forEach(d => {
    html += `<div class="cal-day-name">${d}</div>`;
  });

  // Celdas vacías antes del día 1
  for (let i = 0; i < primerDia; i++) {
    html += '<div class="cal-day cal-empty"></div>';
  }

  // Días del mes
  for (let d = 1; d <= diasEnMes; d++) {
    const mm     = String(month + 1).padStart(2, '0');
    const dd     = String(d).padStart(2, '0');
    const isoFecha = `${year}-${mm}-${dd}`;
    const esHoy  = (d === hoy.getDate() && month === hoy.getMonth() && year === hoy.getFullYear());
    const reservado = fechasReservadas.has(isoFecha);

    let clases = 'cal-day';
    if (esHoy)     clases += ' cal-today';
    if (reservado) clases += ' cal-reserved';

    const titulo = reservado ? 'title="Fecha reservada"' : '';
    html += `<div class="${clases}" ${titulo}>${d}</div>`;
  }

  html += '</div>';
  document.getElementById('pub-calendar').innerHTML = html;
}

/* ════════════════════════════════════════════
   NAVEGACIÓN DEL CALENDARIO
════════════════════════════════════════════ */

/** Retrocede un mes en el calendario. */
function calPrev() {
  calState.month--;
  if (calState.month < 0) {
    calState.month = 11;
    calState.year--;
  }
  renderCalendario();
}

/** Avanza un mes en el calendario. */
function calNext() {
  calState.month++;
  if (calState.month > 11) {
    calState.month = 0;
    calState.year++;
  }
  renderCalendario();
}

/* ════════════════════════════════════════════
   RENDERIZADO: ACTIVIDADES COMUNITARIAS
════════════════════════════════════════════ */

/**
 * Renderiza las tarjetas de actividades comunitarias.
 * Renderiza actividades desde la API.
 */
function renderActividades() {
  const grid = document.getElementById('activities-grid');
  if (!grid) return;

  const actsData = publicState.actividades;

  if (!actsData.length) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-light);">
        <p>📅 No hay actividades programadas en este momento.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = actsData.map((act, idx) => {
    // Color aleatorio si no está definido
    const colors = ['#4a8c5c', '#5b8fb9', '#c9a84c', '#c45c3a'];
    const color = act.color || colors[idx % colors.length];

    return `
      <div class="activity-card" style="--activity-color: ${color}">
        <div class="activity-type" style="background: ${color}1a; color: ${color}">
          ${act.tipo || '📢 Actividad'}
        </div>
        <h4>${act.titulo}</h4>
        <p>${act.descripcion || 'Sin descripción'}</p>
        <div class="activity-meta">
          <span>📅 ${formatDate(act.fecha)}</span>
          <span>🕐 ${act.hora || '—'}</span>
          <span>📍 ${act.lugar || '—'}</span>
        </div>
      </div>
    `;
  }).join('');
}

/* ════════════════════════════════════════════
   RENDERIZADO: RESUMEN FINANCIERO PÚBLICO
════════════════════════════════════════════ */

/**
 * Calcula y muestra el resumen financiero.
 */
function renderFinanzas() {
  const { ingresos, egresos, balance, lista } = cargarFinanzas();

  document.getElementById('pub-ingresos').textContent = formatMoney(ingresos);
  document.getElementById('pub-egresos').textContent  = formatMoney(egresos);

  const balEl = document.getElementById('pub-balance');
  balEl.textContent  = formatMoney(balance);
  balEl.style.color  = balance >= 0 ? '#7ec8a0' : '#e8907a';

  const tbody = document.getElementById('pub-finanzas-tbody');

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="pub-empty">
          <span>💰</span>
          <p>No hay datos financieros disponibles.</p>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = lista.map(t => {
    const badgeClass = t.tipo === 'Ingreso' ? 'pub-badge-confirmed' : 'pub-badge-pending';
    return `
      <tr>
        <td>${formatDate(t.fecha)}</td>
        <td><span class="pub-badge ${badgeClass}">${t.tipo}</span></td>
        <td>${t.categoria || '—'}</td>
        <td style="font-weight:600; color:${t.tipo === 'Ingreso' ? '#7ec8a0' : '#e8907a'}">
          ${formatMoney(t.monto)}
        </td>
      </tr>
    `;
  }).join('');
}

/* ════════════════════════════════════════════
   NAVEGACIÓN: SCROLL ACTIVO Y STICKY HEADER
════════════════════════════════════════════ */

/**
 * Actualiza la clase 'active' del nav-link que corresponde
 * a la sección visible en pantalla (IntersectionObserver).
 */
function initScrollNav() {
  const secciones = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.pub-nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.pub-nav-link[href="#${entry.target.id}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  secciones.forEach(s => observer.observe(s));

  // Header scrolled class
  window.addEventListener('scroll', () => {
    const header = document.getElementById('pub-header');
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* ════════════════════════════════════════════
   MENÚ MÓVIL (HAMBURGER)
════════════════════════════════════════════ */

/**
 * Inicializa el toggle del menú hamburger en móvil.
 */
function initMobileNav() {
  const btn = document.getElementById('pub-hamburger');
  const nav = document.getElementById('pub-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    nav.classList.toggle('open');
  });

  // Cerrar el menú al hacer clic en un link
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });
}

/* ════════════════════════════════════════════
   AÑO DINÁMICO EN EL FOOTER
════════════════════════════════════════════ */

function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ════════════════════════════════════════════
   EVENTOS DEL CALENDARIO
════════════════════════════════════════════ */

function initCalendarNav() {
  const prevBtn = document.getElementById('cal-prev');
  const nextBtn = document.getElementById('cal-next');
  if (prevBtn) prevBtn.addEventListener('click', calPrev);
  if (nextBtn) nextBtn.addEventListener('click', calNext);
}

/* ════════════════════════════════════════════
   INICIALIZACIÓN PRINCIPAL
════════════════════════════════════════════ */

/**
 * Punto de entrada. Ejecuta todas las funciones de renderizado
 * y configura los listeners de interacción.
 */
function init() {
  // Datos dinámicos desde API
  renderHeroStats();
  renderTablaReservas();
  renderCalendario();
  renderActividades();
  renderFinanzas();
  renderGaleria();
  renderContacto();

  // UI / interacción
  setFooterYear();
  initScrollNav();
  initMobileNav();
  initCalendarNav();

}

async function loadPublicData() {
  try {
    const [reservas, actividades, finanzas, galeria, contacto] = await Promise.all([
      publicFetch('api/reservas.php'),
      publicFetch('api/actividades.php'),
      publicFetch('api/finanzas.php'),
      publicFetch('api/galeria.php').catch(() => []),
      publicFetch('api/contacto.php').catch(() => null),
    ]);

    publicState.reservas    = Array.isArray(reservas)    ? reservas    : [];
    publicState.actividades = Array.isArray(actividades) ? actividades : [];
    publicState.finanzas    = Array.isArray(finanzas)    ? finanzas    : [];
    publicState.galeria     = Array.isArray(galeria)     ? galeria     : [];
    publicState.contacto    = (contacto && contacto.success) ? contacto    : null;
  } catch (error) {
    console.error('Error cargando portal publico:', error);
    publicState.reservas    = [];
    publicState.actividades = [];
    publicState.finanzas    = [];
    publicState.galeria     = null; // null = mostrar fotos originales como fallback
    publicState.contacto    = null;
  }
}

/* ════════════════════════════════════════════
   GALERÍA DINÁMICA
════════════════════════════════════════════ */

function renderGaleria() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  const items = publicState.galeria;

  // Si no hay nada en la API o falló, mostrar las imágenes originales como fallback
  if (!items || !items.length) {
    const fallback = [
      { ruta: 'assets/img/galeria/salon.jpg',   caption: 'Salón comunal' },
      { ruta: 'assets/img/galeria/plaza.jpg',   caption: 'Plaza de deportes' },
      { ruta: 'assets/img/galeria/pueblo.jpg',  caption: 'Vista de la comunidad', tall: true },
      { ruta: 'assets/img/galeria/escuela.jpg', caption: 'Escuela' },
      { ruta: 'assets/img/galeria/iglesia.jpg', caption: 'Iglesia' },
    ];
    grid.innerHTML = fallback.map((f, i) => `
      <div class="gallery-item${f.tall ? ' gallery-item-tall' : ''}">
        <img src="${f.ruta}" alt="${f.caption}">
        <div class="gallery-caption">${f.caption}</div>
      </div>
    `).join('');
    return;
  }

  grid.innerHTML = items.map((item, i) => `
    <div class="gallery-item${i === 2 ? ' gallery-item-tall' : ''}">
      <img src="${item.ruta}" alt="${item.caption || ''}" onerror="this.parentElement.style.display='none'">
      ${item.caption ? `<div class="gallery-caption">${item.caption}</div>` : ''}
    </div>
  `).join('');
}

/* ════════════════════════════════════════════
   CONTACTO DINÁMICO
════════════════════════════════════════════ */

function renderContacto() {
  const ct = publicState.contacto;
  if (!ct || !ct.success) return; // si no hay datos en BD se queda el texto por defecto del HTML

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.textContent = val;
  };

  set('pub-ct-telefono',   ct.telefono);
  set('pub-ct-correo',     ct.correo);
  set('pub-ct-direccion',  ct.direccion);
  set('pub-ct-horario',    ct.horario);
  set('pub-ct-descripcion',ct.descripcion);
  set('pub-ct-mision',     ct.mision);
  set('pub-ct-vision',     ct.vision);
  set('pub-ct-valores',    ct.valores);

  // Footer
  set('footer-ct-telefono', ct.telefono);
  set('footer-ct-correo',   ct.correo);
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  await loadPublicData();
  init();
});