<?php
// contacto.php - lee y escribe datos de contacto directamente en index.html
// Sin base de datos.

header('Content-Type: application/json');
session_start();

// InfinityFree a veces bloquea session_start() si hay output previo
// Silenciar errores de sesión
@session_start();

$INDEX = __DIR__ . '/../index.html';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: extraer valores actuales del index.html ─────────────────
if ($method === 'GET') {

    if (!file_exists($INDEX)) {
        echo json_encode(['success' => false, 'error' => 'index.html no encontrado en: ' . $INDEX]);
        exit;
    }

    $html = @file_get_contents($INDEX);
    if ($html === false) {
        echo json_encode(['success' => false, 'error' => 'Sin permiso para leer index.html']);
        exit;
    }

    function extractById($html, $id) {
        $pattern = '/<p[^>]+id="' . preg_quote($id, '/') . '"[^>]*>(.*?)<\/p>/s';
        if (preg_match($pattern, $html, $m)) {
            return trim(strip_tags($m[1]));
        }
        $pattern2 = '/<span[^>]+id="' . preg_quote($id, '/') . '"[^>]*>(.*?)<\/span>/s';
        if (preg_match($pattern2, $html, $m)) {
            return trim(strip_tags($m[1]));
        }
        return '';
    }

    echo json_encode([
        'success'     => true,
        'telefono'    => extractById($html, 'pub-ct-telefono'),
        'correo'      => extractById($html, 'pub-ct-correo'),
        'direccion'   => extractById($html, 'pub-ct-direccion'),
        'horario'     => extractById($html, 'pub-ct-horario'),
        'descripcion' => extractById($html, 'pub-ct-descripcion'),
        'mision'      => extractById($html, 'pub-ct-mision'),
        'vision'      => extractById($html, 'pub-ct-vision'),
        'valores'     => extractById($html, 'pub-ct-valores'),
    ]);
    exit;
}

// ── POST: requiere sesión, escribe en index.html ──────────────────
if ($method === 'POST') {
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No autorizado']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!file_exists($INDEX)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'index.html no encontrado en: ' . $INDEX]);
        exit;
    }

    $html = @file_get_contents($INDEX);
    if ($html === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Sin permiso para leer index.html']);
        exit;
    }

    if (!is_writable($INDEX)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'index.html no tiene permisos de escritura']);
        exit;
    }

    function replaceById(&$html, $id, $newValue) {
        $safe = htmlspecialchars($newValue, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $pattern = '/(<p[^>]+id="' . preg_quote($id, '/') . '"[^>]*>).*?(<\/p>)/s';
        if (preg_match($pattern, $html)) {
            $html = preg_replace($pattern, '${1}' . $safe . '${2}', $html);
            return true;
        }
        $pattern2 = '/(<span[^>]+id="' . preg_quote($id, '/') . '"[^>]*>).*?(<\/span>)/s';
        if (preg_match($pattern2, $html)) {
            $html = preg_replace($pattern2, '${1}' . $safe . '${2}', $html);
            return true;
        }
        return false;
    }

    $fields = [
        'pub-ct-telefono'    => $input['telefono']    ?? null,
        'pub-ct-correo'      => $input['correo']      ?? null,
        'pub-ct-direccion'   => $input['direccion']   ?? null,
        'pub-ct-horario'     => $input['horario']     ?? null,
        'pub-ct-descripcion' => $input['descripcion'] ?? null,
        'pub-ct-mision'      => $input['mision']      ?? null,
        'pub-ct-vision'      => $input['vision']      ?? null,
        'pub-ct-valores'     => $input['valores']     ?? null,
        'footer-ct-telefono' => $input['telefono']    ?? null,
        'footer-ct-correo'   => $input['correo']      ?? null,
    ];

    foreach ($fields as $id => $value) {
        if ($value !== null && $value !== '') {
            replaceById($html, $id, $value);
        }
    }

    if (@file_put_contents($INDEX, $html) === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'No se pudo escribir en index.html. Sin permisos de escritura.']);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no soportado']);
