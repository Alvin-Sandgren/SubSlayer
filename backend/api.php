<?php
// Startar session så vi kan läsa user_id som sparades vid inloggning
session_start();

// Inkludera databasanslutningen från db.php
require 'db.php';

// All output från denna fil ska vara JSON
header('Content-Type: application/json');

// Kontrollera att användaren är inloggad – annars returnera 401 och avbryt
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Inte inloggad']);
    exit;
}

// Spara användarens id som ett heltal (skydd mot injection)
$user_id = (int) $_SESSION['user_id'];

// Läs vilken HTTP-metod som används (GET, POST, PUT, DELETE)
$method = $_SERVER['REQUEST_METHOD'];

// GET – Hämta alla prenumerationer för användaren

if ($method == 'GET') {
    // Hämta prenumerationer sorterade på nästa förfallodatum (tidigast först)
    $stmt = $conn->prepare("
        SELECT id, service_name, category, amount, currency, period, next_billing_date
        FROM subscriptions
        WHERE user_id = ?
        ORDER BY next_billing_date ASC
    ");

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $result = $stmt->get_result();

    // Returnera alla rader som JSON-array
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));

// POST – Lägg till en ny prenumeration
} elseif ($method == 'POST') {

    // Läs JSON-kroppen som skickas från JavaScript
    $data = json_decode(file_get_contents("php://input"), true);

    // Plocka ut och rensa värdena från JSON-datan
    $service = trim($data['service_name'] ?? '');
    $cat     = trim($data['category'] ?? '');
    $amount  = (float) ($data['amount'] ?? 0);
    $cur     = strtoupper($data['currency'] ?? 'SEK');
    $period  = $data['period'] ?? 'monthly';
    $date    = $data['next_billing_date'] ?? '';

    // Kontrollera att de obligatoriska fälten finns – annars returnera 400
    if (!$service || !$amount || !$date) {
        http_response_code(400);
        echo json_encode(['error' => 'Saknar fält']);
        exit;
    }

    // Infoga ny prenumeration kopplad till inloggad användare
    $stmt = $conn->prepare("
        INSERT INTO subscriptions
        (user_id, service_name, category, amount, currency, period, next_billing_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param("issdsss", $user_id, $service, $cat, $amount, $cur, $period, $date);

    if ($stmt->execute()) {
        // Returnera framgångsstatus och det nya postens id
        echo json_encode([
            'status' => 'success',
            'id'     => $conn->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Kunde inte spara']);
    }

// DELETE – Ta bort en prenumeration
} elseif ($method == 'DELETE') {
    // Id skickas som URL-parameter, t.ex. api.php?id=5
    $id = (int) ($_GET['id'] ?? 0);

    // Ta bara bort om prenumerationen tillhör den inloggade användaren
    $stmt = $conn->prepare("
        DELETE FROM subscriptions
        WHERE id = ? AND user_id = ?
    ");

    $stmt->bind_param("ii", $id, $user_id);
    $stmt->execute();

    // Kontrollera om något faktiskt raderades
    if ($stmt->affected_rows > 0) {
        echo json_encode(['status' => 'success']);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Hittades inte']);
    }

// PUT – Uppdatera kostnad och valuta för en prenumeration
} elseif ($method === 'PUT') {

    // Id skickas som URL-parameter
    $id   = (int) ($_GET['id'] ?? 0);
    $data = json_decode(file_get_contents("php://input"), true);

    // Plocka ut nya värden för belopp och valuta
    $amount = (float) ($data['amount']   ?? 0);
    $cur    = strtoupper($data['currency'] ?? 'SEK');

    // Kontrollera att id och belopp finns
    if (!$id || !$amount) {
        http_response_code(400);
        echo json_encode(['error' => 'Saknar fält']);
        exit;
    }

    // Uppdatera prenumerationen – bara om den tillhör inloggad användare
    $stmt = $conn->prepare("
        UPDATE subscriptions
        SET amount = ?, currency = ?
        WHERE id = ? AND user_id = ?
    ");

    $stmt->bind_param("dsii", $amount, $cur, $id, $user_id);

    if ($stmt->execute() && $stmt->affected_rows > 0) {
        echo json_encode(['status' => 'success']);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Kunde inte uppdatera']);
    }

// Felaktig HTTP-metod

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Metod ej tillåten']);
}
?>