# SubSlayer

/subslayer
│
├── /backend
│   ├── config.php          # Databasanslutning (host, user, password)
│   ├── api.php             # Huvudfilen som hanterar alla anrop (GET, POST, DELETE)
│   └── functions.php       # Hjälpfunktioner (t.ex. räkna ut dagar till nästa betalning)
│
├── /frontend
│   ├── index.html          # Huvudsidan
│   ├── /css
│   │   └── style.css       # All design
│   └── /js
│       └── app.js          # JavaScript som hämtar data från api.php och uppdaterar HTML
│
├── /db
│   └── schema.sql          # En fil där man sparar sin CREATE TABLE-kod
