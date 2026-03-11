/* ═══════════════════════════════════════════════════════════════
   ADECO · Sistema de Gestión Comunitaria
   Archivo: js/auth.js
   Descripción: Lógica de autenticación (login y logout).
                Depende de: storage.js (para finanzas/reservas)
                            app.js     (para updateDashboard,
                                        renderFinanzas, renderSalon)
════════════════════════════════════════════════════════════════ */

/* ─── LOGIN ─── */

/**
 * Valida las credenciales ingresadas y, si son correctas,
 * oculta la pantalla de login y muestra la aplicación.
 * Se llama desde el onclick del botón "Ingresar" en index.html.
 */
async function doLogin() {
  const usuario = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;
  const errorEl = document.getElementById('login-error');

  errorEl.style.display = 'none';

  try {
    const data = await window.api.login({ usuario, password });

    if (data.success) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app').style.display = 'block';

      // cargar datos desde la BD (loadData() muestra su propio toast si falla)
      if (typeof window.loadData === 'function') {
        window.loadData();
      }
    } else {
      errorEl.style.display = 'block';
    }
  } catch (e) {
    console.error('login error', e);
    window.toast(e.message || 'No se pudo iniciar sesion.', 'error');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
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