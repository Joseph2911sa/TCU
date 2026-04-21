<?php
// galeria.php - gestiona la galería leyendo/escribiendo archivos directamente
// Sin base de datos.

header('Content-Type: application/json');
@session_start();

$GALERIA_DIR  = __DIR__ . '/../assets/img/galeria/';
$GALERIA_PATH = 'assets/img/galeria/';
$ALLOWED_EXT  = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: lista archivos de la carpeta ────────────────────────────
if ($method === 'GET') {
    if (!is_dir($GALERIA_DIR)) {
        echo json_encode([]);
        exit;
    }

    $files = scandir($GALERIA_DIR);
    $items = [];

    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (!in_array($ext, $ALLOWED_EXT)) continue;

        $caption = pathinfo($file, PATHINFO_FILENAME);
        // Convierte guiones/guiones bajos en espacios y capitaliza
        $caption = ucfirst(str_replace(['-', '_'], ' ', $caption));

        $items[] = [
            'id'      => $file,           // usamos el nombre del archivo como ID
            'ruta'    => $GALERIA_PATH . $file,
            'caption' => $caption,
        ];
    }

    echo json_encode($items);
    exit;
}

// ── POST: subir nueva imagen (requiere sesión) ────────────────────
if ($method === 'POST') {
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No autorizado']);
        exit;
    }

    if (!empty($_FILES['imagen'])) {
        $file    = $_FILES['imagen'];
        $caption = trim($_POST['caption'] ?? '');

        $allowed_mime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!in_array($file['type'], $allowed_mime)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Tipo de archivo no permitido. Use JPG, PNG, WEBP o GIF.']);
            exit;
        }

        if ($file['size'] > 5 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'El archivo supera el límite de 5 MB.']);
            exit;
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        // Nombre de archivo: usar caption si hay, o nombre original limpio
        if ($caption) {
            $base = preg_replace('/[^a-z0-9]+/', '-', strtolower($caption));
            $base = trim($base, '-');
        } else {
            $base = preg_replace('/[^a-z0-9]+/', '-', strtolower(pathinfo($file['name'], PATHINFO_FILENAME)));
            $base = trim($base, '-');
        }

        // Evitar colisiones de nombre
        $filename = $base . '.' . $ext;
        $dest     = $GALERIA_DIR . $filename;
        $counter  = 1;
        while (file_exists($dest)) {
            $filename = $base . '-' . $counter . '.' . $ext;
            $dest     = $GALERIA_DIR . $filename;
            $counter++;
        }

        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'No se pudo guardar la imagen en el servidor.']);
            exit;
        }

        echo json_encode([
            'success' => true,
            'id'      => $filename,
            'ruta'    => $GALERIA_PATH . $filename,
        ]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No se recibió ningún archivo.']);
    exit;
}

// ── DELETE: eliminar archivo por nombre ──────────────────────────
if ($method === 'DELETE') {
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No autorizado']);
        exit;
    }

    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No se indicó el archivo a eliminar.']);
        exit;
    }

    // Seguridad: solo el nombre del archivo, sin rutas
    $id = basename($id);
    $ext = strtolower(pathinfo($id, PATHINFO_EXTENSION));

    if (!in_array($ext, $ALLOWED_EXT)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Archivo no válido.']);
        exit;
    }

    $filepath = $GALERIA_DIR . $id;

    if (!file_exists($filepath)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Archivo no encontrado.']);
        exit;
    }

    if (!unlink($filepath)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'No se pudo eliminar el archivo.']);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no soportado']);
