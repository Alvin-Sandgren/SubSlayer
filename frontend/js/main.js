import { loadSalary } from './salary.js';
import * as SalaryModule from './salary.js';
import { loadCurrencies, loadRates }               from './currencies.js';
import { fetchSubscriptions, postSubscription, deleteSubscriptionById, putSubscription }  from './api.js';
import { renderSubscriptions, renderEditCells, escapeHTML } from './render.js';


const addForm               = document.getElementById('addSubForm');
const subscriptionList      = document.getElementById('subscriptionList');
const currencySelect        = document.getElementById('currency');
const displayCurrencySelect = document.getElementById('displayCurrency');
const totalBox              = document.getElementById('totalCostBox');
const totalText             = document.getElementById('totalCost');

let subscriptions = [];

// Hjälpfunktion så render alltid får rätt currentSalary
function render() {
    renderSubscriptions(subscriptions, displayCurrencySelect, subscriptionList, totalBox, totalText, SalaryModule.currentSalary);
    renderNextDue();
}

async function init() {
    await loadCurrencies(currencySelect, displayCurrencySelect);
    await loadRates();
    await loadSalary(render);

    subscriptions = await fetchSubscriptions();
    render();

    addForm.addEventListener('submit', addSubscription);
    displayCurrencySelect.addEventListener('change', render);

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

function renderNextDue() {
    const box = document.getElementById('nextDue');
    if (!box) return;

    if (!subscriptions.length) {
        box.innerHTML = '<p style="color:#aaa; font-size:14px;">Inga prenumerationer än.</p>';
        return;
    }

    const next3 = subscriptions.slice(0, 4);

    const items = next3.map(sub => {
        const daysLeft = Math.ceil((new Date(sub.next_billing_date) - new Date()) / (1000 * 60 * 60 * 24));
        return `
            <div style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <p style="font-size:16px; font-weight:bold; margin:0;">${escapeHTML(sub.service_name)}</p>
                <p style="color:#aaa; font-size:13px; margin:4px 0;">${sub.next_billing_date}</p>
                <p style="margin:0;">${parseFloat(sub.amount).toFixed(2)} ${sub.currency}</p>
                <p style="color:#ff00ff; font-size:13px; margin:4px 0 0 0;">${daysLeft} dagar kvar</p>
            </div>
        `;
    }).join('');

    box.innerHTML = `
        <p style="color:#ff00ff; font-size:13px; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">Nästa förfallodatum</p>
        ${items}
    `;
}

async function addSubscription(e) {
    e.preventDefault();

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
            addForm.reset();
            currencySelect.value  = 'SEK';
            subscriptions         = await fetchSubscriptions();
            render();
        } else {
            alert(result.error || 'Fel: kunde inte spara');
        }
    } catch (err) {
        alert('Kunde inte spara prenumerationen');
    }
}

function editSubscription(id, currency) {
    const sub = subscriptions.find(s => +s.id === id);
    if (!sub) return;
    const currencyOptions = Array.from(currencySelect.options)
        .map(o => `<option value="${o.value}">${o.text}</option>`)
        .join('');
    renderEditCells(id, sub.amount, currency, currencyOptions);
}

async function saveEdit(id) {
    const row    = document.getElementById('row-' + id);
    const amount = parseFloat(row.cells[2].querySelector('input').value);
    const cur    = row.cells[3].querySelector('select').value;

    try {
        const result = await putSubscription(id, { amount, currency: cur });
        if (result.status === 'success') {
            subscriptions = await fetchSubscriptions();
            render();
        } else {
            alert(result.error || 'Kunde inte spara');
        }
    } catch (err) {
        alert('Kunde inte spara ändringar');
    }
}

function cancelEdit() {
    render();
}

async function deleteSubscription(id) {
    if (!confirm('Ta bort prenumerationen?')) return;

    try {
        const result = await deleteSubscriptionById(id);

        if (result.status === 'success') {
            subscriptions = await fetchSubscriptions();
            render();
        } else {
            alert('Kunde inte ta bort');
        }
    } catch (err) {
        alert('Kunde inte ta bort');
    }
}

init();