<?php
// Inkludera databasanslutningen
require 'db.php'; 

$error = null;

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Rensa input för säkerhets skull
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'];

    // Kryptera lösenordet
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // SQL-fråga med mysqli (eftersom db.php använder det)
    $sql = "INSERT INTO users (email, password) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);

    if ($stmt) {
        $stmt->bind_param("ss", $email, $hashed_password);
        
        try {
            if ($stmt->execute()) {
                // Skicka användaren till login med ett lyckat meddelande
                header("Location: subslayer.php?");
                exit;
            }
        } catch (mysqli_sql_exception $e) {
            // Felkod 1062 betyder "Duplicate entry" (e-posten finns redan)
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

        <?php if ($error): ?>
            <p class="error-msg"><?php echo htmlspecialchars($error); ?></p>
        <?php endif; ?>

        <form method="POST" action="register.php">
            <label for="email">E-post:</label>
            <input type="email" id="email" name="email" placeholder="Din e-post..." required>

            <label for="password">Lösenord:</label>
            <input type="password" id="password" name="password" placeholder="Välj ett lösenord..." required>

            <input type="submit" value="Registrera">
        </form>

        <p>Har du redan ett konto?</p>
        <a href="login.php" style="font-size: 18px; padding: 8px 15px;">Logga in här</a>
    </div>
    
</body>
</html>