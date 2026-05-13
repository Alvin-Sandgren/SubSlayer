<?php
// global-stats.php - Publik endpoint med live-valutakurser
require_once 'db.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'error' => 'Method Not Allowed']);
    exit;
}

// 1. Hämta live-kurser från Frankfurter (med SEK som bas)
// Vi sätter SEK som bas för att matcha din frontend-logik
$rates = ['SEK' => 1.0];
try {
    $ctx = stream_context_create(['http' => ['timeout' => 2]]); // Snabb timeout
    $frankfurterJson = @file_get_contents('https://api.frankfurter.dev/v1/latest?base=SEK', false, $ctx);
    
    if ($frankfurterJson) {
        $data = json_decode($frankfurterJson, true);
        if (isset($data['rates'])) {
            // Frankfurter ger oss t.ex. 1 SEK = 0.087 EUR. 
            // För att räkna OM till SEK (X * kurs) behöver vi 1 / kurs.
            foreach ($data['rates'] as $currency => $rate) {
                $rates[$currency] = 1 / $rate;
            }
        }
    }
} catch (Exception $e) {
    // Om API:et ligger nere faller vi tillbaka på dina fasta värden som backup
    $rates = ['SEK' => 1.0, 'EUR' => 11.50, 'USD' => 10.50];
}

// 2. Hämta prenumerationer från databasen
$query = "SELECT service_name, amount, currency, period FROM subscriptions";
$result = $conn->query($query);

if (!$result) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'error' => 'Database error']);
    exit;
}

$subscriptions = [];

while ($row = $result->fetch_assoc()) {
    $amount = floatval($row['amount']);
    $currency = strtoupper($row['currency']);
    
    // Konvertera till SEK via Frankfurter-kursen
    $rate = isset($rates[$currency]) ? $rates[$currency] : 1.0;
    $amountInSek = $amount * $rate;
    
    // Normalisera till månadskostnad
    if ($row['period'] === 'yearly') {
        $amountInSek = $amountInSek / 12;
    }
    
    $subscriptions[] = [
        'service' => $row['service_name'],
        'monthly_cost_sek' => round($amountInSek, 2)
    ];
}

// 3. Sortera och returnera topp 10
usort($subscriptions, function($a, $b) {
    return $b['monthly_cost_sek'] <=> $a['monthly_cost_sek'];
});

echo json_encode([
    'status' => 'success',
    'data' => array_slice($subscriptions, 0, 10)
]);