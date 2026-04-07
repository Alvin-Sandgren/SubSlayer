<?php
// Starta sessionen för att komma åt user_id
session_start();

// Inkludera databasanslutningen
require 'db.php';

// All output ska vara JSON
header('Content-Type: application/json');

// Kontrollera att användaren är inloggad – annars returnera 401 och avbryt
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Inte inloggad']);
    exit;
}

// Spara användarens id som heltal
$user_id = (int) $_SESSION['user_id'];
$method  = $_SERVER['REQUEST_METHOD'];


// GET – Hämta sparad månadslön för användaren
if ($method === 'GET') {
    $stmt = $conn->prepare("SELECT monthly_salary FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $row = $stmt->get_result()->fetch_assoc();

    // Returnera lönen som JSON (kan vara null om ingen lön sparats)
    echo json_encode(['monthly_salary' => $row['monthly_salary']]);


// PUT – Spara eller uppdatera månadslön
} elseif ($method === 'PUT') {

    // Läs JSON-kroppen från requesten
    $data   = json_decode(file_get_contents("php://input"), true);
    $salary = isset($data['monthly_salary']) ? (float) $data['monthly_salary'] : null;

    // Kontrollera att lönen är ett giltigt positivt tal
    if ($salary === null || $salary < 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Ogiltig lön']);
        exit;
    }

    // Uppdatera lönen i databasen för inloggad användare
    $stmt = $conn->prepare("UPDATE users SET monthly_salary = ? WHERE id = ?");
    $stmt->bind_param("di", $salary, $user_id);

    if ($stmt->execute()) {
        // Returnera framgångsstatus och den sparade lönen
        echo json_encode(['status' => 'success', 'monthly_salary' => $salary]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Kunde inte spara']);
    }

// Felaktig HTTP-metod
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Metod ej tillåten']);
}
?>