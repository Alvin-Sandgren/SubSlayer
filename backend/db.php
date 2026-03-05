<?php
$host = 'localhost';
$username = 'root'; 
$password = '';     
$dbname = 'SubSlayer';

$conn = new mysqli($host, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Anslutning misslyckades: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4"); 
?>