<?php
// finanzas.php - endpoint REST para el módulo de finanzas

header('Content-Type: application/json');
session_start();
require_once 'db.php'; // usa $conn

$method = $_SERVER['REQUEST_METHOD'];

// Solo escritura requiere sesión; lectura pública está permitida.
if ($method !== 'GET' && empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

if ($method === 'GET') {
    $result = $conn->query('SELECT * FROM finanzas WHERE activo = 1 ORDER BY fecha DESC');

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
    $tipo = $input['tipo'] ?? null;
    $categoria = $input['categoria'] ?? null;
    $descripcion = $input['descripcion'] ?? '';
    $monto = $input['monto'] ?? null;
    $id = $input['id'] ?? null;

    if (!$fecha || !$tipo || !$categoria || $monto === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Faltan campos obligatorios']);
        exit;
    }

    $exists = false;

    if ($id) {
        $checkStmt = $conn->prepare('SELECT id FROM finanzas WHERE id = ? LIMIT 1');

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
        $stmt = $conn->prepare('UPDATE finanzas SET fecha=?, tipo=?, categoria=?, descripcion=?, monto=? WHERE id=?');

        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $conn->error]);
            exit;
        }

        $stmt->bind_param('ssssds', $fecha, $tipo, $categoria, $descripcion, $monto, $id);

        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $stmt->error]);
            exit;
        }

        echo json_encode(['success' => true]);
        exit;
    } else {
        if (!$id) {
            $id = uniqid('fin_', true);
        }

        $stmt = $conn->prepare('INSERT INTO finanzas (id, fecha, tipo, categoria, descripcion, monto) VALUES (?,?,?,?,?,?)');

        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $conn->error]);
            exit;
        }

        $stmt->bind_param('sssssd', $id, $fecha, $tipo, $categoria, $descripcion, $monto);

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

    $stmt = $conn->prepare('UPDATE finanzas SET activo = 0 WHERE id=?');

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
