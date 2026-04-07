<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Inte inloggad']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];
$method  = $_SERVER['REQUEST_METHOD'];

// GET – hämta lönen
if ($method === 'GET') {
    $stmt = $conn->prepare("SELECT monthly_salary FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    echo json_encode(['monthly_salary' => $row['monthly_salary']]);

// PUT – spara/uppdatera lönen
} elseif ($method === 'PUT') {
    $data   = json_decode(file_get_contents("php://input"), true);
    $salary = isset($data['monthly_salary']) ? (float) $data['monthly_salary'] : null;

    if ($salary === null || $salary < 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Ogiltig lön']);
        exit;
    }

    $stmt = $conn->prepare("UPDATE users SET monthly_salary = ? WHERE id = ?");
    $stmt->bind_param("di", $salary, $user_id);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'monthly_salary' => $salary]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Kunde inte spara']);
    }

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Metod ej tillåten']);
}

?>