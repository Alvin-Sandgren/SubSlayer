<?php
// Tysta varningar i CLI om man vill, men bättre att fixa koden
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../composer/vendor/autoload.php';
require_once __DIR__ . '/db.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// --- 1. Initiera variabler ---
$sentCount = 0; // Fixar "Undefined variable"-felet
$errors = [];
$today = date('Y-m-d');

// --- 2. Hämta data ---
$sql = "SELECT s.id, u.email, s.service_name, s.amount 
        FROM subscriptions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.next_billing_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) 
        AND (s.last_reminder_sent IS NULL OR s.last_reminder_sent < CURDATE())";

$result = $conn->query($sql);

// --- 3. Loopa och skicka ---
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        if (sendReminder($row['email'], $row['service_name'], $row['amount'], $row['currency'], $row['next_billing_date'])) {
            $sentCount++;
            
            // Uppdatera databasen så vi inte skickar igen idag (om du lagt till kolumnen)
            // $conn->query("UPDATE subscriptions SET last_reminder_sent = CURDATE() WHERE id = " . $row['id']);
        } else {
            $errors[] = "Misslyckades med: " . $row['service_name'];
        }
    }
}

// --- 4. Output (JSON) ---
// Vi skickar bara header om vi INTE kör via terminalen (för att undvika varningar)
if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json');
}

echo json_encode([
    "status" => empty($errors) ? "success" : "partial_error",
    "emails_sent" => $sentCount,
    "errors" => $errors,
    "timestamp" => date('Y-m-d H:i:s')
], JSON_PRETTY_PRINT);


// --- Funktionen ---
function sendReminder($toEmail, $service, $amount, $currency, $date) {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = '127.0.0.1';
        $mail->Port = 1025;
        $mail->SMTPAuth = false;

        $mail->setFrom('noreply@subslayer.test', 'SubSlayer');
        $mail->addAddress($toEmail);
        $mail->isHTML(true);
        $mail->Subject = "Paminnelse: $service";
        $mail->Body = "
            <div style='font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; max-width: 600px;'>
                <h2 style='color: #2c3e50;'>Dags för förnyelse!</h2>
                <p>Hej,</p>
                <p>Vi ville bara påminna dig om att din prenumeration på <strong>$service</strong> förnyas snart.</p>
                <div style='background-color: #f9f9f9; padding: 15px; border-radius: 5px;'>
                    <p style='margin: 5px 0;'><strong>Tjänst:</strong> $service</p>
                    <p style='margin: 5px 0;'><strong>Pris:</strong> $amount $currency</p>
                    <p style='margin: 5px 0;'><strong>Datum:</strong> $date</p>
                </div>
                <p>Hälsningar,<br>Team SubSlayer</p>
            </div>
        ";

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}

// Skapa ett logg-meddelande
$logEntry = "[" . date('Y-m-d H:i:s') . "] Skickat: $sentCount st mail. Fel: " . count($errors) . PHP_EOL;

// Skriv till filen (FILE_APPEND gör att den inte skriver över gammal logg)
file_put_contents(__DIR__ . '/cron_log.txt', $logEntry, FILE_APPEND);