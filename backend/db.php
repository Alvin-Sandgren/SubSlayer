<?php
// Sökväg till ini-filen (tre steg upp från backend-mappen till laragon-mappen)
$ini_path = __DIR__ . '/../../../config.projects/conf.ini';

// Läsa in ini-filen
$config = parse_ini_file($ini_path, true);

if (!$config) {
    die("Kunde inte läsa konfigurationsfilen på: " . $ini_path);
}

// Hämta uppgifter från den inlästa arrayen
$host     = $config['database']['host'];
$username = $config['database']['username'];
$password = $config['database']['password'];
$dbname   = $config['database']['dbname'];

// Skapa anslutning med MySQLi
$conn = new mysqli($host, $username, $password, $dbname);

// Kontrollera om anslutningen misslyckades
if ($conn->connect_error) {
    die("Anslutning misslyckades: " . $conn->connect_error);
}

// Ange teckenkodning UTF-8
$conn->set_charset("utf8mb4");
?>