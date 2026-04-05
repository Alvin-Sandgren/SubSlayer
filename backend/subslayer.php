<?php
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
</head>
<body>

    <h1>SubSlayer</h1>

    <div class="grid-top">

        <div class="infobox" id="salaryBox">
            <h2>Min lön</h2>
            <div id="salaryDisplay">
                <p id="salaryText">Laddar...</p>
                <button id="editSalaryBtn">Redigera</button>
            </div>
            <div id="salaryForm" style="display:none;">
                <label>Månadslön (SEK)</label>
                <input type="number" id="salaryInput" min="0" step="100" placeholder="Ex. 35000">
                <div class="auth-buttons" style="justify-content:center; margin-top:10px;">
                    <button id="saveSalaryBtn">Spara</button>
                    <button id="cancelSalaryBtn">Avbryt</button>
                </div>
            </div>
            <div id="nextDue" style="margin-top:20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top:15px;">
                <p>Laddar...</p>
            </div>
        </div>

        <div class="infobox" id="addSubBox">
            <h2>Lägg till prenumeration</h2>
            <form id="addSubForm">
                <label>Typ av prenumeration</label>
                <input type="text" name="service_name" required>

                <label>Kategori</label>
                <input type="text" name="category">

                <label>Kostnad</label>
                <input type="number" name="amount" step="0.01" min="0" required>

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

    <div class="infobox wide-box">
        <div class="list-header">
            <h2>Mina prenumerationer</h2>
            <div class="currency-switcher">
                <label for="displayCurrency">Visa i:</label>
                <select id="displayCurrency" class="select-inline"></select>
            </div>
        </div>
        <div id="subscriptionList"><p>Laddar...</p></div>
        <div id="totalCostBox" style="display:none;">
            <p class="total-label">Årskostnad: <span id="totalCost">0</span></p>
        </div>
    </div>

    <div class="grid-bottom">

        <div class="infobox" id="salaryChartBox" style="display:none;"></div>

        <div class="infobox">
            <h2>Kostnadsfördelning per tjänst</h2>
            <?php include 'chart.php'; ?>
        </div>

    </div>

    <div class="auth-buttons">
        <a href="../index.html">Startsida</a>
        <a href="logout.php">Logga ut</a>
    </div>

    <script type="module" src="../frontend/js/main.js"></script>

</body>
</html>