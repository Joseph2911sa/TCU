<?php
// actividades.php - endpoint REST para actividades comunitarias

header('Content-Type: application/json');
session_start();
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET' && empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

if ($method === 'GET') {
    $result = $conn->query('SELECT * FROM actividades WHERE activo = 1 ORDER BY fecha ASC, hora ASC');

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
    $titulo = $input['titulo'] ?? null;
    $fecha = $input['fecha'] ?? null;
    $hora = $input['hora'] ?? null;
    $lugar = $input['lugar'] ?? null;
    $descripcion = $input['descripcion'] ?? '';
    $id = $input['id'] ?? null;

    if (!$titulo || !$fecha || !$hora || !$lugar) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Faltan campos obligatorios']);
        exit;
    }

    $exists = false;

    if ($id) {
        $checkStmt = $conn->prepare('SELECT id FROM actividades WHERE id = ? LIMIT 1');

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
        $stmt = $conn->prepare('UPDATE actividades SET titulo=?, fecha=?, hora=?, lugar=?, descripcion=? WHERE id=?');

        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $conn->error]);
            exit;
        }

        $stmt->bind_param('ssssss', $titulo, $fecha, $hora, $lugar, $descripcion, $id);

        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $stmt->error]);
            exit;
        }

        echo json_encode(['success' => true]);
        exit;
    } else {
        if (!$id) {
            $id = uniqid('act_', true);
        }

        $stmt = $conn->prepare('INSERT INTO actividades (id, titulo, fecha, hora, lugar, descripcion) VALUES (?,?,?,?,?,?)');

        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $conn->error]);
            exit;
        }

        $stmt->bind_param('ssssss', $id, $titulo, $fecha, $hora, $lugar, $descripcion);

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

    $stmt = $conn->prepare('UPDATE actividades SET activo = 0 WHERE id=?');

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
