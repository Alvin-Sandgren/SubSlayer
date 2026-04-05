<?php

// Databasanslutning
require_once 'db.php';

$user_id = (int) $_SESSION['user_id'];

// Hämta alla prenumerationer för användaren
$stmt = $conn->prepare("
    SELECT service_name, amount, currency
    FROM subscriptions
    WHERE user_id = ?
    ORDER BY service_name ASC
");

$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

// Bygg data_points array - konvertera allt till SEK
$data_points = [];
$rates = array(
    'SEK' => 1.0,
    'EUR' => 10.5,
    'USD' => 9.5,
    'GBP' => 12.0,
    'NOK' => 0.9,
    'DKK' => 1.4
);

while ($row = $result->fetch_assoc()) {
    $service = $row['service_name'];
    $amount = (float) $row['amount'];
    $currency = $row['currency'];
    
    $rate = $rates[$currency] ?? 1.0;
    $amountInSEK = $amount * $rate;
    
    if (!isset($data_points[$service])) {
        $data_points[$service] = 0;
    }
    $data_points[$service] += $amountInSEK;
}

// Om ingen data, lägg till default
if (empty($data_points)) {
    $data_points = ['Inga prenumerationer' => 0];
}

// Gör om datan till JSON så att JavaScript kan läsa den
$labels = json_encode(array_keys($data_points));
$values = json_encode(array_values($data_points));
?>

<div style="width: 400px; margin: auto;">
    <canvas id="myPieChart"></canvas>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
// JavaScript för att rita diagrammet med PHP-datan
const ctx = document.getElementById('myPieChart').getContext('2d');
new Chart(ctx, {
    type: 'pie',
    data: {
        labels: <?php echo $labels; ?>,
        datasets: [{
            data: <?php echo $values; ?>,
            backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40']
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) label += ': ';
                        label += context.parsed.toFixed(2) + ' SEK';
                        return label;
                    }
                }
            }
        }
    }
});
</script>