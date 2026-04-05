export async function fetchSubscriptions() {
    const res = await fetch('api.php');
    if (!res.ok) throw new Error('Kunde inte hämta prenumerationer');
    return res.json();
}

export async function postSubscription(payload) {
    const res = await fetch('api.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
    });
    return res.json();
}

export async function putSubscription(id, payload) {
    const res = await fetch('api.php?id=' + id, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
    });
    return res.json();
}

export async function deleteSubscriptionById(id) {
    const res = await fetch('api.php?id=' + id, { method: 'DELETE' });
    return res.json();
}

export async function fetchSalary() {
    const res = await fetch('salary.php');
    if (!res.ok) throw new Error('Kunde inte hämta lön');
    return res.json();
}

export async function putSalary(salary) {
    const res = await fetch('salary.php', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ monthly_salary: salary })
    });
    return res.json();
}