/* ═══════════════════════════════════════════════════════════════
   ADECO · Portal Público Comunitario
   Archivo: public/js/public.js
   Descripción: Lógica completa del portal informativo público.
                No depende del panel administrativo. Lee datos
                del localStorage compartido y renderiza todas
                las secciones dinámicas de la página.
════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   ESTADO DEL PORTAL
════════════════════════════════════════════ */

/** Mes y año actualmente visibles en el calendario */
const calState = {
  year:  new Date().getFullYear(),
  month: new Date().getMonth(), // 0-indexed
};

/** Actividades de ejemplo (se muestran cuando no hay datos reales) */
const SAMPLE_ACTIVITIES = [
  {
    tipo: '📅 Reunión',
    color: '#4a8c5c',
    titulo: 'Asamblea General Ordinaria',
    descripcion: 'Reunión anual de la asamblea para rendición de cuentas y elección de junta directiva.',
    fecha: obtenerFechaRelativa(7),
    hora: '7:00 p.m.',
    lugar: 'Salón Comunal',
  },
  {
    tipo: '🎓 Capacitación',
    color: '#5b8fb9',
    titulo: 'Taller de Primeros Auxilios',
    descripcion: 'Capacitación gratuita impartida por la Cruz Roja. Cupos limitados a 30 personas.',
    fecha: obtenerFechaRelativa(14),
    hora: '9:00 a.m.',
    lugar: 'Salón Comunal',
  },
  {
    tipo: '⚽ Deportivo',
    color: '#c45c3a',
    titulo: 'Torneo de Fútbol Comunitario',
    descripcion: 'Torneo interfamilias. Inscripciones abiertas. Equipos de 7 jugadores máximo.',
    fecha: obtenerFechaRelativa(21),
    hora: '2:00 p.m.',
    lugar: 'Cancha local',
  },
  {
    tipo: '🌿 Ambiental',
    color: '#7ec8a0',
    titulo: 'Jornada de Limpieza Comunal',
    descripcion: 'Actividad comunitaria para limpieza de áreas públicas y siembra de árboles.',
    fecha: obtenerFechaRelativa(10),
    hora: '8:00 a.m.',
    lugar: 'Punto de encuentro: parque central',
  },
  {
    tipo: '🎉 Cultural',
    color: '#c9a84c',
    titulo: 'Festival del Día de la Comunidad',
    descripcion: 'Celebración con música en vivo, gastronomía típica y actividades para niños.',
    fecha: obtenerFechaRelativa(30),
    hora: '12:00 m.d.',
    lugar: 'Parque central',
  },
  {
    tipo: '📋 Reunión',
    color: '#4a8c5c',
    titulo: 'Junta Directiva – Sesión Ordinaria',
    descripcion: 'Reunión mensual de la junta directiva. Abierta al público como oyentes.',
    fecha: obtenerFechaRelativa(5),
    hora: '7:00 p.m.',
    lugar: 'Oficina de la Asociación',
  },
];

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

/**
 * Lee y parsea un array almacenado en localStorage.
 * Devuelve [] si la clave no existe o el JSON es inválido.
 * @param {string} key - Clave de localStorage
 * @returns {Array}
 */
function readFromStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
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
  const todas = readFromStorage('adeco_reservas');
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
  const todas = readFromStorage('adeco_reservas');
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
  const lista = readFromStorage('adeco_finanzas');
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
 * Usa datos de muestra ya que no hay CRUD de actividades
 * en el sistema administrativo actual.
 */
function renderActividades() {
  const grid = document.getElementById('activities-grid');
  if (!grid) return;

  grid.innerHTML = SAMPLE_ACTIVITIES.map(act => `
    <div class="activity-card" style="--activity-color: ${act.color}">
      <div class="activity-type" style="background: ${act.color}1a; color: ${act.color}">
        ${act.tipo}
      </div>
      <h4>${act.titulo}</h4>
      <p>${act.descripcion}</p>
      <div class="activity-meta">
        <span>📅 ${act.fecha}</span>
        <span>🕐 ${act.hora}</span>
        <span>📍 ${act.lugar}</span>
      </div>
    </div>
  `).join('');
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
  // Datos dinámicos desde localStorage
  renderHeroStats();
  renderTablaReservas();
  renderCalendario();
  renderActividades();
  renderFinanzas();

  // UI / interacción
  setFooterYear();
  initScrollNav();
  initMobileNav();
  initCalendarNav();

  // Escuchar cambios de storage en otras pestañas (panel admin abierto)
  window.addEventListener('storage', (e) => {
    if (e.key === 'adeco_reservas' || e.key === 'adeco_finanzas') {
      renderHeroStats();
      renderTablaReservas();
      renderCalendario();
      renderFinanzas();
    }
  });
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);