let exchangeRates = {};   // valutakurser med SEK som bas
let subscriptions = [];   // prenumerationer hämtade från backend

const addForm             = document.getElementById('addSubForm');
const subscriptionList    = document.getElementById('subscriptionList');
const currencySelect      = document.getElementById('currency');
const displayCurrencySelect = document.getElementById('displayCurrency');
const totalBox            = document.getElementById('totalCostBox');
const totalText           = document.getElementById('totalCost');
let currentSalary = null;

async function init() {
  await loadCurrencies();
  await loadRates();
  await loadSubscriptions();
  await loadSalary(); 

  addForm.addEventListener('submit', addSubscription);
  displayCurrencySelect.addEventListener('change', () => renderSubscriptions(subscriptions));
}

// Fyller valuta-dropdownarna med data från Frankfurter API
async function loadCurrencies() {
  try {
    const res = await fetch('https://api.frankfurter.dev/v1/currencies');
    const data = await res.json();

    currencySelect.innerHTML = '';
    displayCurrencySelect.innerHTML = '';

    for (const code of Object.keys(data)) {
      const label = code + ' – ' + data[code];
      currencySelect.add(new Option(label, code));
      displayCurrencySelect.add(new Option(label, code));
    }

    // Välj SEK som standard i båda dropdownarna
    currencySelect.value = 'SEK';
    displayCurrencySelect.value = 'SEK';
  } catch (err) {
    console.error('currency error', err);
  }
}

// Hämtar aktuella valutakurser med SEK som bas för konvertering
async function loadRates() {
  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?base=SEK');
    const data = await res.json();
    exchangeRates = data.rates || {};
    exchangeRates.SEK = 1; // API:et utesluter basvalutan själv
  } catch (err) {
    console.error('rates error', err);
  }
}

// Hämtar och visar prenumerationer från backend
async function loadSubscriptions() {
  try {
    const res = await fetch('api.php');
    subscriptions = await res.json();
    renderSubscriptions(subscriptions);
  } catch (err) {
    subscriptionList.innerHTML = 'Kunde inte ladda prenumerationer';
  }
}

// Konverterar ett belopp mellan två valutor via SEK som mellansteg
function convertCurrency(amount, fromCurrency, toCurrency) {
  const value = parseFloat(amount) || 0;
  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate   = exchangeRates[toCurrency]   || 1;
  return (value / fromRate) * toRate;
}

// Bygger upp prenumerationstabellen och beräknar total årskostnad
function renderSubscriptions(list) {
  const displayCurrency = displayCurrencySelect.value || 'SEK';

  if (!list || !list.length) {
    subscriptionList.innerHTML = 'Inga prenumerationer än';
    totalBox.style.display = 'none';
    return;
  }

  let totalYearly = 0;

  const rows = list.map(sub => {
    const converted = convertCurrency(sub.amount, sub.currency, displayCurrency);

    // Månadsbetalningar räknas om till helårskostnad
    const yearlyCost = sub.period === 'monthly' ? converted * 12 : converted;
    totalYearly += yearlyCost;

    // Visa konverterat belopp bara om valutan faktiskt skiljer sig
    const convertedCell = sub.currency === displayCurrency
      ? '-'
      : converted.toFixed(2) + ' ' + displayCurrency;

    return `
      <tr>
        <td>${escapeHTML(sub.service_name)}</td>
        <td>${escapeHTML(sub.category || '-')}</td>
        <td>${parseFloat(sub.amount).toFixed(2)} ${sub.currency}</td>
        <td>${convertedCell}</td>
        <td>${sub.period === 'monthly' ? 'Månadsvis' : 'Årsvis'}</td>
        <td>${sub.next_billing_date}</td>
        <td><button onclick="deleteSubscription(${sub.id})">Ta bort</button></td>
      </tr>
    `;
  }).join('');

  subscriptionList.innerHTML = `
    <table>
      <tr>
        <th>Tjänst</th><th>Kategori</th><th>Kostnad</th>
        <th>Konv</th><th>Period</th><th>Datum</th><th></th>
      </tr>
      ${rows}
    </table>
  `;

  totalText.textContent = totalYearly.toFixed(2) + ' ' + displayCurrency;
  totalBox.style.display = 'block';
}

// Läser formuläret och skickar ny prenumeration till backend
async function addSubscription(e) {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(addForm));
  const payload = {
    service_name:      formData.service_name || '',
    category:          formData.category || '',
    amount:            parseFloat(formData.amount) || 0,
    currency:          formData.currency || 'SEK',
    period:            formData.period || 'monthly',
    next_billing_date: formData.next_billing_date || ''
  };

  try {
    const res = await fetch('api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.status === 'success') {
      addForm.reset();
      currencySelect.value = 'SEK';
      await loadSubscriptions();
    } else {
      alert(result.error || 'Fel: kunde inte spara');
    }
  } catch (err) {
    alert('Kunde inte spara prenumerationen');
  }
}

// Skickar DELETE-förfrågan och uppdaterar listan vid lyckat resultat
async function deleteSubscription(id) {
  if (!confirm('Ta bort prenumerationen?')) return;

  try {
    const res = await fetch('api.php?id=' + id, { method: 'DELETE' });
    const result = await res.json();

    if (result.status === 'success') {
      loadSubscriptions();
    } else {
      alert('Kunde inte ta bort');
    }
  } catch (err) {
    alert('Kunde inte ta bort');
  }
}

// Förhindrar XSS genom att escapa HTML-specialtecken
function escapeHTML(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadSalary() {
    try {
        const res  = await fetch('salary.php');
        const data = await res.json();
        currentSalary = data.monthly_salary ? parseFloat(data.monthly_salary) : null;
        updateSalaryDisplay();
    } catch (err) {
        console.error('salary error', err);
    }

    // Koppla knappar
    document.getElementById('editSalaryBtn').addEventListener('click', () => {
        document.getElementById('salaryDisplay').style.display = 'none';
        document.getElementById('salaryForm').style.display    = 'block';
        document.getElementById('salaryInput').value = currentSalary || '';
    });

    document.getElementById('cancelSalaryBtn').addEventListener('click', () => {
        document.getElementById('salaryForm').style.display    = 'none';
        document.getElementById('salaryDisplay').style.display = 'block';
    });

    document.getElementById('saveSalaryBtn').addEventListener('click', saveSalary);
}

function updateSalaryDisplay() {
    const text = document.getElementById('salaryText');
    if (currentSalary) {
        text.textContent = currentSalary.toLocaleString('sv-SE') + ' SEK / månad';
    } else {
        text.textContent = 'Ingen lön inlagd ännu.';
    }
}

async function saveSalary() {
    const val = parseFloat(document.getElementById('salaryInput').value);
    if (isNaN(val) || val < 0) {
        alert('Ange en giltig lön');
        return;
    }

    try {
        const res = await fetch('salary.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthly_salary: val })
        });
        const result = await res.json();

        if (result.status === 'success') {
            currentSalary = val;
            updateSalaryDisplay();
            document.getElementById('salaryForm').style.display    = 'none';
            document.getElementById('salaryDisplay').style.display = 'block';
            renderSubscriptions(subscriptions); // uppdatera pajdiagrammet
        } else {
            alert(result.error || 'Kunde inte spara');
        }
    } catch (err) {
        alert('Kunde inte spara lönen');
    }
}

function renderSalaryChart(totalYearly) {
    const chartBox = document.getElementById('salaryChartBox');
    if (!chartBox) return;

    if (!currentSalary) {
        chartBox.style.display = 'none';
        return;
    }

    const yearSalary    = currentSalary * 12;
    const subPercent    = Math.min((totalYearly / yearSalary) * 100, 100);
    const otherPercent  = 100 - subPercent;

    // SVG-pajdiagram
    const r   = 80;
    const cx  = 100;
    const cy  = 100;

    function polarToCartesian(angle) {
        const rad = (angle - 90) * Math.PI / 180;
        return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad)
        };
    }

    function slicePath(startAngle, endAngle, color) {
        const start   = polarToCartesian(startAngle);
        const end     = polarToCartesian(endAngle);
        const large   = endAngle - startAngle > 180 ? 1 : 0;
        return `<path d="M${cx},${cy} L${start.x},${start.y} A${r},${r} 0 ${large} 1 ${end.x},${end.y} Z" fill="${color}" />`;
    }

    const subAngle = (subPercent / 100) * 360;

    const svg = `
        <svg viewBox="0 0 200 200" width="180" height="180">
            ${subPercent >= 100
                ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ff00ff"/>`
                : `${slicePath(0, subAngle, '#ff00ff')}
                   ${slicePath(subAngle, 360, '#333')}`
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
                <p><span style="color:#333; border:1px solid #555; display:inline-block; width:14px; height:14px; vertical-align:middle;"></span> Övrigt: <strong>${otherPercent.toFixed(1)}%</strong></p>
                <p style="margin-top:10px; font-size:13px; color:#aaa;">
                    ${totalYearly.toFixed(0)} / ${yearSalary.toFixed(0)} SEK per år
                </p>
            </div>
        </div>
    `;
}

init();