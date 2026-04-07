// api.js – Alla fetch-anrop mot backend-API:et
// Varje funktion returnerar ett Promise med JSON-svaret från servern
//
// Hämtar alla prenumerationer för inloggad användare (GET)
export async function fetchSubscriptions() {
    const res = await fetch('api.php');
    if (!res.ok) throw new Error('Kunde inte hämta prenumerationer');
    return res.json();
}

// Skapar en ny prenumeration (POST)
// payload = objekt med service_name, category, amount, currency, period, next_billing_date
export async function postSubscription(payload) {
    const res = await fetch('api.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
    });
    return res.json();
}

// Uppdaterar belopp och valuta för en befintlig prenumeration (PUT)
// id = prenumerationens id, payload = { amount, currency }
export async function putSubscription(id, payload) {
    const res = await fetch('api.php?id=' + id, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
    });
    return res.json();
}

// Tar bort en prenumeration med givet id (DELETE)
export async function deleteSubscriptionById(id) {
    const res = await fetch('api.php?id=' + id, { method: 'DELETE' });
    return res.json();
}

// Hämtar sparad månadslön för inloggad användare (GET)
export async function fetchSalary() {
    const res = await fetch('salary.php');
    if (!res.ok) throw new Error('Kunde inte hämta lön');
    return res.json();
}

// Sparar eller uppdaterar månadslönen (PUT)
// salary = numriskt värde i SEK
export async function putSalary(salary) {
    const res = await fetch('salary.php', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ monthly_salary: salary })
    });
    return res.json();
}