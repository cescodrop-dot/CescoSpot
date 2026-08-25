# 🎣 CescoSpot PRO - Fish on!

**CescoSpot PRO** è una Progressive Web App (PWA) moderna, leggera e completa, sviluppata su misura per chi pratica la **pesca sportiva da riva** (acque interne e mare). Permette di mappare i propri spot segreti, monitorare le condizioni meteo e idrologiche in tempo reale, consultare i picchi di attività solunare e registrare un diario fotografico dettagliato delle catture.

---

## 🌟 Funzionalità Principali

### 🗺️ Mappatura & Navigazione da Riva
* **Mappa Satellitare & Topografica**: Visualizzazione ad alta definizione con supporto a mappe satellitari e curve di livello.
* **Geocoding Integrato**: Barra di ricerca per trovare laghi, fiumi, scogliere, spiagge o indirizzi in tutta Italia e all'estero.
* **Marker Personalizzati**: Assegna ad ogni spot colore, note, tecnica di pesca, specie target e icone tematiche (pin, spot pesce, ostacolo sommerso, parcheggio/accesso al sentiero, ecc.).
* **Foto della Postazione**: Scatta o carica direttamente una foto dell'accesso o dello spot con compressione automatica lato client.
* **Righello di Misurazione**: Calcola con precisione millimetrica la distanza da riva (m o km).
* **Navigazione con un Tap**: Apertura istantanea delle coordinate su Google Maps o Apple Maps per raggiungere lo spot.

### 🧭 Telemetria & GPS in Tempo Reale
* **Bussola Digitale Live**: Tracciamento dell'orientamento magnetico (HDG) con indicatore di rotta fluido anti-scatto e azzeramento latenza.
* **GPS con Raggio di Precisione**: Localizzazione precisa dell'utente con cerchio di accuratezza visivo.

### 🌤️ Meteo Avanzato, Idrologia & Maree da Riva
* **Meteo Professionale Live**: Temperatura, temperatura percepita, umidità, velocità e direzione del vento, copertura nuvolosa e pioggia via *Open-Meteo*.
* **Tendenza Barometrica (6h)**: Rilevamento della variazione di pressione nelle ultime 6 ore (in calo rapido, in salita o stabile) per individuare le finestre di caccia dei predatori.
* **Luce & Golden Hour**: Orari precisi di Alba, Tramonto e finestre di Golden Hour mattutina e serale.
* **Idrologia & Portata Fiumi (Novità)**: Stima della portata del flusso fluviale ($m^3/s$) e stato del corso d'acqua (pescabile, in salita/torbido, piena o calo/chiarificazione) via *Copernicus / Flood API*.
* **Stato del Mare & Maree**: Altezza delle onde (m), periodo dell'onda (s), stato di marea (salita, discesa, picchi) e orario del prossimo picco.
* **Tavole Solunari**: Indice di attività dei pesci (%) con calcolo automatico dei periodi *Major* e *Minor* e fase lunare in tempo reale.

### 📖 Diario delle Catture (Logbook) & Archivio
* **Diario per Spot**: Registra specie, peso (kg), lunghezza (cm), esca/artificiale utilizzato, data/ora e foto della preda.
* **Filtro Rapido per Tecniche**: Filtra gli spot salvati con un tocco (Spinning, Feeder, Carpfishing, Mosca, Galleggiante/Bolognese, Fondo/Surfcasting, Trout Area).
* **Condivisione Rapida**: Invia lo spot con coordinate e link di navigazione su WhatsApp, Telegram o SMS tramite Web Share API.
* **Backup & Ripristino JSON**: Esporta e importa i tuoi dati in totale sicurezza senza dipendere da database esterni (tutti i dati rimangono privati sul dispositivo).

---

## 📱 Installazione come App (PWA)

L'applicazione è 100% autonoma e compatibile con **iOS (iPhone/iPad)** e **Android**.

### Su iOS (Safari):
1. Apri il link del sito su **Safari**.
2. Tocca il pulsante **Condividi** (il quadrato con la freccia verso l'alto).
3. Scorri verso il basso e seleziona **"Aggiungi alla schermata Home"**.
4. Conferma: l'app comparirà sulla tua Home con l'icona ufficiale a tutto schermo.

### Su Android (Chrome):
1. Apri il link del sito su **Google Chrome**.
2. Tocca il banner di installazione in alto oppure i tre puntini in alto a destra e scegli **"Installa app"** o **"Aggiungi a schermata Home"**.

---

## 📂 Struttura del Repository

```text
├── index.html       # Codice sorgente completo dell'applicazione (HTML, CSS e JavaScript)
├── map.png          # Icona ufficiale in alta risoluzione (512x512)
└── README.md        # Documentazione del progetto
