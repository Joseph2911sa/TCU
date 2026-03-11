<?php
/**
 * setup.php — Crea o migra las tablas de la DB.
 * Ejecutar UNA VEZ en producción: visita /api/setup.php en el navegador.
 * BORRAR este archivo después de usarlo.
 */
header('Content-Type: text/html; charset=utf-8');
require_once 'db.php';

$results = [];

function runSQL($conn, $label, $sql) {
    if ($conn->query($sql) === TRUE) {
        return "✅ $label";
    } else {
        return "❌ $label — " . $conn->error;
    }
}

function columnExists($conn, $table, $column) {
    $r = $conn->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
    return $r && $r->num_rows > 0;
}

function tableExists($conn, $table) {
    $r = $conn->query("SHOW TABLES LIKE '$table'");
    return $r && $r->num_rows > 0;
}

// ── Tabla usuarios ──────────────────────────────────────────────
if (!tableExists($conn, 'usuarios')) {
    $results[] = runSQL($conn, 'crear tabla usuarios', "
        CREATE TABLE usuarios (
            id       VARCHAR(50)  NOT NULL PRIMARY KEY,
            usuario  VARCHAR(50)  NOT NULL UNIQUE,
            PASSWORD VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
} else {
    $results[] = "ℹ️ tabla usuarios ya existe";
}

// Insertar usuario admin por defecto si no existe
$userCol = 'usuario';
$colCheck = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'username'");
if ($colCheck && $colCheck->num_rows > 0) $userCol = 'username';

$check = $conn->query("SELECT id FROM usuarios WHERE `$userCol` = 'admin' LIMIT 1");
if ($check && $check->num_rows === 0) {
    // Intentar insertar con columna que exista
    $idCol = columnExists($conn, 'usuarios', 'id') ? "id, " : "";
    $idVal = columnExists($conn, 'usuarios', 'id') ? "'admin_001', " : "";
    $pwdCol = $userCol === 'username' ? 'username' : 'usuario';
    $results[] = runSQL($conn, 'usuario admin por defecto',
        "INSERT INTO usuarios ({$idCol}`$pwdCol`, PASSWORD) VALUES ({$idVal}'admin', '1234')");
} else {
    $results[] = "ℹ️ usuario admin ya existe";
}

// ── Tabla finanzas ──────────────────────────────────────────────
if (!tableExists($conn, 'finanzas')) {
    $results[] = runSQL($conn, 'crear tabla finanzas', "
        CREATE TABLE finanzas (
            id          VARCHAR(50)   NOT NULL PRIMARY KEY,
            fecha       DATE          NOT NULL,
            tipo        VARCHAR(20)   NOT NULL,
            categoria   VARCHAR(100)  NOT NULL,
            descripcion TEXT,
            monto       DECIMAL(12,2) NOT NULL,
            activo      TINYINT       NOT NULL DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
} else {
    $results[] = "ℹ️ tabla finanzas ya existe";
    if (!columnExists($conn, 'finanzas', 'activo'))
        $results[] = runSQL($conn, 'agregar finanzas.activo',
            "ALTER TABLE finanzas ADD COLUMN activo TINYINT NOT NULL DEFAULT 1");
}

// ── Tabla reservas ──────────────────────────────────────────────
if (!tableExists($conn, 'reservas')) {
    $results[] = runSQL($conn, 'crear tabla reservas', "
        CREATE TABLE reservas (
            id          VARCHAR(50)  NOT NULL PRIMARY KEY,
            fecha       DATE         NOT NULL,
            nombre      VARCHAR(100) NOT NULL,
            telefono    VARCHAR(20)  NOT NULL,
            espacio     VARCHAR(100) NOT NULL,
            estado      VARCHAR(20)  NOT NULL DEFAULT 'Confirmada',
            notas       TEXT,
            hora_inicio TIME,
            hora_fin    TIME,
            activo      TINYINT      NOT NULL DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
} else {
    $results[] = "ℹ️ tabla reservas ya existe";
    // Renombrar actividad → espacio si corresponde
    if (columnExists($conn, 'reservas', 'actividad') && !columnExists($conn, 'reservas', 'espacio'))
        $results[] = runSQL($conn, 'renombrar reservas.actividad → espacio',
            "ALTER TABLE reservas CHANGE COLUMN actividad espacio VARCHAR(100) NOT NULL");
    if (!columnExists($conn, 'reservas', 'activo'))
        $results[] = runSQL($conn, 'agregar reservas.activo',
            "ALTER TABLE reservas ADD COLUMN activo TINYINT NOT NULL DEFAULT 1");
    if (!columnExists($conn, 'reservas', 'notas'))
        $results[] = runSQL($conn, 'agregar reservas.notas',
            "ALTER TABLE reservas ADD COLUMN notas TEXT NULL");
    if (!columnExists($conn, 'reservas', 'hora_inicio'))
        $results[] = runSQL($conn, 'agregar reservas.hora_inicio',
            "ALTER TABLE reservas ADD COLUMN hora_inicio TIME NULL");
    if (!columnExists($conn, 'reservas', 'hora_fin'))
        $results[] = runSQL($conn, 'agregar reservas.hora_fin',
            "ALTER TABLE reservas ADD COLUMN hora_fin TIME NULL");
}

// ── Tabla actividades ───────────────────────────────────────────
if (!tableExists($conn, 'actividades')) {
    $results[] = runSQL($conn, 'crear tabla actividades', "
        CREATE TABLE actividades (
            id          VARCHAR(50)  NOT NULL PRIMARY KEY,
            titulo      VARCHAR(200) NOT NULL,
            fecha       DATE         NOT NULL,
            hora        TIME,
            lugar       VARCHAR(200),
            descripcion TEXT,
            activo      TINYINT      NOT NULL DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
} else {
    $results[] = "ℹ️ tabla actividades ya existe";
    if (!columnExists($conn, 'actividades', 'activo'))
        $results[] = runSQL($conn, 'agregar actividades.activo',
            "ALTER TABLE actividades ADD COLUMN activo TINYINT NOT NULL DEFAULT 1");
}

// ── Verificación final ──────────────────────────────────────────
$tables = [];
$res = $conn->query("SHOW TABLES");
while ($row = $res->fetch_array()) {
    $tables[] = $row[0];
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Setup BD — ADECO</title>
<style>
  body { font-family: sans-serif; padding: 2rem; max-width: 600px; margin: auto; }
  h1   { color: #2d6a4f; }
  li   { padding: .3rem 0; font-size: 1.05rem; }
  .ok  { color: green; }
  .err { color: red;   }
  .warn{ color: orange;}
  pre  { background: #f4f4f4; padding: 1rem; border-radius: 6px; }
</style>
</head>
<body>
<h1>🔧 Setup de Base de Datos — ADECO</h1>
<ul>
<?php foreach ($results as $r): ?>
  <li><?= htmlspecialchars($r) ?></li>
<?php endforeach; ?>
</ul>
<hr>
<h2>Tablas existentes</h2>
<pre><?= implode("\n", array_map('htmlspecialchars', $tables)) ?></pre>
<p style="color:red"><strong>⚠️ IMPORTANTE:</strong> Elimina o renombra este archivo (setup.php) una vez que las tablas estén creadas.</p>
</body>
</html>
