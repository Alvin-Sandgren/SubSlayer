import { convertCurrency } from './currencies.js';

export function escapeHTML(text) {
    if (text === null || text === undefined) return '';
    const div       = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function renderSubscriptions(list, displayCurrencySelect, subscriptionList, totalBox, totalText, currentSalary, onDelete) {
    const displayCurrency = displayCurrencySelect.value || 'SEK';

    if (!list || !list.length) {
        subscriptionList.innerHTML = '<p>Inga prenumerationer än</p>';
        totalBox.style.display     = 'none';
        renderSalaryChart(0, currentSalary);
        return;
    }

    let totalYearly = 0;

    const rows = list.map(sub => {
        const converted  = convertCurrency(sub.amount, sub.currency, displayCurrency);
        const yearlyCost = sub.period === 'monthly' ? converted * 12 : converted;
        totalYearly += yearlyCost;

        const convertedCell = sub.currency === displayCurrency
            ? '<span class="same-currency">-</span>'
            : `<span class="converted-amount">${converted.toFixed(2)} ${displayCurrency}</span>`;

        return `
            <tr>
                <td>${escapeHTML(sub.service_name)}</td>
                <td>${escapeHTML(sub.category || '-')}</td>
                <td>${parseFloat(sub.amount).toFixed(2)} ${sub.currency}</td>
                <td>${convertedCell}</td>
                <td>${sub.period === 'monthly' ? 'Månadsvis' : 'Årsvis'}</td>
                <td>${sub.next_billing_date}</td>
                <td><button class="delete-btn" onclick="onDelete(${sub.id})">Ta bort</button></td>
            </tr>
        `;
    }).join('');

    subscriptionList.innerHTML = `
        <table class="sub-table">
            <tr>
                <th>Tjänst</th><th>Kategori</th><th>Kostnad</th>
                <th>Konv</th><th>Period</th><th>Datum</th><th></th>
            </tr>
            ${rows}
        </table>
    `;

    totalText.textContent  = totalYearly.toFixed(2) + ' ' + displayCurrency;
    totalBox.style.display = 'block';
    renderSalaryChart(totalYearly, currentSalary);
}

export function renderSalaryChart(totalYearly, currentSalary) {
    const chartBox = document.getElementById('salaryChartBox');
    if (!chartBox) return;

    if (!currentSalary) {
        chartBox.style.display = 'none';
        return;
    }

    const yearSalary   = currentSalary * 12;
    const subPercent   = Math.min((totalYearly / yearSalary) * 100, 100);
    const otherPercent = 100 - subPercent;

    const r  = 80;
    const cx = 100;
    const cy = 100;

    function polarToCartesian(angle) {
        const rad = (angle - 90) * Math.PI / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    function slicePath(startAngle, endAngle, color) {
        const start = polarToCartesian(startAngle);
        const end   = polarToCartesian(endAngle);
        const large = endAngle - startAngle > 180 ? 1 : 0;
        return `<path d="M${cx},${cy} L${start.x},${start.y} A${r},${r} 0 ${large} 1 ${end.x},${end.y} Z" fill="${color}" />`;
    }

    const subAngle = (subPercent / 100) * 360;

    const svg = `
        <svg viewBox="0 0 200 200" width="180" height="180">
            ${subPercent >= 100
                ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ff00ff"/>`
                : `${slicePath(0, subAngle, '#ff00ff')}
                   ${slicePath(subAngle, 360, '#373f37ff')}`
            }
        </svg>
    `;

    chartBox.style.display = 'block';
    chartBox.innerHTML = `
        <h2>Lön vs prenumerationer</h2>
        <div style="display:flex; align-items:center; gap:30px; justify-content:center; flex-wrap:wrap;">
            ${svg}
            <div style="text-align:left; line-height:2;">
                <p><span style="color:#ff00ff;">■</span> Prenumerationer: <strong>${subPercent.toFixed(1)}%</strong></p>
                <p><span style="color:#555; border:1px solid #555; display:inline-block; width:14px; height:14px; vertical-align:middle;"></span> Kvarvarande pengar efter utgifter från prenumerationer: <strong>${otherPercent.toFixed(1)}%</strong></p>
                <p style="margin-top:10px; font-size:13px; color:#999999;">
                    ${totalYearly.toFixed(0)} / ${yearSalary.toFixed(0)} SEK per år
                </p>
            </div>
        </div>
    `;
}