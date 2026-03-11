<?php
// reservas.php - endpoint REST para reservas de salón comunal

header('Content-Type: application/json');
session_start();
require_once 'db.php';

function column_exists($conn, $table, $column) {
    $table = $conn->real_escape_string($table);
    $column = $conn->real_escape_string($column);
    $result = $conn->query("SHOW COLUMNS FROM `{$table}` LIKE '{$column}'");
    return $result && $result->num_rows > 0;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET' && empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}
$actividadColumn = column_exists($conn, 'reservas', 'espacio') ? 'espacio' : 'actividad';
$hasActivo = column_exists($conn, 'reservas', 'activo');
$hasNotas = column_exists($conn, 'reservas', 'notas');
$hasHoraInicio = column_exists($conn, 'reservas', 'hora_inicio');
$hasHoraFin = column_exists($conn, 'reservas', 'hora_fin');

if ($method === 'GET') {
    $selectFields = [
        'id',
        'nombre',
        'telefono',
        "{$actividadColumn} AS actividad",
        'fecha',
        'estado',
        $hasNotas ? 'notas' : 'NULL AS notas',
        $hasHoraInicio ? 'hora_inicio' : 'NULL AS hora_inicio',
        $hasHoraFin ? 'hora_fin' : 'NULL AS hora_fin',
    ];
    $whereClause = $hasActivo ? ' WHERE activo = 1' : '';
    $sql = 'SELECT ' . implode(', ', $selectFields) . ' FROM reservas' . $whereClause . ' ORDER BY fecha ASC';
    $result = $conn->query($sql);

    if (!$result) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $conn->error]);
        exit;
    }

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    echo json_encode($data);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $fecha = $input['fecha'] ?? null;
    $nombre = $input['nombre'] ?? null;
    $telefono = $input['telefono'] ?? null;
    $espacio = $input['actividad'] ?? ($input['espacio'] ?? null);
    $estado = $input['estado'] ?? 'Confirmada';
    $id = $input['id'] ?? null;

    if (!$fecha || !$nombre || !$telefono || !$espacio) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Faltan campos obligatorios']);
        exit;
    }

    $exists = false;

    if ($id) {
        $checkStmt = $conn->prepare('SELECT id FROM reservas WHERE id = ? LIMIT 1');

        if (!$checkStmt) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $conn->error]);
            exit;
        }

        $checkStmt->bind_param('s', $id);

        if (!$checkStmt->execute()) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $checkStmt->error]);
            exit;
        }

        $checkResult = $checkStmt->get_result();
        $exists = $checkResult && $checkResult->num_rows > 0;
    }

    if ($exists) {
        $stmt = $conn->prepare("UPDATE reservas SET fecha=?, nombre=?, telefono=?, {$actividadColumn}=?, estado=? WHERE id=?");

        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $conn->error]);
            exit;
        }

        $stmt->bind_param('ssssss', $fecha, $nombre, $telefono, $espacio, $estado, $id);

        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $stmt->error]);
            exit;
        }

        echo json_encode(['success' => true]);
        exit;
    } else {
        if (!$id) {
            $id = uniqid('res_', true);
        }

        $stmt = $conn->prepare("INSERT INTO reservas (id, fecha, nombre, telefono, {$actividadColumn}, estado) VALUES (?,?,?,?,?,?)");

        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $conn->error]);
            exit;
        }

        $stmt->bind_param('ssssss', $id, $fecha, $nombre, $telefono, $espacio, $estado);

        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $stmt->error]);
            exit;
        }

        echo json_encode(['success' => true, 'id' => $id]);
        exit;
    }
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No se indicó id']);
        exit;
    }

    $deleteSql = $hasActivo
        ? 'UPDATE reservas SET activo = 0 WHERE id=?'
        : 'DELETE FROM reservas WHERE id=?';
    $stmt = $conn->prepare($deleteSql);

    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $conn->error]);
        exit;
    }

    $stmt->bind_param('s', $id);

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $stmt->error]);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no soportado']);
