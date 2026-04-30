# SubSlayer

SubSlayer är en PHP/JavaScript-applikation för att hantera prenumerationer.
Användare kan registrera sig, logga in och lägga till prenumerationer med kostnad,
valuta, betalningsperiod och nästa förfallodatum. Systemet beräknar årskostnad
och kan konvertera mellan valutor med hjälp av Frankfurter API.

## Filstruktur

/ (projektets rot)
├── index.html              # Startsida med länkar för inloggning/registrering  

├── README.md               # Denna fil  

│  

├── backend/  

│   ├── db.php              # Databasanslutning (mysqli)  

│   ├── api.php             # REST-liknande API för prenumerationer (GET/POST/PUT/DELETE)  

│   ├── salary.php          # API för att hämta och uppdatera månadslön (GET/PUT)  

│   ├── login.php           # Inloggningsformulär och sessionhantering  

│   ├── register.php        # Registreringsformulär för nya användare  

│   ├── logout.php          # Avslutar sessionen och återvänder till startsidan  

│   ├── subslayer.php       # Huvudsida efter inloggning med formulär + lista  

│   └── chart.php           # Cirkeldiagram över kostnadsfördelning per tjänst  

│  

├── frontend/  

│   ├── css/  

│   │   └── style.css       # All design och layout  

│   └── js/  

│       ├── main.js         # Init, eventlyssnare och övergripande logik  

│       ├── api.js          # Alla fetch-anrop mot backend  

│       ├── currencies.js   # Valutahämtning, kurser och konvertering  

│       ├── render.js       # Renderingsfunktioner för tabell, redigering och diagram  

│       └── salary.js       # Lönehämtning, sparning och visning  

│  

└── db/  

    └── subslayer.sql       # Databasschema (tabeller för users + subscriptions)  
    
    
## Funktionalitet

1. **Autentisering**
   - Användare registrerar sig via `backend/register.php` (e-post och lösenord).
   - Inloggning sker på `backend/login.php`. Lösenord hashas med `password_hash`.
   - Inloggade användare skickas till `backend/subslayer.php`. Utloggning via `backend/logout.php`.

2. **Prenumerations-API**
   - `backend/api.php` kontrollerar sessionen och ger JSON-svar.
   - `GET` returnerar användarens prenumerationer sorterade på förfallodatum.
   - `POST` lägger till en ny prenumeration.
   - `PUT` uppdaterar kostnad och valuta för en befintlig prenumeration.
   - `DELETE` tar bort en prenumeration om den tillhör användaren.

3. **Lön**
   - `backend/salary.php` hanterar läsning och uppdatering av månadslön.
   - Lönen sparas per användare i databasen och är tillgänglig efter inloggning.
   - Används för att beräkna hur stor andel av lönen som går till prenumerationer.

4. **Frontend**
   - JS är uppdelat i moduler: `main.js`, `api.js`, `currencies.js`, `render.js` och `salary.js`.
   - Valutakurser hämtas från `https://api.frankfurter.dev` med SEK som bas.
   - Prenumerationer kan redigeras direkt i tabellen (kostnad och valuta).
   - Nästa tre förfallodatum visas med antal dagar kvar.
   - Pajdiagram visar hur stor andel av årslönen som går till prenumerationer.
   - Cirkeldiagram via `chart.php` visar kostnadsfördelning per tjänst.

5. **Databas**
   - `db/subslayer.sql` innehåller struktur för tabellerna `users` och `subscriptions`.
   - `users`-tabellen innehåller kolumnen `monthly_salary` för sparad månadslön.
   - Krav: MySQL/MariaDB med UTF8-support.

6. Säker databasanslutning
   - backend/db.php är konfigurerad för att läsa in känsliga uppgifter (lösenord, host etc.) från en extern fil. Detta förhindrar att dina inloggningsuppgifter exponeras i     källkoden.

   Instruktioner:
   - Skapa konfigurationsfil: Gå till mappen ovanför projektets rot (t.ex C:\laragon\config.projects\) och skapa en fil med namnet conf.ini.
   - Spara uppgifter: Lägg in din host, databasnamn, användarnamn och lösenord i .ini-filen (se format i koden).
   - Justera sökvägen: Öppna backend/db.php och kontrollera att sökvägen på rad 4 pekar korrekt mot din nyskapade .ini-fil.

   - Klart: Du har nu en säker anslutning där känslig data är separerad från projektets logik.
   
   - Extratips, det finns ett exempel på hur en .ini fil ska se ut i detta projektets root

7. Automatiska Påminnelser (E-post)
För att förbättra användarupplevelsen har systemet utökats med en bakgrundstjänst som skickar påminnelser inför kommande betalningar.

PHPMailer: Projektet använder det externa biblioteket PHPMailer för att skicka formaterade e-postmeddelanden. Biblioteket hanteras via Composer.

Automatisering (Task Scheduler): Genom att använda Windows Schemaläggare körs backend/notifier.php helt automatiskt en gång per dygn. Detta simulerar ett "Cron-jobb" som man vanligtvis använder på en Linux-server.

Loggning: Varje gång systemet kollar efter prenumerationer skrivs resultatet till backend/cron_log.txt. Loggen innehåller tidsstämpel, antal skickade mail och eventuella felmeddelanden för att underlätta felsökning.

Utvecklingsmiljö: Under utveckling används Mailpit för att fånga upp alla mail lokalt, vilket gör att inga riktiga mail skickas till användarnas adresser under testfasen.

> **OBS:** index.html länkar till inloggning/registrering. All backend-logik ligger i `backend/` och all frontend-kod i `frontend/`.



Framtidsplaner:

[x] ~~E-postpåminnelser vid kommande betalning.~~ (Implementerat via PHPMailer & Task Scheduler)

[x] Smart uppdatering av Billing_Date: Automatisera framskjutning av datum (månad/år) efter att påminnelse skickats.

[x] Dynamisk löneknapp: Ändra knapptext till "Redigera" om data redan finns i databasen.

[ ] Wall of Shame: Färdigställa den publika statistiken för de dyraste tjänsterna.

[ ] UI/UX Refactoring: Utveckla egen CSS med fokus på gränssnittsdesign och tillgänglighet.


För nya slutprojektet i skolan: 

8. Global Statistik (Publikt API)
En endpoint backend/global-stats.php som levererar de 10 dyraste prenumerationerna i systemet.

Datan är helt anonymiserad och innehåller ingen användarinformation.

API:et hanterar valutakonvertering internt för att kunna jämföra priser rättvist.

Detta ska visas på framsidan av subslayer som en "Wall of shame" typ till de företag som är mest pengagiriga.
