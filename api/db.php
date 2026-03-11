<?php

$serverName = $_SERVER['SERVER_NAME'] ?? 'localhost';
$isLocal = in_array($serverName, ['localhost', '127.0.0.1', '::1']);

if ($isLocal) {
    $host     = 'localhost';
    $user     = 'root';
    $password = '';
    $database = 'adeco';
} else {
    $host     = 'sql105.infinityfree.com';
    $user     = 'if0_41359193';
    $password = 'diU3xTC0kfw26';
    $database = 'if0_41359193_adeco';
}

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

$conn->set_charset("utf8");

?>