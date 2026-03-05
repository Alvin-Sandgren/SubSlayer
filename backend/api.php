<?php
// Startar session så vi kan läsa user_id
session_start();

// Databasanslutning
require 'db.php';

// All output från denna fil ska vara JSON
header('Content-Type: application/json');

// Kontrollera att användaren är inloggad
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Inte inloggad']);
    exit;
}

// Spara användarens id
$user_id = (int) $_SESSION['user_id'];

// Vilken HTTP-metod som används (GET, POST, DELETE)
$method = $_SERVER['REQUEST_METHOD'];

// HÄMTA PRENUMERATIONER
// GET
if ($method == 'GET') {

    // Hämtar alla prenumerationer för användaren
    $stmt = $conn->prepare("
        SELECT id, service_name, category, amount, currency, period, next_billing_date
        FROM subscriptions
        WHERE user_id = ?
        ORDER BY next_billing_date ASC
    ");

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $result = $stmt->get_result();

    // Skicka tillbaka alla rader som JSON
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));

}
// LÄGG TILL PRENUMERATION
// POST

elseif ($method == 'POST') {
    // Läser JSON som skickas från JavaScript
    $data = json_decode(file_get_contents("php://input"), true);

    // Plocka ut värden
    $service = trim($data['service_name'] ?? '');
    $cat     = trim($data['category'] ?? '');
    $amount  = (float) ($data['amount'] ?? 0);
    $cur     = strtoupper($data['currency'] ?? 'SEK');
    $period  = $data['period'] ?? 'monthly';
    $date    = $data['next_billing_date'] ?? '';

    // Enkel kontroll att viktiga fält finns
    if (!$service || !$amount || !$date) {
        http_response_code(400);
        echo json_encode(['error' => 'Saknar fält']);
        exit;
    }

    // SQL för att lägga till prenumeration
    $stmt = $conn->prepare("
        INSERT INTO subscriptions
        (user_id, service_name, category, amount, currency, period, next_billing_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param("issdsss", $user_id, $service, $cat, $amount, $cur, $period, $date);

    // Kör query
    if ($stmt->execute()) {
        // Skickar tillbaka status + id
        echo json_encode([
            'status' => 'success',
            'id' => $conn->insert_id
        ]);

    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Kunde inte spara']);
    }

}

// TA BORT PRENUMERATION
// DELETE

elseif ($method == 'DELETE') {
    // id skickas via URL
    $id = (int) ($_GET['id'] ?? 0);

    // Ta bort endast om prenumerationen tillhör användaren
    $stmt = $conn->prepare("
        DELETE FROM subscriptions
        WHERE id = ? AND user_id = ?
    ");

    $stmt->bind_param("ii", $id, $user_id);
    $stmt->execute();
    // Kontrollera om något faktiskt togs bort
    if ($stmt->affected_rows > 0) {
        echo json_encode(['status' => 'success']);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Hittades inte']);
    }
}
//fel http metod
else {
    http_response_code(405);
    echo json_encode(['error' => 'Metod ej tillåten']);
}