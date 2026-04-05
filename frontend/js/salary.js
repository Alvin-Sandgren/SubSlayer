import { putSalary, fetchSalary } from './api.js';

export let currentSalary = null;

export async function loadSalary(onSalaryUpdated) {
    try {
        const data    = await fetchSalary();
        currentSalary = data.monthly_salary ? parseFloat(data.monthly_salary) : null;
        updateSalaryDisplay();
    } catch (err) {
        console.error('salary error', err);
    }

    document.getElementById('editSalaryBtn').addEventListener('click', () => {
        document.getElementById('salaryDisplay').style.display = 'none';
        document.getElementById('salaryForm').style.display    = 'block';
        document.getElementById('salaryInput').value           = currentSalary || '';
    });

    document.getElementById('cancelSalaryBtn').addEventListener('click', () => {
        document.getElementById('salaryForm').style.display    = 'none';
        document.getElementById('salaryDisplay').style.display = 'block';
    });

    document.getElementById('saveSalaryBtn').addEventListener('click', () => saveSalary(onSalaryUpdated));
}

export function updateSalaryDisplay() {
    const text = document.getElementById('salaryText');
    text.textContent = currentSalary
        ? currentSalary.toLocaleString('sv-SE') + ' SEK / månad'
        : 'Ingen lön inlagd ännu.';
}

async function saveSalary(onSalaryUpdated) {
    const val = parseFloat(document.getElementById('salaryInput').value);
    if (isNaN(val) || val < 0) {
        alert('Ange en giltig lön');
        return;
    }

    try {
        const result = await putSalary(val);

        if (result.status === 'success') {
            currentSalary = val;
            updateSalaryDisplay();
            document.getElementById('salaryForm').style.display    = 'none';
            document.getElementById('salaryDisplay').style.display = 'block';
            onSalaryUpdated(); // återrenderar prenumerationslistan + pajdiagram
        } else {
            alert(result.error || 'Kunde inte spara');
        }
    } catch (err) {
        alert('Kunde inte spara lönen');
    }
}