# FAIRWAY IQ — stato progetto

## Checkpoint locale autorizzato — 16 ottobre 2026

L’utente ha autorizzato esplicitamente i tre commit locali con «si autorizza», dopo la proposta senza push. Creati `5783aa7` (backend: validazione Unicode, purpose token e cache auth) e `d3feb56` (mobile: Home dai round salvati, persistenza, form e accessibilità). Questa nota e la documentazione vengono raccolte nel terzo commit `docs: record verified sprint and checkpoint review`; alla ripresa ricavare il suo hash da Git. Nessun push autorizzato o eseguito. Nessuna migrazione/deploy/upgrade dipendenze.

Prima di ogni commit verificati branch main, elenco/diff dei file staged, esclusione di segreti e artefatti e git diff --cached --check. Nessun codice funzionale modificato per creare i commit: conservati i risultati precedenti (109 backend passati/15 integrazioni saltate, 93 mobile passati, typecheck/lint/build e bundle). Checklist iPhone principale confermata dall’utente; limiti delle verifiche già documentati.

Prossima azione: ispezionare Git e confermare lo stato del checkpoint locale; non ripetere i commit già creati. Se richiesto, approfondire remediation delle dipendenze Expo compatibili; un eventuale push richiede autorizzazione separata. Restano 28 findings mobile, test PostgreSQL isolati da eseguire e controlli VoiceOver/Unicode/offline non confermati individualmente. Il divieto precedente di commit è stato revocato solo per questi tre commit locali, non per operazioni future o push.

Questo aggiornamento sostituisce le precedenti indicazioni di attesa dell’autorizzazione e di lavoro Home/sprint non committato. Verificare sempre lo stato reale con git status.


## Revisione checkpoint — 16 ottobre 2026

Eseguita revisione del diff Home/sprint e dei nuovi file; nessun nuovo difetto bloccante individuato nel perimetro esaminato. Proposta concreta in [checkpoint-review-2026-10-16.md](checkpoint-review-2026-10-16.md): tre commit locali separati per backend, mobile e documentazione, da eseguire solo dopo autorizzazione esplicita. Nulla staged, nessun commit/push. main a acbf216; nessun fetch.

Controlli nuovi: diff/indice, esclusione .env e artefatti, scansione pattern credenziali sui file pendenti e git diff --check superati. Nessun codice funzionale cambiato durante la revisione; non ripetute inutilmente le suite già passate (109 backend/15 skip, 93 mobile, typecheck/lint/build). Test iPhone principali confermati dall’utente nel messaggio precedente; VoiceOver opzionale e casi Unicode/offline non confermati individualmente.

Prossima azione: attendere autorizzazione esplicita ai commit locali oppure indicazione di approfondire le remediation dipendenze. Non eseguire commit/push in base al solo «vai al secondo step». Restano 28 findings mobile, integrazioni PostgreSQL non eseguite e limiti produzione. Osservazione minore di copy in Profile documentata nella revisione; nessuna UI cambiata per questa attività.

Questo aggiornamento prevale sulle priorità storiche sotto: la revisione di preparazione checkpoint è completata.


## Conferma utente — 16 ottobre 2026, regression test iPhone

Dopo la guida ai test di login corretto/errato e logout, Riduci movimento, fine anticipata con Keep playing, riepilogo 2/9, Home e persistenza dopo riapertura, l’utente ha risposto «funziona tutto». Registrata conferma complessiva riferita dall’utente della checklist principale; non è osservazione diretta dell’agente. VoiceOver era un controllo opzionale e non è confermato separatamente; nemmeno registrazione Unicode, guasti storage/offline, casi di sicurezza sintetici o integrazioni PostgreSQL vanno considerati verificati su device per questa risposta.

La checklist principale iPhone non è più il blocco di ripresa. Prossima azione: revisione del diff Home/sprint per preparare un eventuale checkpoint, oppure approfondimento delle remediation Expo compatibili su richiesta. Nessuna autorizzazione implicita a commit/push: il divieto dello sprint resta valido finché l’utente non lo modifica esplicitamente.

Aggiornamento solo documentale: CURRENT_STATE, NEXT_SESSION, project-status e development-log. Nessun test funzionale rieseguito; esiti precedenti 109 backend passati/15 saltati e 93 mobile passati, typecheck/lint/build, restano evidenza storica dello sprint. Controllo nuovo: git diff --check. Branch main, HEAD acbf216; modifiche precedenti preservate, tutte non staged/non committate. Nessun commit, push o operazione database.

Questo aggiornamento prevale sulle istruzioni storiche sotto che richiedono nuovamente la checklist principale iPhone.


## Checkpoint corrente — 16 ottobre 2026, sprint autonomo concluso

Questo checkpoint prevale sulle priorità storiche sottostanti. Rapporto completo in inglese: [2026-10-16-autonomous-sprint-report.md](daily-reports/2026-10-16-autonomous-sprint-report.md). Sprint richiesto da 120 minuti, ma l’esecuzione ha attraversato un’interruzione/attesa dei permessi computer: non dichiarare 120 minuti di sviluppo continuo. Orologio verificato: avvio 15 ottobre 22:56:25 UTC, controllo finale 16 ottobre 18:44:17 UTC (19h 47m 52s wall-clock, non tempo attivo). Chiamata computer riportata in attesa per 5123.0968 secondi, terminata senza permessi; durata attiva non ricostruibile. Il contatore di esecuzione ha registrato separatamente 5912 secondi (98m 32s), inclusa l’attesa: non è una misura del lavoro attivo.

- Corretto l’ordine concorrente lettura/scrittura dei round; regressioni su errori storage, limite 1000, date e tutte le lunghezze 1–9/18 della fine anticipata.
- Autenticazione: no-store/no-cache anche per errori gestiti e throttle; password con surrogate isolate respinte prima di hashing/query; validazione token fail-closed per purpose sconosciuto. Argon2id, salt, work path dummy, input annidati e Unicode coperti da test.
- Mobile: conteggio Unicode e whitespace password allineati al backend, cap input adattati; race preferenza Riduci movimento risolta; stato busy/disabled del bottone logout accessibile e testo che chiarisce strokes comprensivi dei putt. Nessun redesign.
- Test finali 16 ottobre: backend **109 passati, 15 saltati**, una deprecazione Starlette/httpx; mobile **93 passati**, typecheck/lint passati; web build/lint passati. Export iOS/Android/web completato nella prima parte dello sprint. Nessun nuovo test manuale iPhone/browser effettuato dall’agente.
- Audit online eseguito il 15 ottobre: mobile 28 findings (18 high, 10 moderate), web zero. Nessun upgrade o lockfile modificato. Backend pip check passato: è compatibilità delle dipendenze, non scansione advisory Python. Documentati triage e piano JWT, solo proposta.
- Git: main, HEAD acbf216; origin/main è il riferimento locale (nessun fetch). Home/memoria preesistenti preservate; nuove modifiche sprint tutte non staged/non committate. Nessun commit, push, deploy, migrazione, reset o lettura del contenuto .env.

**Esatta prossima azione:** leggere il rapporto e ispezionare Git; su iPhone fare Reload e provare registrazione/login con normali password Unicode valide, logout/busy e Riduci movimento, quindi round parziale e completo, storico/ritorno Home senza perdita draft. Non ripetere il setup Wi-Fi già confermato. I controlli Home da 9, esclusione parziale, persistenza e filtro 18 erano già confermati dall’utente prima dello sprint; non attribuire questi riscontri alle nuove modifiche. Test PostgreSQL soltanto con TEST_DATABASE_URL isolato esplicitamente configurato; nessuna migrazione implicita. Approfondire poi decoder URI e fix Expo compatibili, con approvazione per major upgrade. Nessun commit/push senza nuova autorizzazione.


## Aggiornamento corrente — 15 ottobre 2026, Home dai round locali

L’utente ha dichiarato che non ci sono altri bug da segnalare e ha autorizzato il passo successivo: collegare Home ai round salvati. Implementazione completata. Dopo il controllo proposto su Home → 9 holes → Last complete round, l’utente ha confermato «si funziona»: risultato atteso 42.0 dal round completo, con esclusione del parziale. Conferma riferita dall’utente, senza screenshot della Home; non estenderla agli altri filtri o casi.

- Home usa lo storico locale validato; rilegge i dati a ogni focus, senza scrivere snapshot. Store condiviso con il tracker per rispettare la coda di salvataggio; nessun cambio a schema/storage o dipendenze.
- Filtri 9/18 buche separati; ultimo giro completo o media degli ultimi cinque completi della lunghezza scelta. Parziali esclusi dalle medie, presenti nei cinque ultimi giri con giocate/pianificate e totali reali. Nessun handicap o percentuali fairway/green inventati.
- Stati vuoto/caricamento/errore e retry; informativa dati condivisi tra account e preview, locali e non sincronizzati. Stile, animazione di ingresso e route conservati. La Home della preview ora mostra la stessa libreria locale, dichiarata esplicitamente.
- Controlli nuovi: typecheck e lint passati; 75 test mobile passati, zero skip/fallimenti (sei nuovi casi per calcoli dashboard). Nessuna verifica visiva, VoiceOver, responsive su device o integrazione hook/UI automatizzata: restano da provare su iPhone. Backend/web/export non rieseguiti, nessuna modifica a quei sottosistemi.
- Git: branch main, checkpoint acbf216; modifiche documentali precedenti preservate e nuove modifiche Home non staged/non committate. Nessun commit, push, migrazione o accesso al contenuto .env.

Conferma aggiuntiva del 15 ottobre: l’utente riferisce «si rimane tutto» dopo la richiesta di chiudere e riaprire l’app; persistenza dei risultati Home confermata dall’utente. Alla successiva richiesta di controllare il filtro 18 buche, l’utente ha risposto «funziona»: registrata conferma utente anche di quel controllo. Verifiche principali Home concluse: ultimo completo da 9, esclusione parziale, persistenza dopo riapertura e filtro 18. Prossima azione: attendere la scelta dell’utente per revisione/commit oppure ulteriore lavoro; non eseguire commit/push né iniziare nuove funzionalità senza autorizzazione. Last 5, aggiornamento dopo un nuovo salvataggio, putt, stato vuoto/errori e accessibilità non hanno ancora conferma individuale. Non ripetere il controllo 42.0 già confermato, non cancellare dati per i test e non iniziare nuove funzionalità senza autorizzazione.

Questo aggiornamento prevale sulle vecchie priorità storiche sottostanti: non chiedere nuovamente altri bug né ripetere il setup autenticazione già confermato.


## Aggiornamento corrente — 15 ottobre 2026, prova iPhone

Dopo la sequenza proposta per la fine anticipata a 3/9 buche, l’utente ha risposto «funziona». Registrata come conferma utente del flusso di fine anticipata su iPhone, non come prova eseguita dall’agente. Non sono stati forniti risultati separati per Keep playing, totali e riapertura dopo reload: non attribuire una verifica individuale a questi casi.

La precedente priorità di ottenere conferma della fine anticipata è soddisfatta a livello di riscontro utente. Prossima azione: chiedere il prossimo bug già segnalato, raccogliere passaggi e risultato atteso/effettivo; correggere solo dopo averlo identificato. Non avviare nuove funzionalità. I dettagli precedenti sotto sono contesto storico e non impongono di ripetere il setup o la prova appena confermata.

Git verificato: `main`, HEAD `acbf216`; al controllo iniziale working tree pulito e allineato al riferimento locale `origin/main`, senza fetch. Questo aggiornamento modifica soltanto i quattro documenti di memoria, senza staging, commit, push o operazioni database. Nessun test funzionale rieseguito: nessun codice modificato; i 69 test mobile/typecheck/lint rimangono evidenza precedente. Controllo corrente: `git diff --check`.


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
