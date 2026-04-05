export let exchangeRates = {};

export async function loadCurrencies(currencySelect, displayCurrencySelect) {
    try {
        const res  = await fetch('https://api.frankfurter.dev/v1/currencies');
        const data = await res.json();

        currencySelect.innerHTML      = '';
        displayCurrencySelect.innerHTML = '';

        for (const [code, name] of Object.entries(data)) {
            const opt = new Option(`${code} – ${name}`, code);
            currencySelect.add(opt);
            displayCurrencySelect.add(opt.cloneNode(true));
        }

        currencySelect.value        = 'SEK';
        displayCurrencySelect.value = 'SEK';
    } catch (err) {
        console.error('currency error', err);
    }
}

export async function loadRates() {
    try {
        const res  = await fetch('https://api.frankfurter.dev/v1/latest?base=SEK');
        const data = await res.json();
        exchangeRates      = data.rates || {};
        exchangeRates.SEK  = 1;
    } catch (err) {
        console.error('rates error', err);
    }
}

export function convertCurrency(amount, fromCurrency, toCurrency) {
    const value    = parseFloat(amount) || 0;
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate   = exchangeRates[toCurrency]   || 1;
    return (value / fromRate) * toRate;
}