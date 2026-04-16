<?php
// Starta sessionen och kontrollera att användaren är inloggad
// Om inte – skicka till inloggningssidan
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SubSlayer</title>
    <link rel="stylesheet" href="../frontend/css/style.css">
    <!-- Ladda JavaScript-modulerna – main.js är startpunkten -->
    <script type="module" src="../frontend/js/main.js"></script>
    <!-- Chart.js används för pajdiagrammet över kostnadsfördelning -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>

    <h1>SubSlayer</h1>

    <!-- Övre grid: lönebox till vänster, lägg till-prenumeration till höger -->
    <div class="grid-top">

        <!-- Lönebox: visar sparad lön och nästa förfallodatum -->
        <div class="infobox" id="salaryBox">
            <h2>Min lön</h2>

            <!-- Visningsläge: visar lönen och en redigera-knapp -->
            <div id="salaryDisplay">
                <p id="salaryText">Laddar...</p>
                <button id="editSalaryBtn">Lägg till lön</button>
            </div>

            <!-- Redigeringsläge: formulär för att spara ny lön (dold som standard) -->
            <div id="salaryForm" style="display:none;">
                <label>Månadslön (SEK)</label>
                <input type="number" id="salaryInput" min="0" step="100" placeholder="Ex. 35000">
                <div class="auth-buttons" style="justify-content:center; margin-top:10px;">
                    <button id="saveSalaryBtn">Spara</button>
                    <button id="cancelSalaryBtn">Avbryt</button>
                </div>
            </div>

            <!-- Visar nästa 5 förfallodatum – fylls i av JavaScript -->
            <div id="nextDue" style="margin-top:20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top:15px;">
                <p>Laddar...</p>
            </div>
        </div>

        <!-- Formulär för att lägga till ny prenumeration -->
        <div class="infobox" id="addSubBox">
            <h2>Lägg till prenumeration</h2>
            <form id="addSubForm">
                <label>Typ av prenumeration</label>
                <input type="text" name="service_name" required>

                <label>Kategori</label>
                <input type="text" name="category">

                <label>Kostnad</label>
                <input type="number" name="amount" step="0.01" min="0" required>

                <!-- Valutaväljaren fylls i dynamiskt av currencies.js -->
                <label>Valuta</label>
                <select name="currency" id="currency"></select>

                <label>Period</label>
                <select name="period">
                    <option value="monthly">Månadsvis</option>
                    <option value="yearly">Årsvis</option>
                </select>

                <label>Datum</label>
                <input type="date" name="next_billing_date" required>

                <input type="submit" value="Lägg till">
            </form>
        </div>

    </div>

    <!-- Prenumerationslistan – bred box som sträcker sig över hela bredden -->
    <div class="infobox wide-box">
        <div class="list-header">
            <h2>Mina prenumerationer</h2>
            <!-- Valutaväljare för att byta visningsvaluta i tabellen -->
            <div class="currency-switcher">
                <label for="displayCurrency">Visa i:</label>
                <select id="displayCurrency" class="select-inline"></select>
            </div>
        </div>

        <!-- Tabellen med prenumerationer renderas hit av render.js -->
        <div id="subscriptionList"><p>Laddar...</p></div>

        <!-- Total årskostnad – visas bara om det finns prenumerationer -->
        <div id="totalCostBox" style="display:none;">
            <p class="total-label">Årskostnad: <span id="totalCost">0</span></p>
        </div>
    </div>

    <!-- Nedre grid: löne-pajdiagram till vänster, kostnadsfördelning till höger -->
    <div class="grid-bottom">

        <!-- Pajdiagram: lön vs prenumerationskostnad (renderas av render.js) -->
        <div class="infobox" id="salaryChartBox" style="display:none;"></div>

        <!-- Pajdiagram: kostnadsfördelning per tjänst via Chart.js -->
        <div class="infobox">
            <div id="pieChartBox"></div>
        </div>

    </div>

    <!-- Navigationsknappar längst ner -->
    <div class="auth-buttons">
        <a href="logout.php">Logga ut</a>
    </div>

</body>
</html>