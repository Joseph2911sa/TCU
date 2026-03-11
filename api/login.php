<?php
// login.php - valida credenciales contra la tabla `usuarios`

header('Content-Type: application/json');
session_start();
require_once 'db.php'; // define $conn

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$usuario = $conn->real_escape_string($input['usuario'] ?? '');
$password = $conn->real_escape_string($input['password'] ?? '');

if (!$usuario || !$password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Faltan credenciales']);
    exit;
}

$userColumn = 'username';
$columnCheck = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'username'");

if (!$columnCheck || $columnCheck->num_rows === 0) {
    $userColumn = 'usuario';
}

$stmt = $conn->prepare("SELECT id, password FROM usuarios WHERE {$userColumn} = ?");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'No se pudo preparar la consulta de login']);
    exit;
}

$stmt->bind_param('s', $usuario);
$stmt->execute();
$stmt->bind_result($id, $hash);

if ($stmt->fetch()) {
    // aquí se asume contraseña sin hash; en producción se usaría password_verify
    if ($password === $hash) {
        $_SESSION['user_id'] = $id;
        echo json_encode(['success' => true]);
        exit;
    }
}

http_response_code(401);
echo json_encode(['success' => false, 'error' => 'Credenciales inválidas']);
