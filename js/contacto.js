// contacto.js — Módulo de Información y Contacto (panel admin)

async function loadContacto() {
  try {
    const res  = await fetch('../api/contacto.php');
    const data = await res.json();
    if (!data.success) return;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    set('ct-telefono',    data.telefono);
    set('ct-correo',      data.correo);
    set('ct-direccion',   data.direccion);
    set('ct-horario',     data.horario);
    set('ct-descripcion', data.descripcion);
    set('ct-mision',      data.mision);
    set('ct-vision',      data.vision);
    set('ct-valores',     data.valores);
  } catch (e) {
    toast('Error al cargar la información de contacto.', 'error');
  }
}
window.loadContacto = loadContacto;

async function saveContacto() {
  const get = id => document.getElementById(id)?.value.trim() || '';

  const payload = {
    telefono:    get('ct-telefono'),
    correo:      get('ct-correo'),
    direccion:   get('ct-direccion'),
    horario:     get('ct-horario'),
    descripcion: get('ct-descripcion'),
    mision:      get('ct-mision'),
    vision:      get('ct-vision'),
    valores:     get('ct-valores'),
  };

  try {
    const res  = await fetch('../api/contacto.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      toast('Información actualizada correctamente.', 'success');
    } else {
      toast('Error: ' + (data.error || 'No se pudo guardar.'), 'error');
    }
  } catch (e) {
    toast('Error de conexión al guardar.', 'error');
  }
}
window.saveContacto = saveContacto;
