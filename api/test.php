<?php
header('Content-Type: application/json');
session_start();
require_once 'db.php';

$response = [
    'db_connected' => !$conn->connect_error,
    'session_active' => session_status() === PHP_SESSION_ACTIVE,
    'session_user_id' => $_SESSION['user_id'] ?? null,
    'usuarios_columns' => [],
    'counts' => [
        'usuarios' => null,
        'finanzas' => null,
        'reservas' => null,
        'actividades' => null,
    ],
];

$columns = $conn->query('SHOW COLUMNS FROM usuarios');
if ($columns) {
    while ($row = $columns->fetch_assoc()) {
        $response['usuarios_columns'][] = $row['Field'];
    }
}

foreach (['usuarios', 'finanzas', 'reservas', 'actividades'] as $tableName) {
    $result = $conn->query("SELECT COUNT(*) AS total FROM {$tableName}");
    if ($result) {
        $row = $result->fetch_assoc();
        $response['counts'][$tableName] = (int) $row['total'];
    }
}

echo json_encode($response);