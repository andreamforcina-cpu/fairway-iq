# FAIRWAY IQ — stato progetto

> Checkpoint pubblicato il 15 ottobre 2026: push su `origin/main` riuscito fino a **c40c396**, comprendente autenticazione (`75eced0`), tracker, fine anticipata e memoria. Gli stati Git e le mancate autorizzazioni descritti sotto sono ricognizioni storiche precedenti alla pubblicazione. Questo successivo aggiornamento documentale registra l’esito; alla ripresa controllare HEAD e sincronizzazione effettivi con Git. Le prove iPhone della fine anticipata restano pendenti.

Aggiornato il **15 ottobre 2026**, America/New_York. Quadro sintetico; dettagli verificabili in [CURRENT_STATE.md](CURRENT_STATE.md), ripresa in [NEXT_SESSION.md](NEXT_SESSION.md). Nessuna percentuale di completamento stimata.

| Area | Implementato | Limiti e prossimo controllo |
| --- | --- | --- |
| Backend | Health, registrazione, credenziali, sessioni opache, refresh/revoca/logout/me, rate limit locale | Produzione da rafforzare; runtime e database non ricontrollati oggi |
| Database | Migrazioni utenti/sessioni e ORM presenti; applicazione locale registrata nella documentazione | Stato live non verificato; nessuna migrazione autorizzata per questa attività |
| Autenticazione mobile | Integrazione API, SecureStore, restore, Profile, logout, route protette | Flusso base confermato dall'utente; refresh dopo scadenza, offline e deep link ancora non verificati sul dispositivo |
| Tracker round | Calcoli 9/18, draft persistente, storico, scorecard parziali e conferma fine anticipata | **Task attivo: provare fine anticipata su iPhone e correggere i bug segnalati** |
| Dashboard mobile | Preview e filtri su campioni | Non calcola statistiche dai round salvati |
| Analytics / AI Coach | Schermate placeholder | Nessuna analisi reale o servizio AI; fuori dal task attivo |
| Web | Homepage e demo con dati statici | Build/lint non verificati in questo checkpoint; nessuna integrazione account rivendicata |
| Memoria persistente | File di stato, handoff, log, quadro progetto e protocollo AGENTS.md | Aggiornare al termine delle sessioni; verificare sempre contro codice/Git |

## Checkpoint e verifiche

`main` a `75eced0` (autenticazione), un commit avanti al riferimento locale `origin/main`; remoto non consultato. Tracker e memoria ancora non committati, nulla in staging alla ricognizione; nessun commit/push autorizzato adesso.

Mobile: typecheck, lint e 69 test passati il 15 ottobre. Backend: precedente esecuzione 70 passati/15 saltati; 85/85 su database isolato soltanto evidenza storica documentata. Export iOS passato prima della correzione di fine anticipata. Nessun nuovo esito web/device inferito. Controlli documentali/whitespace nel [log](development-log.md).

## Priorità e decisioni aperte

1. Riprendere iPhone con codice aggiornato; confermare fine a 3/9, Keep playing, salvataggio e riapertura parziale. Distinguere dati invalidi (putts > strokes) dal blocco del vecchio flusso.
2. Raccogliere gli altri bug non ancora descritti; riprodurre/correggere e registrare le verifiche.
3. Solo dopo chiusura del task, valutare revisione e richiesta di autorizzazione per commit/push. Non partire da nuove funzionalità.

Rischi aperti: dati round non cifrati e condivisi sul dispositivo, nessun sync/export/eliminazione; accessibilità/Android/offline non verificati; advisory Expo/React Native della scansione precedente e protezioni backend di produzione incomplete. Dettagli e limiti in CURRENT_STATE.md. Nessun segreto o contenuto `.env` nei checkpoint.
