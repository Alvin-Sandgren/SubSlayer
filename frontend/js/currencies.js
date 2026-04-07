// currencies.js – Hanterar valutahämtning, kurser och konvertering
// Använder Frankfurter API (https://api.frankfurter.dev) med SEK som basvaluta
//
// Lokalt cache för valutakurser – fylls på av loadRates()
let exchangeRates = {};

// Getter för att komma åt kurslistan från andra moduler
export function getExchangeRates() { return exchangeRates; }


// Laddar alla tillgängliga valutor från API:et och fyller i de två select-elementen:
//   currencySelect        = valutan vid tillägg av prenumeration
//   displayCurrencySelect = valutan som visas i tabellen
export async function loadCurrencies(currencySelect, displayCurrencySelect) {
    try {
        const res  = await fetch('https://api.frankfurter.dev/v1/currencies');
        const data = await res.json(); // Objekt { "SEK": "Swedish Krona", ... }

        // Töm befintliga alternativ
        currencySelect.innerHTML        = '';
        displayCurrencySelect.innerHTML = '';

        // Lägg till ett <option> per valuta i båda select-elementen
        for (const [code, name] of Object.entries(data)) {
            const opt = new Option(`${code} – ${name}`, code);
            currencySelect.add(opt);
            displayCurrencySelect.add(opt.cloneNode(true)); // Klon för det andra elementet
        }

        // Sätt SEK som standardval i båda
        currencySelect.value        = 'SEK';
        displayCurrencySelect.value = 'SEK';

    } catch (err) {
        console.error('currency error', err);
    }
}

// Hämtar aktuella valutakurser med SEK som bas och sparar i exchangeRates
// SEK = 1 läggs till manuellt eftersom Frankfurter inte inkluderar basvalutan
export async function loadRates() {
    try {
        const res  = await fetch('https://api.frankfurter.dev/v1/latest?base=SEK');
        const data = await res.json();
        exchangeRates     = data.rates || {};
        exchangeRates.SEK = 1; // Sätt SEK-kursen manuellt
    } catch (err) {
        console.error('rates error', err);
    }
}

// Konverterar ett belopp från en valuta till en annan med hjälp av kurserna
// Exempel: convertCurrency(10, 'USD', 'SEK') ger ungefär 100
export function convertCurrency(amount, fromCurrency, toCurrency) {
    const value    = parseFloat(amount) || 0;
    const fromRate = exchangeRates[fromCurrency] || 1; // Kurs relativt SEK
    const toRate   = exchangeRates[toCurrency]   || 1;

    // Konvertera via SEK som mellanled: amount → SEK → toCurrency
    return (value / fromRate) * toRate;
}