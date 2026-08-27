# 🎣 CescoSpot PRO - Fish on!

**CescoSpot PRO** è una Progressive Web App (PWA) moderna, avanzata e standalone, progettata su misura per gli appassionati di pesca da riva in acque dolci e salate. Funziona sia su dispositivi mobile (iOS e Android) che su desktop, con pieno supporto per la consultazione e l'utilizzo offline.

---

## 🚀 Novità e Aggiornamenti Recenti

- 📖 **Enciclopedia del Pescatore Espansa:** Sezione dedicata direttamente nella barra di navigazione inferiore con schemi vettoriali passo-passo visibili anche offline (Nodi completi come *Palomar*, *Amo a Paletta*, *Clinch*, *FG*, *Albright*, *Rapala*, schemi di *Spallinata*, *Pesca al Tocco*, *Running Rig*, *Method Feeder*, *Testine Piombate / Texas Rig*, tabelle di conversione PE/mm/lb e normative/divieti).
- 🧭 **Bussola Digitale Interattiva (Toggle On/Off):** Controllo di telemetria e orientamento con attivazione/disattivazione tramite tocco singolo sul pulsante dedicato.
- 🎯 **Navigazione Diretta Mappa ➔ Archivio:** Toccando un punto salvato sulla mappa è ora disponibile il pulsante rapido **"Vedi nell'Archivio"**, che apre automaticamente la scheda corrispondente nell'archivio espandendo la relativa zona ed evidenziandola.
- 🔄 **Ripristino Database Intelligente a 3 Opzioni:** Nuovo menu di dialogo per l'importazione dei backup JSON con scelta chiara tra **"Unisci agli attuali"**, **"Sostituisci tutto"** e **"Annulla operazione"**.
- 🐟 **Nuove Tecniche e Campi Unificati:** Aggiunta delle tecniche **"Pesca al tocco"** ed **"Esche siliconiche piombate"**, con supporto a selezione multipla sia nel salvataggio spot che nel diario catture.
- ⚡ **Accorpamento Automatico Punti Vicini:** Salvataggi consecutivi o spot rapidi nella stessa postazione (entro 20 metri) vengono accorpati nello stesso elemento senza generare doppioni.

---

## ✨ Funzionalità Principali

### 🗺️ Mappa & Navigazione Spot
- Livelli mappa satellitari ad alta risoluzione (Google Satellite) e topografici (OpenTopoMap).
- Salvataggio rapido dello spot al volo con geolocalizzazione automatica di comune e provincia.
- Misurazione interattiva di distanze e raggio di lancio sulla mappa.
- Marker personalizzabili con colori, icone tematiche o foto dell'accesso da riva.
- Pulsante rapido per avviare la navigazione verso lo spot tramite Google Maps.

### ☀️ Meteo, Fiumi, Onde & Solunare
- Previsioni orarie su 24 ore (temperatura, vento, pioggia, nuvolosità).
- Idrologia da riva: monitoraggio di portata e trend dei corsi d'acqua (Open-Meteo Flood API).
- Dati marini: altezza onde, periodo e temperatura dell'acqua.
- Calcolo della tendenza barometrica su 6 ore (hPa).
- Grafici solunari e stima dell'attività dei pesci con fasi lunari e finestre Major/Minor.

### 📚 Archivio & Diario Catture (Logbook)
- Organizzazione automatica degli spot per zona geografica con sezioni collassabili.
- Ricerca e filtri rapidi per tecnica, specie o parole chiave.
- Scheda catture dettagliata per ogni spot: peso, lunghezza, esche utilizzate, data/ora e foto della preda (compressa localmente).
- Esportazione e importazione in formato **JSON** e tracciati **GPX**.

---

## 📲 Installazione PWA

1. Apri l'app dal browser del tuo smartphone (Safari su iOS o Chrome su Android).
2. **iOS:** Tocca il pulsante di condivisione <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/arrow-up-from-bracket.svg" width="14"/> e seleziona **"Aggiungi alla schermata Home"**.
3. **Android:** Tocca il banner di installazione o il menu del browser e seleziona **"Installa app"**.

---

## 🛠️ Tecnologie Utilizzate

- **Frontend:** HTML5, CSS3 moderno (Design responsive & Dark Theme), Vanilla JavaScript (ES6+).
- **Mappe:** [Leaflet.js](https://leafletjs.com/) con layer Google Satellite e OpenTopoMap.
- **API Meteo & Idrologia:** [Open-Meteo API](https://open-meteo.com/).
- **Geocoding:** Nominatim (OpenStreetMap).
- **Icone:** Font Awesome 6.

---

## Sicurezza dei dati

- I backup JSON includono formato, versione e data di esportazione.
- Restano importabili anche i backup storici costituiti dal solo elenco degli spot.
- Prima dell'importazione vengono controllati coordinate, identificativi, campi, fotografie e catture.
- Un backup non valido viene rifiutato senza modificare l'archivio esistente.
- In caso di spazio locale esaurito, l'app mostra un avviso e consiglia di esportare subito un backup.

## Verifiche automatiche

I controlli sulla validazione dei dati possono essere eseguiti con:

```bash
node --test tests/data-safety.test.mjs
```
