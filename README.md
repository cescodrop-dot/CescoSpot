# 🎣 CescoSpot PRO - Fish on!

**CescoSpot PRO** è una Progressive Web App (PWA) avanzata, autonoma e leggera, progettata su misura per gli appassionati di **pesca sportiva da riva** (acque interne e mare). Permette di mappare i propri spot segreti, monitorare in tempo reale le condizioni meteo, idrologiche e marine, calcolare i picchi di attività solunare, consultare prontuari di nodi/fili e gestire un diario fotografico completo delle catture.

---

## 🎮 Guida ai Tasti e all'Interfaccia

### 🧭 Barra Superiore (Telemetria & Bussola)
* **Traccia Bussola & Cursore Rosso**: Mostra l'orientamento in tempo reale con i punti cardinali evidenziati dinamicamente.
* **Valore HDG (Heading)**: Gradi bussola attuali (da 0° a 359°).
* **Tasto "Attiva / Bussola" (`📍 / 🧭`)**: Richiede e attiva i sensori di orientamento magnetico del dispositivo (su iOS/Safari richiede il permesso esplicito).

---

### 🗺️ Schermata Mappa

#### Controlli a Sinistra (In alto)
* **Lente d'ingrandimento (`🔍`)**: Apre la barra di ricerca luoghi/geocoder per trovare rapidamente città, fiumi, laghi o scogliere.
* **Luna / Sole (`🌙 / ☀️`) - Modalità Notturna**: Attiva la modalità **Night Red Mode** a luce rossa e fondo nero per preservare la vista notturna e non insospettire i pesci sotto riva.
* **Nodi (`🪢 / 🌐`) - Prontuario Nodi & Fili**: Apre il prontuario rapido con istruzioni sui nodi fondamentali (*Palomar, FG, Albright, Senza Nodo*) e la tabella di conversione fili (*PE ⇄ mm ⇄ lb ⇄ kg*).
* **Tasti Zoom (`+` / `-`)**: Aumentano o riducono il livello di ingrandimento della cartografia.

#### Controlli a Destra (In alto)
* **Livelli Mappa (`📚 / 🗺️`)**: Alterna tra la **Mappa Satellitare ad alta risoluzione** (Esri ArcGIS) e la **Mappa Topografica** (OpenTopoMap con curve di livello).
* **Righello (`📐`)**: Attiva lo strumento di misurazione metrica. Tocca due o più punti sulla mappa per misurare la distanza esatta di lancio o di percorso (in metri o chilometri).

#### Controlli in Basso
* **Mirino GPS (`🎯`)** *(in basso a sinistra)*: Attiva/disattiva il tracciamento GPS in tempo reale, mostrando la posizione e il raggio di precisione del segnale.
* **Fulmine (`⚡`) - Spot Rapido al Volo** *(in basso a sinistra)*: Salva all'istante la tua posizione GPS corrente come spot ("*Spot Rapido [Ora]*") con un solo tocco, senza dover compilare subito il modulo.
* **Pulsante Più (`+`)** *(in basso a destra, grande)*: Apre il modulo manuale per creare e salvare un nuovo spot personalizzato (nome, zona, tecnica, raggio di lancio, target, foto postazione, note, colore e icona).

---

### 🌤️ Schermata Meteo & Fiumi
* **Hero Card Principale**: Visualizza meteo attuale con icona, temperatura reale e descrizione sintetica.
* **Previsioni Orarie 24h (Slider)**: Riga a scorrimento orizzontale per consultare temperatura, meteo e vento ora per ora nelle prossime 24 ore.
* **Idrologia & Fiumi da Riva**:
  * **Portata Flusso ($m^3/s$)**: Metri cubi al secondo transitanti nel bacino fluviale più vicino (*via Copernicus Flood API*).
  * **Stato & Trend Fiume**: Indica se il corso d'acqua è *Pescabile/Regolare*, *In salita/Torbido* o *In calo/Acqua che schiarisce*.
* **Barometro & Condizioni**:
  * **Tendenza Pressione (6h)**: Indica se la pressione è in rapido calo, salita o stabile.
  * **Metriche Dettagliate**: Temperatura percepita, umidità, velocità/direzione del vento, pressione (hPa), pioggia e copertura nuvolosa.
* **Luce & Golden Hour**: Orari esatti di Alba, Tramonto e finestre di Golden Hour mattutina e serale.
* **Mare & Maree da Riva**: Temperatura superficiale del mare (°C), altezza onde (m), periodo onda (s) e fase di marea (Salita, Discesa, Alta, Bassa).
* **Solunare & Attività**: Percentuale di attività stimata dei pesci, fase lunare e finestre dei periodi *Major* e *Minor*.
* **Tasto "Aggiorna Condizioni"**: Ricarica tutti i dati meteo, marini e idrologici in base al punto centrale della mappa.

---

### 📂 Schermata Archivio & Diario

#### Barra Superiore & Filtri
* **Barra di Ricerca (`🔍`)**: Filtra all'istante gli spot salvati per nome, specie target, note o zona.
* **Barra Tecniche (Chip orizzontali)**: Filtra gli spot con un tocco in base alla tecnica selezionata (*Tutte, Spinning, Feeder, Carpfishing, Mosca, Galleggiante, Fondo/Surf, Trout Area*).
* **Backup JSON (`📥`)**: Salva tutti i tuoi dati e le foto in un file `.json` sul telefono/computer.
* **Esporta GPX (`🗺️`)**: Esporta i tuoi spot in formato `.gpx` standard per caricarli su Google Earth, Garmin o navigatori esterni.
* **Ripristina (`📤`)**: Carica un backup `.json` precedentemente esportato.

#### Schede Spot (Pulsanti Azione: 3 sopra, 2 sotto)
* **Percorso / Naviga (`🛣️`, verde)**: Apre le coordinate esatte su Google Maps per guidarti fino alla postazione.
* **Condividi (`🔗`, giallo)**: Invia coordinate e dettagli dello spot tramite WhatsApp, Telegram o SMS.
* **Diario Catture (`📖`, arancione)**: Apre il logbook dello spot dove puoi registrare peso (kg), lunghezza (cm), esca usata, data/ora e scattare/allegare la **foto della preda**.
* **Modifica (`✏️`, azzurro)**: Modifica i parametri, il raggio di lancio, la foto o le note dello spot.
* **Elimina (`🗑️`, rosso)**: Rimuove definitivamente lo spot e il relativo diario catture.

---

## 📱 Installazione come App Nativa (PWA)

### Su iOS (iPhone / iPad su Safari):
1. Apri il link del sito su **Safari**.
2. Tocca l'icona **Condividi** (il quadrato con la freccia verso l'alto).
3. Scorri l'elenco e tocca **"Aggiungi alla schermata Home"**.
4. Conferma: l'app si avvierà a schermo intero senza barre del browser con l'icona ufficiale `map.png`.

### Su Android (Google Chrome):
1. Apri il link del sito su **Chrome**.
2. Tocca il banner di installazione in alto oppure i tre puntini in alto a destra e seleziona **"Installa app"** o **"Aggiungi a schermata Home"**.

---

## 🛠️ Architettura Tecnica & API

* **Frontend**: HTML5, CSS3 moderno (Glassmorphism, Safe Area Insets iOS, Night Mode CSS, Flexbox/Grid).
* **JavaScript**: Vanilla ES6+ modulare, Canvas API per compressione automatica immagini, Web Share API, Geolocation API, DeviceOrientation API.
* **Mappe & GIS**: [Leaflet.js](https://leafletjs.com/) con layer satellitari Esri World Imagery e topografici OpenTopoMap.
* **Geocoding & Toponimi**: [Nominatim / OpenStreetMap](https://nominatim.org/).
* **Dati Meteo & Idrologici**: [Open-Meteo API](https://open-meteo.com/) (Meteo & Marine) e [Copernicus Flood API](https://open-meteo.com/en/docs/flood-api).
* **Grafica & Icone**: [FontAwesome 6](https://fontawesome.com/).

---

## 🔒 Privacy & Salvataggio Dati

Tutti i dati (coordinate, spot, foto della postazione, foto delle catture e logbook) sono archiviati **esclusivamente nel `localStorage` del tuo dispositivo**. Nessuna informazione personale viene inviata o registrata su server esterni.

---

## 📄 Licenza

Distribuito sotto licenza **MIT**.
