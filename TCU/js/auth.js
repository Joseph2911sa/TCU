/* ═══════════════════════════════════════════════════════════════
   ADECO · Sistema de Gestión Comunitaria
   Archivo: js/auth.js
   Descripción: Lógica de autenticación (login y logout).
                Depende de: storage.js (para finanzas/reservas)
                            app.js     (para updateDashboard,
                                        renderFinanzas, renderSalon)
════════════════════════════════════════════════════════════════ */

/* ─── CREDENCIALES DEMO ─── */
// En un sistema real estas credenciales se validarían contra
// una base de datos usando contraseñas hasheadas (bcrypt, etc.).
const VALID_USER     = 'admin';
const VALID_PASSWORD = '1234';

/* ─── LOGIN ─── */

/**
 * Valida las credenciales ingresadas y, si son correctas,
 * oculta la pantalla de login y muestra la aplicación.
 * Se llama desde el onclick del botón "Ingresar" en index.html.
 */
function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errorEl = document.getElementById('login-error');

  if (user === VALID_USER && pass === VALID_PASSWORD) {
    // Credenciales correctas: mostrar app
    errorEl.style.display = 'none';
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    // Inicializar vistas con los datos persistidos
    updateDashboard();
    renderFinanzas();
    renderSalon();
  } else {
    // Credenciales incorrectas: mostrar mensaje de error
    errorEl.style.display = 'block';
  }
}

/* ─── LOGOUT ─── */

/**
 * Cierra la sesión del usuario: oculta la app,
 * muestra el login y limpia los campos del formulario.
 * Se llama desde el botón "Cerrar sesión" en el sidebar.
 */
function logout() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').style.display = 'none';
}

/* ─── ACCESO POR TECLADO ─── */

// Permite hacer login presionando Enter en el campo de contraseña
document.getElementById('login-pass').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') doLogin();
});