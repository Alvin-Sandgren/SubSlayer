<?php
// Starta sessionen så vi kan förstöra den
session_start();

// Förstör all sessionsdata (loggar ut användaren)
session_destroy();

// Skicka tillbaka till startsidan
header("Location: ../index.html");
exit;
?>