<?php
// Starta sessionen så vi kan logga in användaren direkt efter registrering
session_start();

// Inkludera databasanslutningen
require 'db.php';

$error = null; // Används för att visa felmeddelanden i formuläret

// Körs bara när formuläret skickas (POST-request)
if ($_SERVER['REQUEST_METHOD'] == 'POST') {

    // Rensa e-postadressen från ogiltiga tecken
    $email    = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'];

    // Hasha lösenordet med bcrypt (PASSWORD_DEFAULT) – sparas aldrig i klartext
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Förbered SQL-sats för att infoga ny användare
    $sql  = "INSERT INTO users (email, password) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);

    if ($stmt) {
        $stmt->bind_param("ss", $email, $hashed_password);
        try {
            if ($stmt->execute()) {
                // Registrering lyckades – logga in användaren direkt via sessionen
                $_SESSION['user_id'] = $conn->insert_id;
                $_SESSION['email']   = $email;

                // Skicka vidare till huvudsidan
                header("Location: subslayer.php");
                exit;
            }
        } catch (mysqli_sql_exception $e) {
            // Felkod 1062 = "Duplicate entry" – e-posten finns redan registrerad
            if ($e->getCode() == 1062) {
                $error = "E-postadressen är redan registrerad.";
            } else {
                $error = "Ett fel uppstod vid registrering.";
            }
        }
        $stmt->close();
    }
}
?>

<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registrera - SubSlayer</title>
    <link rel="stylesheet" href="../frontend/css/style.css">
</head>
<body>

    <h1>SubSlayer</h1>

    <div class="infobox">
        <h2>Registrera</h2>

        <!-- Visa eventuellt felmeddelande från PHP -->
        <?php if ($error): ?>
            <p class="error-msg"><?php echo htmlspecialchars($error); ?></p>
        <?php endif; ?>

        <!-- Registreringsformulär -->
        <form method="POST" action="register.php">
            <label for="email">E-post:</label>
            <input type="email" id="email" name="email" placeholder="Din e-post..." required>

            <label for="password">Lösenord:</label>
            <input type="password" id="password" name="password" placeholder="Välj ett lösenord..." required>

            <input type="submit" value="Registrera">
        </form>

        <p>Har du redan ett konto?</p>
        <a href="login.php">Logga in här</a>
        <a href="../index.html">Tillbaka till start</a>
    </div>

</body>
</html>