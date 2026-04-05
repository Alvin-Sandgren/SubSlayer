import { loadCurrencies, loadRates }               from './currencies.js';
import { fetchSubscriptions, postSubscription,
         deleteSubscriptionById }                   from './api.js';
import { renderSubscriptions }                      from './render.js';
import { loadSalary, currentSalary }                from './salary.js';

const addForm               = document.getElementById('addSubForm');
const subscriptionList      = document.getElementById('subscriptionList');
const currencySelect        = document.getElementById('currency');
const displayCurrencySelect = document.getElementById('displayCurrency');
const totalBox              = document.getElementById('totalCostBox');
const totalText             = document.getElementById('totalCost');

let subscriptions = [];

// Hjälpfunktion så render alltid får rätt currentSalary
function render() {
    // Importerad currentSalary är en primitiv – hämta från salary-modulen varje gång
    import('./salary.js').then(({ currentSalary }) => {
        renderSubscriptions(subscriptions, displayCurrencySelect, subscriptionList, totalBox, totalText, currentSalary, deleteSubscription);
    });
}

async function init() {
    await loadCurrencies(currencySelect, displayCurrencySelect);
    await loadRates();
    await loadSalary(render);

    subscriptions = await fetchSubscriptions();
    render();

    addForm.addEventListener('submit', addSubscription);
    displayCurrencySelect.addEventListener('change', render);

    // Gör deleteSubscription globalt tillgänglig för onclick i tabellen
    window.deleteSubscription = deleteSubscription;
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