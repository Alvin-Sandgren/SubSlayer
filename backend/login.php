<?php
session_start();
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->bind_param("s", $email); 
    $stmt->execute();

    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        header("Location: subslayer.php");
        exit();
    } else {
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

        <form method="POST" action="login.php">
            <label for="email">E-post:</label>
            <input type="email" id="email" name="email" placeholder="Din e-post..." required>

            <label for="password">Lösenord:</label>
            <input type="password" id="password" name="password" placeholder="Ditt lösenord..." required>

            <input type="submit" value="Logga in">
        </form>

        <p>Har du inget konto?</p>
        <a href="register.php" style="font-size: 18px; padding: 8px 15px;">Registrera här</a>
    </div>
    
</body>
</html>