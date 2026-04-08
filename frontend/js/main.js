// main.js – Applikationens startpunkt
// Hanterar initiering, eventlyssnare och övergripande logik
//
import { loadSalary } from './salary.js';
import * as SalaryModule from './salary.js';
import { loadCurrencies, loadRates} from './currencies.js';
import { fetchSubscriptions, postSubscription, deleteSubscriptionById, putSubscription} from './api.js';
import { renderSubscriptions, renderEditCells, escapeHTML, renderPieChart} from './render.js';

// DOM-references
const addForm               = document.getElementById('addSubForm');
const subscriptionList      = document.getElementById('subscriptionList');
const currencySelect        = document.getElementById('currency');        // Valuta vid tillägg
const displayCurrencySelect = document.getElementById('displayCurrency'); // Visningsvaluta i tabell
const totalBox              = document.getElementById('totalCostBox');
const totalText             = document.getElementById('totalCost');

// Global lista med prenumerationer – uppdateras efter varje ändring
let subscriptions = [];


// Hjälpfunktion: renderar allt på sidan
// Används varje gång data eller visningsvaluta ändras
function render() {
    renderSubscriptions(subscriptions, displayCurrencySelect, subscriptionList, totalBox, totalText, SalaryModule.currentSalary);
    renderNextDue();
    renderPieChart(subscriptions);
}

// init – Startar appen: laddar data och kopplar eventlyssnare
async function init() {
    await loadCurrencies(currencySelect, displayCurrencySelect); // Fyll valutadropdowns
    await loadRates();                                           // Hämta aktuella valutakurser
    await loadSalary(render);                                    // Hämta lön och koppla lön-knappar

    // Hämta och rendera prenumerationer
    subscriptions = await fetchSubscriptions();
    render();

    // Eventlyssnare för att lägga till ny prenumeration
    addForm.addEventListener('submit', addSubscription);

    // Re-rendera när visningsvalutan byts
    displayCurrencySelect.addEventListener('change', render);

    // Delegerad eventhantering för knappar i prenumerationslistan
    subscriptionList.addEventListener('click', e => {
        const editBtn   = e.target.closest('[data-edit]');
        const deleteBtn = e.target.closest('[data-delete]');
        const saveBtn   = e.target.closest('[data-save]');
        const cancelBtn = e.target.closest('[data-cancel]');

        if (editBtn)   editSubscription(+editBtn.dataset.edit, editBtn.dataset.currency);
        if (deleteBtn) deleteSubscription(+deleteBtn.dataset.delete);
        if (saveBtn)   saveEdit(+saveBtn.dataset.save);
        if (cancelBtn) cancelEdit();
    });
}

// Visar nästa (upp till 4) förfallodatum i löneboxen
function renderNextDue() {
    const box = document.getElementById('nextDue');
    if (!box) return;

    if (!subscriptions.length) {
        box.innerHTML = '<p style="color:#aaa; font-size:14px;">Inga prenumerationer än.</p>';
        return;
    }

    // Hämta de tre/fyra närmast förfallande prenumerationerna (redan sorterade från API)
    const next3 = subscriptions.slice(0, 3);

    const items = next3.map(sub => {
        // Räkna ut antal dagar till nästa förfallodatum
        const daysLeft = Math.ceil((new Date(sub.next_billing_date) - new Date()) / (1000 * 60 * 60 * 24));
        return `
            <div style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <p style="font-size:16px; font-weight:bold; margin:0;">${escapeHTML(sub.service_name)}</p>
                <p style="color:#aaa; font-size:13px; margin:4px 0;">${sub.next_billing_date}</p>
                <p style="margin:0;">${parseFloat(sub.amount).toFixed(2)} ${sub.currency}</p>
                <p style="color:#ff00ff; font-size:13px; margin:4px 0 0 0;">${daysLeft} dagar kvar</p>
                <button data-paid="${sub.id}" style="margin-top:5px; border: 2px solid #ff00ff; border-radius: 8px; padding:5px 10px; background:#000000; color:#ff00ff; cursor:pointer;">Markera som betald</button>
            </div>
        `;
    }).join('');

    box.innerHTML = `
        <p style="color:#ff00ff; font-size:13px; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">Nästa förfallodatum</p>
        ${items}
    `;
}

// Lägger till en ny prenumeration via formuläret
async function addSubscription(e) {
    e.preventDefault(); // Förhindra sidomuppdatering

    // Bygg payload-objektet från formulärdata
    const formData = Object.fromEntries(new FormData(addForm));
    const payload  = {
        service_name:      formData.service_name      || '',
        category:          formData.category          || '',
        amount:            parseFloat(formData.amount) || 0,
        currency:          formData.currency          || 'SEK',
        period:            formData.period            || 'monthly',
        next_billing_date: formData.next_billing_date || ''
    };

    try {
        const result = await postSubscription(payload);

        if (result.status === 'success') {
            addForm.reset();                    // Töm formuläret
            currencySelect.value = 'SEK';       // Återställ valuta till SEK
            subscriptions = await fetchSubscriptions(); // Uppdatera listan
            render();
        } else {
            alert(result.error || 'Fel: kunde inte spara');
        }
    } catch (err) {
        alert('Kunde inte spara prenumerationen');
    }
}

// Sätter en rad i tabellen i redigeringsläge
function editSubscription(id, currency) {
    const sub = subscriptions.find(s => +s.id === id);
    if (!sub) return;

    // Bygg HTML för valutaoptioner från befintlig currencySelect
    const currencyOptions = Array.from(currencySelect.options)
        .map(o => `<option value="${o.value}">${o.text}</option>`)
        .join('');

    // Byt ut cellerna i raden mot input-fält
    renderEditCells(id, sub.amount, currency, currencyOptions);
}

// Sparar ändringar från redigeringsläget
async function saveEdit(id) {
    const row    = document.getElementById('row-' + id);
    const amount = parseFloat(row.cells[2].querySelector('input').value);
    const cur    = row.cells[3].querySelector('select').value;

    try {
        const result = await putSubscription(id, { amount, currency: cur });

        if (result.status === 'success') {
            subscriptions = await fetchSubscriptions(); // Uppdatera listan
            render();
        } else {
            alert(result.error || 'Kunde inte spara');
        }
    } catch (err) {
        alert('Kunde inte spara ändringar');
    }
}

// Avbryter redigeringsläget och återställer vyn

function cancelEdit() {
    render();
}

// Tar bort en prenumeration efter bekräftelse
async function deleteSubscription(id) {
    if (!confirm('Ta bort prenumerationen?')) return;

    try {
        const result = await deleteSubscriptionById(id);

        if (result.status === 'success') {
            subscriptions = await fetchSubscriptions(); // Uppdatera listan
            render();
        } else {
            alert('Kunde inte ta bort');
        }
    } catch (err) {
        alert('Kunde inte ta bort');
    }
}
// Starta applikationen
init();