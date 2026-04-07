<?php
// Databasuppgifter 
$host     = 'localhost'; // Databasens värdnamn
$username = 'root';      // MySQL-användarnamn
$password = '';          // MySQL-lösenord (tomt i lokal miljö)
$dbname   = 'SubSlayer'; // Databasens namn

// Skapa anslutning med MySQLi
$conn = new mysqli($host, $username, $password, $dbname);

// Kontrollera om anslutningen misslyckades och avbryt i så fall
if ($conn->connect_error) {
    die("Anslutning misslyckades: " . $conn->connect_error);
}

// Ange teckenkodning UTF-8 för att stödja svenska tecken
$conn->set_charset("utf8mb4");
?>