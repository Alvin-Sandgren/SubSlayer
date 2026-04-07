<?php
// Starta sessionen så vi kan spara inloggningsdata
session_start();

// Inkludera databasanslutningen
require 'db.php';

// Körs bara när formuläret skickas
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email    = $_POST['email'];
    $password = $_POST['password'];

    // Hämta användaren med matchande e-post från databasen
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();

    $result = $stmt->get_result();
    $user   = $result->fetch_assoc();

    // Kontrollera att användaren finns och att lösenordet stämmer (jämför med hash)
    if ($user && password_verify($password, $user['password'])) {
        // Spara användarens id och e-post i sessionen
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email']   = $user['email'];

        // Skicka vidare till huvudsidan
        header("Location: subslayer.php");
        exit();
    } else {
        // Fel inloggningsuppgifter – visa felmeddelande
        $error = "Fel email eller lösenord!";
        echo "<script>alert('$error');</script>";
    }
}
?>

<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Logga in - SubSlayer</title>
    <link rel="stylesheet" href="../frontend/css/style.css">
</head>
<body>

    <h1>SubSlayer</h1>

    <div class="infobox">
        <h2>Logga in</h2>

        <!-- Inloggningsformulär -->
        <form method="POST" action="login.php">
            <label for="email">E-post:</label>
            <input type="email" id="email" name="email" placeholder="Din e-post..." required>

            <label for="password">Lösenord:</label>
            <input type="password" id="password" name="password" placeholder="Ditt lösenord..." required>

            <input type="submit" value="Logga in">
        </form>

        <p>Har du inget konto?</p>
        <a href="register.php">Registrera här</a>
    </div>

</body>
</html>