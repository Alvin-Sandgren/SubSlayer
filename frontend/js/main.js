// main.js – Applikationens startpunkt
// Hanterar initiering, eventlyssnare och övergripande logik
//
import { loadSalary } from './salary.js';
import * as SalaryModule from './salary.js';
import { loadCurrencies, loadRates} from './currencies.js';
import { fetchSubscriptions, postSubscription, deleteSubscriptionById, putSubscription} from './api.js';
import { renderSubscriptions, renderEditCells, escapeHTML, renderPieChart, renderWallOfShame} from './render.js';

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
    

    SalaryModule.updateSalaryDisplay();
}

async function init() {
    await loadCurrencies(currencySelect, displayCurrencySelect);
    await loadRates();
    await loadSalary(render);

    subscriptions = await fetchSubscriptions();
    render();

    renderWallOfShame();

    addForm.addEventListener('submit', addSubscription);
    displayCurrencySelect.addEventListener('change', render);

    // 1. Lyssnare för den stora tabellen (Edit/Delete/Save/Cancel)
    subscriptionList.addEventListener('click', handleListClicks);

    // 2. Lyssnare för löneboxen (Markera som betald)
    const nextDueBox = document.getElementById('nextDue');
    if (nextDueBox) {
        nextDueBox.addEventListener('click', handleListClicks);
    }
}

// Bryt ut logiken i en egen funktion för att slippa duplicera kod
function handleListClicks(e) {
    const editBtn   = e.target.closest('[data-edit]');
    const deleteBtn = e.target.closest('[data-delete]');
    const saveBtn   = e.target.closest('[data-save]');
    const cancelBtn = e.target.closest('[data-cancel]');
    const paidBtn   = e.target.closest('[data-paid]'); 

    if (editBtn)   editSubscription(+editBtn.dataset.edit, editBtn.dataset.currency);
    if (deleteBtn) deleteSubscription(+deleteBtn.dataset.delete);
    if (saveBtn)   saveEdit(+saveBtn.dataset.save);
    if (cancelBtn) cancelEdit();
    if (paidBtn)   markAsPaid(+paidBtn.dataset.paid); 
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

async function markAsPaid(id) {
    const sub = subscriptions.find(s => s.id == id);
    if (!sub) return;

    const today = new Date();
    let nextDate = new Date(sub.next_billing_date);

    // Spärren med snygg notis istället
    const diffInDays = (nextDate - today) / (1000 * 60 * 60 * 24);
    if (diffInDays > 25) {
        showToast('Betalning redan registrerad för denna period');
        return;
    }

    // Beräkna nästa datum
    if (nextDate <= today) {
        while (nextDate <= today) {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
    } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
    }

    const nextDateString = nextDate.toISOString().split('T')[0];

    try {
        const result = await putSubscription(id, { 
            next_billing_date: nextDateString 
        });

        if (result.status === 'success') {
            subscriptions = await fetchSubscriptions();
            render();
            showToast(`✅ ${sub.service_name} markerad som betald!`);
        }
    } catch (err) {
        showToast('❌ Gick inte att spara betalningen');
    }
}

function showToast(message, duration = 3000) {
    // 1. Hantera behållaren
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        // Styling för behållaren
        Object.assign(container.style, {
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            zIndex: '10000',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        });
        document.body.appendChild(container);
    }

    // 2. Rensa tidigare notiser
    container.innerHTML = '';

    // 3. Skapa själva toasten
    const toast = document.createElement('div');
    toast.innerHTML = `<span>${message}</span>`;
    
    // Styling för själva rutan (Neon-look)
    Object.assign(toast.style, {
        background: 'rgba(20, 20, 20, 0.95)',
        color: '#fff',
        borderLeft: '5px solid #ff00ff',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
        fontFamily: 'sans-serif',
        minWidth: '280px',
        display: 'flex',
        alignItems: 'center',
        fontWeight: '500',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: 'translateX(120%)',
        opacity: '0',
        backdropFilter: 'blur(5px)'
    });

    container.appendChild(toast);

    // 4. Trigga "Slide in" (behöver en minimal delay för att webbläsaren ska fatta)
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 10);

    // 5. Ta bort automatiskt
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        
        // Ta bort elementet från DOM när animationen är klar
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, duration);
}

// Starta applikationen
init();