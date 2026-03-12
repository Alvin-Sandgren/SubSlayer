# SubSlayer

SubSlayer är en enkel PHP/JavaScript-applikation för att hantera prenumerationer. 
Användare kan registrera sig, logga in och lägga till prenumerationer med kostnad,
valuta, betalningsperiod och nästa förfallodatum. Systemet beräknar årskostnad
och kan konvertera mellan valutor med hjälp av Frankfurter API.

## Filstruktur

/ (projektets rot)
├── index.html              # Startsida med länkar för inloggning/registrering
├── README.md               # Denna fil
├── backend/
│   ├── db.php              # Databas­anslutning (mysqli)
│   ├── api.php             # REST‑liknande API för prenumerationer (GET/POST/DELETE)
│   ├── login.php           # Inloggningsformulär och sessionhantering
│   ├── register.php        # Registreringsformulär för nya användare
│   ├── logout.php          # Avslutar sessionen och återvänder till startsidan
│   └── subslayer.php       # Huvudsida efter inloggning med formulär + lista
├── frontend/
│   ├── css/
│   │   └── style.css       # All design/layoutrutiner
│   └── js/
│       └── script.js       # JS som pratar med api.php, hämtar växelkurs och uppdaterar DOM
└── db/
    └── subslayer.sql       # Databasschema (tabeller för users + subscriptions)

## Funktionalitet

1. **Autentisering**
   - Användare registrerar sig via `backend/register.php` (e‑post & lösenord).
   - Inloggning sker på `backend/login.php`. Lösenord hash‑as med `password_hash`.
   - Inloggade användare skickas till `backend/subslayer.php`. Utloggning via `backend/logout.php`.

2. **Prenumerations-API**
   - `backend/api.php` kontrollerar sessionen och ger JSON-svar.
   - `GET` returnerar användarens prenumerationer.
   - `POST` lägger till en ny prenumeration.
   - `DELETE` tar bort en prenumeration om den tillhör användaren.

3. **Frontend**
   - `frontend/js/script.js` hanterar API-anrop, renderar tabellen och konverterar valutor.
   - Valutakurser hämtas från `https://api.frankfurter.dev`.
   - `frontend/css/style.css` innehåller stilmallar för formulär och listor.

4. **Databas**
   - `db/subslayer.sql` innehåller struktur för tabeller `users` och `subscriptions`.
   - Krav: MySQL/MariaDB med UTF8‑support.

> **OBS:** index.html länkar till inloggning/registrering; allt annat ligger i `backend/` och `frontend/`.

## Utveckling

Detta ska då bli en sida där man loggar in och sedan så matar man in sina subscriptions med datum etc. Därefter kan man se sin årskostnad, due dates kostnad i olika valuta etc.

Valutan ska ändras eftersom, då den ska gå igenom ett api call som hämtar senaste värdet av valutan.