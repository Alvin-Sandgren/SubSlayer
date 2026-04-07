// render.js – Renderingsfunktioner för tabell, redigeringsläge och diagram
// Importerar valutakonvertering från currencies.js
//
import { convertCurrency, getExchangeRates } from './currencies.js';

// Hjälpfunktion: förhindrar XSS genom att escapa HTML-tecken
// Används alltid när användardata skrivs ut i DOM:en
export function escapeHTML(text) {
    if (text === null || text === undefined) return '';
    const div       = document.createElement('div');
    div.textContent = text; // textContent escapar automatiskt
    return div.innerHTML;
}

// Renderar prenumerationstabellen
// Beräknar också total årskostnad och anropar löne-pajdiagrammet
export function renderSubscriptions(list, displayCurrencySelect, subscriptionList, totalBox, totalText, currentSalary) {
    const displayCurrency = displayCurrencySelect.value || 'SEK';

    // Om listan är tom – visa tomt tillstånd och dölj kostnadssumman
    if (!list || !list.length) {
        subscriptionList.innerHTML = '<p>Inga prenumerationer än</p>';
        totalBox.style.display     = 'none';
        renderSalaryChart(0, currentSalary);
        return;
    }

    let totalYearly = 0; // Räknar ihop total årskostnad i vald visningsvaluta

    // Bygg en tabellrad per prenumeration
    const rows = list.map(sub => {
        // Konvertera beloppet till visningsvalutan
        const converted  = convertCurrency(sub.amount, sub.currency, displayCurrency);

        // Räkna om till årskostnad (månadsvis × 12, årsvis × 1)
        const yearlyCost = sub.period === 'monthly' ? converted * 12 : converted;
        totalYearly += yearlyCost;

        // Konverterad kolumn: visa bindestreck om valutan redan stämmer, annars neon-text
        const convertedCell = sub.currency === displayCurrency
            ? '<span class="same-currency">-</span>'
            : `<span class="converted-amount">${converted.toFixed(2)} ${displayCurrency}</span>`;

        return `
            <tr id="row-${sub.id}">
                <td>${escapeHTML(sub.service_name)}</td>
                <td>${escapeHTML(sub.category || '-')}</td>
                <td>${parseFloat(sub.amount).toFixed(2)} ${sub.currency}</td>
                <td>${convertedCell}</td>
                <td>${sub.period === 'monthly' ? 'Månadsvis' : 'Årsvis'}</td>
                <td>${sub.next_billing_date}</td>
                <td>
                    <button class="edit-btn"   data-edit="${sub.id}" data-currency="${sub.currency}">Redigera</button>
                    <button class="delete-btn" data-delete="${sub.id}">Ta bort</button>
                </td>
            </tr>
        `;
    }).join('');

    // Skriv ut tabellen med rubrikrad och alla rader
    subscriptionList.innerHTML = `
        <table class="sub-table">
            <tr>
                <th>Tjänst</th><th>Kategori</th><th>Kostnad</th>
                <th>Konv</th><th>Period</th><th>Datum</th><th></th>
            </tr>
            ${rows}
        </table>
    `;

    // Uppdatera total årskostnad och visa boxen
    totalText.textContent  = totalYearly.toFixed(2) + ' ' + displayCurrency;
    totalBox.style.display = 'block';

    // Uppdatera pajdiagrammet lön vs prenumerationer
    renderSalaryChart(totalYearly, currentSalary);
}

// Byter ut celler i en tabellrad till redigeringsinput
// Anropas när användaren klickar "Redigera" på en rad
export function renderEditCells(id, currentAmount, currentCurrency, currencyOptions) {
    const row = document.getElementById('row-' + id);
    if (!row) return;

    // Ersätt belopps-cellen med ett input-fält
    row.cells[2].innerHTML = `<input class="edit-input" type="number" step="0.01" min="0" value="${currentAmount}" style="width:80px;">`;

    // Ersätt valutacellen med en select med alla valutor
    row.cells[3].innerHTML = `<select class="edit-input">${currencyOptions}</select>`;

    // Förvälj prenumerationens nuvarande valuta
    row.querySelector('select.edit-input').value = currentCurrency;

    // Byt ut åtgärdsknapparna mot Spara/Avbryt
    row.cells[6].innerHTML = `
        <button class="edit-btn"   data-save="${id}">Spara</button>
        <button class="delete-btn" data-cancel>Avbryt</button>
    `;
}

// Renderar SVG-pajdiagrammet: lön vs prenumerationskostnad
// Visas bara om en månadslön är sparad
export function renderSalaryChart(totalYearly, currentSalary) {
    const chartBox = document.getElementById('salaryChartBox');
    if (!chartBox) return;

    // Dölj boxen om ingen lön är sparad
    if (!currentSalary) {
        chartBox.style.display = 'none';
        return;
    }

    const yearSalary   = currentSalary * 12;
    // Procentandelen som går till prenumerationer (max 100%)
    const subPercent   = Math.min((totalYearly / yearSalary) * 100, 100);
    const otherPercent = 100 - subPercent;

    // SVG-inställningar
    const r  = 80;  // Radie
    const cx = 100; // Centrum X
    const cy = 100; // Centrum Y

    // Hjälpfunktion: konverterar vinkel till x/y-koordinat på cirkeln
    function polarToCartesian(angle) {
        const rad = (angle - 90) * Math.PI / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    // Bygger en SVG-sektor (tårtbit) från startAngle till endAngle med given färg
    function slicePath(startAngle, endAngle, color) {
        const start = polarToCartesian(startAngle);
        const end   = polarToCartesian(endAngle);
        const large = endAngle - startAngle > 180 ? 1 : 0; // large-arc-flag
        return `<path d="M${cx},${cy} L${start.x},${start.y} A${r},${r} 0 ${large} 1 ${end.x},${end.y} Z" fill="${color}" />`;
    }

    // Räkna ut vinkeln för prenumerationssektorn
    const subAngle = (subPercent / 100) * 360;

    // Bygg SVG – om 100% används en hel cirkel istället för tårtbitar
    const svg = `
        <svg viewBox="0 0 200 200" width="180" height="180">
            ${subPercent >= 100
                ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ff00ff"/>`
                : `${slicePath(0, subAngle, '#ff00ff')}
                   ${slicePath(subAngle, 360, '#373f37ff')}`
            }
        </svg>
    `;

    // Visa boxen och skriv in diagram + förklaring
    chartBox.style.display = 'block';
    chartBox.innerHTML = `
        <h2>Lön vs prenumerationer</h2>
        <div style="display:flex; align-items:center; gap:30px; justify-content:center; flex-wrap:wrap;">
            ${svg}
            <div style="text-align:left; line-height:2;">
                <p><span style="color:#ff00ff;">■</span> Prenumerationer: <strong>${subPercent.toFixed(1)}%</strong></p>
                <p><span style="color:#555; border:1px solid #555; display:inline-block; width:14px; height:14px; vertical-align:middle;"></span> Kvarvarande efter prenumerationer: <strong>${otherPercent.toFixed(1)}%</strong></p>
                <p style="margin-top:10px; font-size:13px; color:#999999;">
                    ${totalYearly.toFixed(0)} / ${yearSalary.toFixed(0)} SEK per år
                </p>
            </div>
        </div>
    `;
}

// Renderar pajdiagrammet med Chart.js
// Visar kostnadsfördelning per tjänst baserat på årskostnad i SEK
export function renderPieChart(subscriptions) {
    console.log('exchangeRates:', getExchangeRates()); // Debug: logga kurser
    const chartBox = document.getElementById('pieChartBox');
    if (!chartBox) return;

    // Tomt tillstånd
    if (!subscriptions.length) {
        chartBox.innerHTML = '<p style="color:#aaa;">Inga prenumerationer än.</p>';
        return;
    }

    // Räkna ut total årskostnad per tjänst i SEK
    const data = {};
    for (const sub of subscriptions) {
        const yearly = sub.period === 'monthly'
            ? convertCurrency(sub.amount, sub.currency, 'SEK') * 12
            : convertCurrency(sub.amount, sub.currency, 'SEK');
        data[sub.service_name] = (data[sub.service_name] || 0) + yearly;
    }

    const labels = Object.keys(data);
    const values = Object.values(data).map(v => parseFloat(v.toFixed(2)));

    // Rendera canvas-elementet som Chart.js ska rita i
    chartBox.innerHTML = `
        <h2>Kostnadsfördelning per tjänst</h2>
        <p style="color:#aaa; font-size:13px; margin-top:-10px;">Baserat på årskostnad i SEK</p>
        <div style="width:350px; margin:auto;">
            <canvas id="myPieChart"></canvas>
        </div>
    `;

    const ctx = document.getElementById('myPieChart').getContext('2d');

    // Skapa Chart.js-diagrammet
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data: values,
                // Färgpalett för tårtbitarna
                backgroundColor: ['#ff6384','#36a2eb','#ffce56','#4bc0c0','#9966ff','#ff9f40']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#ffffff' } // Vit text på mörk bakgrund
                },
                tooltip: {
                    callbacks: {
                        // Visar belopp i SEK i tooltip
                        label: ctx => `${ctx.label}: ${ctx.parsed.toFixed(2)} SEK`
                    }
                }
            }
        }
    });
}