// salary.js – Hanterar hämtning, visning och sparande av månadslön
// Exporterar currentSalary så att render.js kan läsa den via SalaryModule
//
import { putSalary, fetchSalary } from './api.js';

// Exporteras så att main.js kan nå lönen vid rendering
export let currentSalary = null;

// Laddar lönen från servern och kopplar eventlyssnare för lön-formuläret
// onSalaryUpdated = callback som anropas efter att lönen sparats (re-renderar sidan)
export async function loadSalary(onSalaryUpdated) {
    try {
        const data    = await fetchSalary();
        // Konvertera till float, eller null om ingen lön är sparad
        currentSalary = data.monthly_salary ? parseFloat(data.monthly_salary) : null;
        updateSalaryDisplay(); // Uppdatera texten i UI
    } catch (err) {
        console.error('salary error', err);
    }

    // Knapp: öppna redigeringsformuläret och fyll i nuvarande lön
    document.getElementById('editSalaryBtn').addEventListener('click', () => {
        document.getElementById('salaryDisplay').style.display = 'none';
        document.getElementById('salaryForm').style.display    = 'block';
        document.getElementById('salaryInput').value           = currentSalary || '';
    });

    // Knapp: stäng formuläret utan att spara
    document.getElementById('cancelSalaryBtn').addEventListener('click', () => {
        document.getElementById('salaryForm').style.display    = 'none';
        document.getElementById('salaryDisplay').style.display = 'block';
    });

    // Knapp: spara ny lön
    document.getElementById('saveSalaryBtn').addEventListener('click', () => saveSalary(onSalaryUpdated));
}

// Uppdaterar texten i löne-displayen
// Kallas efter att lönen hämtats eller sparats
export function updateSalaryDisplay() {
    const text = document.getElementById('salaryText');
    const btn  = document.getElementById('editSalaryBtn');

    if (currentSalary !== null) {
        text.textContent = currentSalary.toLocaleString('sv-SE') + ' SEK / månad';
        btn.textContent  = 'Redigera inkomst';
    } else {
        text.textContent = 'Ingen lön inlagd ännu.';
        btn.textContent  = 'Lägg till inkomst';
    }
}

// Sparar den inmatade lönen till servern
// onSalaryUpdated = callback för att re-rendera sidan med ny lön
async function saveSalary(onSalaryUpdated) {
    const val = parseFloat(document.getElementById('salaryInput').value);

    // Validera att värdet är ett giltigt icke-negativt tal
    if (isNaN(val) || val < 0) {
        alert('Ange en giltig lön');
        return;
    }
    try {
        const result = await putSalary(val);

        if (result.status === 'success') {
            currentSalary = val;         // Uppdatera lokal variabel
            updateSalaryDisplay();       // Uppdatera displaytexten

            // Växla tillbaka till visningsläget
            document.getElementById('salaryForm').style.display    = 'none';
            document.getElementById('salaryDisplay').style.display = 'block';

            // Anropa callback för att re-rendera prenumerationslistan och diagrammet
            onSalaryUpdated();
        } else {
            alert(result.error || 'Kunde inte spara');
        }
    } catch (err) {
        alert('Kunde inte spara lönen');
    }
}