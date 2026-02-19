<?php
require 'db.php'; // Se till att db_name i db.php är u372617156_SubSlayer

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = $_POST['email'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
        $stmt->execute([$email, $password]);
        header("Location: login.php?success=registered");
        exit;
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Mailen finns redan
            $error = "E-postadressen är redan registrerad.";
        } else {
            $error = "Ett fel uppstod: " . $e->getMessage();
        }
    }
}
?>