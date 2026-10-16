# FAIRWAY IQ — development log

> Checkpoint pubblicato il 15 ottobre 2026: push su `origin/main` riuscito fino a **c40c396**, comprendente autenticazione (`75eced0`), tracker, fine anticipata e memoria. Gli stati Git e le mancate autorizzazioni descritti sotto sono ricognizioni storiche precedenti alla pubblicazione. Questo successivo aggiornamento documentale registra l’esito; alla ripresa controllare HEAD e sincronizzazione effettivi con Git. Le prove iPhone della fine anticipata restano pendenti.

Registrare progressi datati, evidenze, limiti e decisioni; non inserire segreti o contenuti di ambiente privati. Lo stato corrente è in [CURRENT_STATE.md](CURRENT_STATE.md), l'azione successiva in [NEXT_SESSION.md](NEXT_SESSION.md). Le voci storiche non sostituiscono nuove verifiche.

## 15 ottobre 2026 — memoria persistente e handoff

### Attività completata in questo checkpoint

- Letti AGENTS.md, manifest, sorgenti web/backend/mobile pertinenti, documenti di autenticazione/sessioni e tracker; ispezionati Git e guardie di configurazione. Non letti `.env` privati.
- Creati CURRENT_STATE.md, NEXT_SESSION.md, project-status.md e questo log. Aggiunte regole permanenti di avvio/fine sessione e protocollo di ripresa ad AGENTS.md, preservando tutte le istruzioni precedenti.
- Contrassegnato il vecchio `docs/next-session.md` come storico: le sue priorità aggregate (prima refresh, poi persistenza, poi fine anticipata) non erano più un handoff univoco. Il nuovo NEXT_SESSION.md dà priorità alla verifica/correzione del round tracker, secondo la richiesta più recente dell'utente.
- Distinte implementazione, risultati automatici, conferme dell'utente e aspetti non verificati. Nessuna funzionalità dell'app cambiata in questo checkpoint.

### Evidenza corrente

- Da `mobile/`: `npm run typecheck`, `npm run lint`, `npm test`: superati, **69 passati**, zero fallimenti/skip.
- Verifica finale memoria: quattro file richiesti presenti e non vuoti; sezioni/prossima azione/approvazioni presenti, link locali validi, riferimenti in AGENTS.md, controllo automatico di pattern di segreti sui file di memoria e revisione contenuti superati; `git diff --check` superato.
- `.env` mobile/backend, dipendenze, cache Expo e output build controllati come ignorati da Git.
- Non rieseguiti backend, web o export iOS: modifica solo documentale e test mobile per confermare il checkpoint. Nessun database interrogato o migrato. Nessuna prova manuale iPhone effettuata dall'agente.

### Git

Branch `main`, HEAD `75eced0`, tracking locale `origin/main` un commit indietro a main; nessun fetch, quindi nessuna conclusione sul remoto live. Nessun file staged. Preservate le modifiche del tracker: route, componenti/hook/storage nuovi, utils/types, test, package/lock e docs round/handoff. Aggiunti i quattro documenti di memoria e modificati AGENTS.md e il rimando legacy. Non committato, non pubblicato; nessun consenso nuovo per commit/push/migrazioni.

### Task sospeso e decisioni

Utente vuole testare meglio il tracker al prossimo incontro. Fine anticipata implementata, ma conferma/cancellazione e reload di scorecard parziali non ancora confermati sul telefono. L'ultimo screenshot mostra 2 strokes/3 putts, che viola il conteggio totale comprensivo dei putt; non disabilitare questa validazione. L'utente segnala altri bug non ancora descritti.

Prossima azione precisa: caricare la versione aggiornata su iPhone e seguire il caso 3/9 descritto in NEXT_SESSION.md; raccogliere gli altri bug e correggerli prima di chiedere commit/push. Nessuna nuova feature, sync, migrazione o major upgrade nel perimetro attuale.

### Evidenza precedente conservata, non rieseguita qui

- Autenticazione in commit `75eced0`: sessioni backend/mobile; l'utente ha confermato health, registrazione, login, Profile, restore e logout su Wi-Fi domestico. Refresh dopo scadenza assunto, non dispositivo-verificato.
- Backend osservato precedentemente: 70 test passati, 15 saltati per assenza di URL di test isolato; deprecazione Starlette/httpx. Documentazione backend registra 85/85 su database isolato e migrazione locale sessioni autorizzata: dati storici, stato live non ricontrollato.
- Persistenza round: utente ha confermato salvataggio e storico dopo reload prima della correzione fine anticipata. Export iOS passato prima della correzione; 64 test allora, 69 dopo le regressioni sulla conclusione parziale.
- Audit precedente: 28 advisory (10 moderate/18 high), nomi nell'albero preesistente Expo/React Native, nessuno attribuito ad AsyncStorage o dipendenze aggiunte. Nessuna nuova scansione in questo checkpoint; non applicati upgrade.


## 15 ottobre 2026 — checkpoint e pubblicazione autorizzati

L’utente ha successivamente richiesto «fai tutto», autorizzando commit e push delle modifiche pendenti. Riesaminati branch, file e whitespace; i 69 test mobile, typecheck e lint erano già passati in questa sessione e il codice non è stato modificato dopo quei controlli. Nessun test ripetuto senza necessità. Controllare staged diff, assenza di segreti/artifact e whitespace prima del commit. Il commit include tracker locale, fine anticipata, test e memoria; l’autenticazione era già nel commit locale 75eced0. Push previsto su origin/main, senza force; l’esito definitivo è verificabile tramite Git e il rapporto finale. Rimane da testare su iPhone la fine anticipata; nessuna migrazione o nuova funzionalità aggiunta durante questa pubblicazione.


### Esito della pubblicazione

Creato `c40c396` — `feat(mobile): persist rounds and support early finish`. Controllo whitespace staged e scansione dei file staged per credenziali/artifact superati; `.env` esclusi. `git push origin main` completato con successo, avanzando il remoto da `774e8d7` a `c40c396`: incluso anche il precedente commit locale di autenticazione `75eced0`. Questo aggiornamento documentale salva l’esito confermato e sarà incluso in un ulteriore commit di memoria nella stessa pubblicazione autorizzata. Nessun cambiamento funzionale dopo i 69 test passati. Prossimo task invariato: test iPhone della fine anticipata.


## Aggiornamento corrente — 15 ottobre 2026, prova iPhone

Dopo la sequenza proposta per la fine anticipata a 3/9 buche, l’utente ha risposto «funziona». Registrata come conferma utente del flusso di fine anticipata su iPhone, non come prova eseguita dall’agente. Non sono stati forniti risultati separati per Keep playing, totali e riapertura dopo reload: non attribuire una verifica individuale a questi casi.

La precedente priorità di ottenere conferma della fine anticipata è soddisfatta a livello di riscontro utente. Prossima azione: chiedere il prossimo bug già segnalato, raccogliere passaggi e risultato atteso/effettivo; correggere solo dopo averlo identificato. Non avviare nuove funzionalità. I dettagli precedenti sotto sono contesto storico e non impongono di ripetere il setup o la prova appena confermata.

Git verificato: `main`, HEAD `acbf216`; al controllo iniziale working tree pulito e allineato al riferimento locale `origin/main`, senza fetch. Questo aggiornamento modifica soltanto i quattro documenti di memoria, senza staging, commit, push o operazioni database. Nessun test funzionale rieseguito: nessun codice modificato; i 69 test mobile/typecheck/lint rimangono evidenza precedente. Controllo corrente: `git diff --check`.

## Aggiornamento corrente — 15 ottobre 2026, Home dai round locali

L’utente ha dichiarato che non ci sono altri bug da segnalare e ha autorizzato il passo successivo: collegare Home ai round salvati. Implementazione completata, verifica iPhone della nuova Home ancora pendente.

- Home usa lo storico locale validato; rilegge i dati a ogni focus, senza scrivere snapshot. Store condiviso con il tracker per rispettare la coda di salvataggio; nessun cambio a schema/storage o dipendenze.
- Filtri 9/18 buche separati; ultimo giro completo o media degli ultimi cinque completi della lunghezza scelta. Parziali esclusi dalle medie, presenti nei cinque ultimi giri con giocate/pianificate e totali reali. Nessun handicap o percentuali fairway/green inventati.
- Stati vuoto/caricamento/errore e retry; informativa dati condivisi tra account e preview, locali e non sincronizzati. Stile, animazione di ingresso e route conservati. La Home della preview ora mostra la stessa libreria locale, dichiarata esplicitamente.
- Controlli nuovi: typecheck e lint passati; 75 test mobile passati, zero skip/fallimenti (sei nuovi casi per calcoli dashboard). Nessuna verifica visiva, VoiceOver, responsive su device o integrazione hook/UI automatizzata: restano da provare su iPhone. Backend/web/export non rieseguiti, nessuna modifica a quei sottosistemi.
- Git: branch main, checkpoint acbf216; modifiche documentali precedenti preservate e nuove modifiche Home non staged/non committate. Nessun commit, push, migrazione o accesso al contenuto .env.

Prossima azione esatta: Reload su iPhone, aprire Home e controllare che il round parziale confermato compaia negli ultimi giri senza contribuire alle medie. Salvare un giro completo da 9 buche con par 4, strokes 5, putts 2 per ogni buca: tornando a Home, filtro 9/Last complete round deve mostrare 45.0 colpi e 18.0 putt. Il filtro 18 resta separato. Verificare ritorno a Home dopo un nuovo salvataggio, Last 5, stato vuoto dove applicabile e testo grande senza perdere il draft. Non cancellare dati esistenti per testare lo stato vuoto. Nessuna nuova funzionalità prima della verifica o di un cambio di scope dell’utente.

Questo aggiornamento prevale sulle vecchie priorità storiche sottostanti: non chiedere nuovamente altri bug né ripetere il setup autenticazione già confermato.

## 15 ottobre 2026 — conferma utente Home

Screenshot Rounds: giro parziale 3/9 con 12 strokes/E e completo 9/9 con 42 strokes/+6. Dopo richiesta di controllare Home, filtro 9/Last complete round e media 42.0 escludendo il parziale, l’utente risponde «si funziona». Evidenza riferita dall’utente; nessuno screenshot Home né verifica individuale di putt, Last 5, filtro 18 o riavvio. Aggiornati CURRENT_STATE, NEXT_SESSION e project-status. Solo documentazione: nessun test funzionale rieseguito, risultati precedenti 75 test/typecheck/lint conservati. Branch main, lavoro Home e memoria non staged/non committato; nessun commit/push/migrazione. Prossimo controllo: filtro 18 e riapertura. Whitespace verificato con git diff --check.

### Conferma successiva — persistenza Home

L’utente risponde «si rimane tutto» alla richiesta di verifica dopo chiusura/riapertura: registrata conferma utente della persistenza Home. Nessuna conferma distinta del filtro 18 buche. Aggiornati i tre documenti di stato; nessun codice modificato o test funzionale rieseguito. Modifiche Home/documentazione ancora non staged e non committate su main; nessun commit/push o operazione database. git diff --check superato.

### Conferma successiva — filtro 18 e chiusura verifica principale Home

Dopo richiesta di verificare il filtro 18 (medie assenti senza round completi da 18), l’utente risponde «funziona». Conferma riferita dall’utente, non osservazione diretta dell’agente. Verifiche principali Home concluse; Last 5, nuovo salvataggio, putt e casi accessibilità/errori rimangono senza conferme individuali. Aggiornata memoria, nessuna modifica al codice né test funzionale ripetuto. Risultati automatici precedenti: 75 test mobile, typecheck e lint passati. Nessun commit/push autorizzato per le modifiche Home, nessuna migrazione. Prossimo passo: attendere indicazioni dell’utente; git diff --check superato.

## Checkpoint corrente — 16 ottobre 2026, sprint autonomo concluso

Questo checkpoint prevale sulle priorità storiche sottostanti. Rapporto completo in inglese: [2026-10-16-autonomous-sprint-report.md](daily-reports/2026-10-16-autonomous-sprint-report.md). Sprint richiesto da 120 minuti, ma l’esecuzione ha attraversato un’interruzione/attesa dei permessi computer: non dichiarare 120 minuti di sviluppo continuo. Orologio verificato: avvio 15 ottobre 22:56:25 UTC, controllo finale 16 ottobre 18:44:17 UTC (19h 47m 52s wall-clock, non tempo attivo). Chiamata computer riportata in attesa per 5123.0968 secondi, terminata senza permessi; durata attiva non ricostruibile.

- Corretto l’ordine concorrente lettura/scrittura dei round; regressioni su errori storage, limite 1000, date e tutte le lunghezze 1–9/18 della fine anticipata.
- Autenticazione: no-store/no-cache anche per errori gestiti e throttle; password con surrogate isolate respinte prima di hashing/query; validazione token fail-closed per purpose sconosciuto. Argon2id, salt, work path dummy, input annidati e Unicode coperti da test.
- Mobile: conteggio Unicode e whitespace password allineati al backend, cap input adattati; race preferenza Riduci movimento risolta; stato busy/disabled del bottone logout accessibile e testo che chiarisce strokes comprensivi dei putt. Nessun redesign.
- Test finali 16 ottobre: backend **109 passati, 15 saltati**, una deprecazione Starlette/httpx; mobile **93 passati**, typecheck/lint passati; web build/lint passati. Export iOS/Android/web completato nella prima parte dello sprint. Nessun nuovo test manuale iPhone/browser effettuato dall’agente.
- Audit online eseguito il 15 ottobre: mobile 28 findings (18 high, 10 moderate), web zero. Nessun upgrade o lockfile modificato. Backend pip check passato: è compatibilità delle dipendenze, non scansione advisory Python. Documentati triage e piano JWT, solo proposta.
- Git: main, HEAD acbf216; origin/main è il riferimento locale (nessun fetch). Home/memoria preesistenti preservate; nuove modifiche sprint tutte non staged/non committate. Nessun commit, push, deploy, migrazione, reset o lettura del contenuto .env.

**Esatta prossima azione:** leggere il rapporto e ispezionare Git; su iPhone fare Reload e provare registrazione/login con normali password Unicode valide, logout/busy e Riduci movimento, quindi round parziale e completo, storico/ritorno Home senza perdita draft. Non ripetere il setup Wi-Fi già confermato. I controlli Home da 9, esclusione parziale, persistenza e filtro 18 erano già confermati dall’utente prima dello sprint; non attribuire questi riscontri alle nuove modifiche. Test PostgreSQL soltanto con TEST_DATABASE_URL isolato esplicitamente configurato; nessuna migrazione implicita. Approfondire poi decoder URI e fix Expo compatibili, con approvazione per major upgrade. Nessun commit/push senza nuova autorizzazione.

Contatore finale dello sprint: 5912 secondi (98m 32s), inclusa l’attesa permessi. Misura distinta dall’intervallo UTC di calendario e dal tempo di sviluppo attivo, che non è ricostruibile. Rapporto aggiornato con entrambe le misure; nessuna dichiarazione di 120 minuti produttivi.

## Conferma utente — 16 ottobre 2026, regression test iPhone

Dopo la guida ai test di login corretto/errato e logout, Riduci movimento, fine anticipata con Keep playing, riepilogo 2/9, Home e persistenza dopo riapertura, l’utente ha risposto «funziona tutto». Registrata conferma complessiva riferita dall’utente della checklist principale; non è osservazione diretta dell’agente. VoiceOver era un controllo opzionale e non è confermato separatamente; nemmeno registrazione Unicode, guasti storage/offline, casi di sicurezza sintetici o integrazioni PostgreSQL vanno considerati verificati su device per questa risposta.

La checklist principale iPhone non è più il blocco di ripresa. Prossima azione: revisione del diff Home/sprint per preparare un eventuale checkpoint, oppure approfondimento delle remediation Expo compatibili su richiesta. Nessuna autorizzazione implicita a commit/push: il divieto dello sprint resta valido finché l’utente non lo modifica esplicitamente.

Aggiornamento solo documentale: CURRENT_STATE, NEXT_SESSION, project-status e development-log. Nessun test funzionale rieseguito; esiti precedenti 109 backend passati/15 saltati e 93 mobile passati, typecheck/lint/build, restano evidenza storica dello sprint. Controllo nuovo: git diff --check. Branch main, HEAD acbf216; modifiche precedenti preservate, tutte non staged/non committate. Nessun commit, push o operazione database.

Questo aggiornamento prevale sulle istruzioni storiche sotto che richiedono nuovamente la checklist principale iPhone.

## Revisione checkpoint — 16 ottobre 2026

Eseguita revisione del diff Home/sprint e dei nuovi file; nessun nuovo difetto bloccante individuato nel perimetro esaminato. Proposta concreta in [checkpoint-review-2026-10-16.md](checkpoint-review-2026-10-16.md): tre commit locali separati per backend, mobile e documentazione, da eseguire solo dopo autorizzazione esplicita. Nulla staged, nessun commit/push. main a acbf216; nessun fetch.

Controlli nuovi: diff/indice, esclusione .env e artefatti, scansione pattern credenziali sui file pendenti e git diff --check superati. Nessun codice funzionale cambiato durante la revisione; non ripetute inutilmente le suite già passate (109 backend/15 skip, 93 mobile, typecheck/lint/build). Test iPhone principali confermati dall’utente nel messaggio precedente; VoiceOver opzionale e casi Unicode/offline non confermati individualmente.

Prossima azione: attendere autorizzazione esplicita ai commit locali oppure indicazione di approfondire le remediation dipendenze. Non eseguire commit/push in base al solo «vai al secondo step». Restano 28 findings mobile, integrazioni PostgreSQL non eseguite e limiti produzione. Osservazione minore di copy in Profile documentata nella revisione; nessuna UI cambiata per questa attività.

Questo aggiornamento prevale sulle priorità storiche sotto: la revisione di preparazione checkpoint è completata.

## Checkpoint locale autorizzato — 16 ottobre 2026

L’utente ha autorizzato esplicitamente i tre commit locali con «si autorizza», dopo la proposta senza push. Creati `5783aa7` (backend: validazione Unicode, purpose token e cache auth) e `d3feb56` (mobile: Home dai round salvati, persistenza, form e accessibilità). Questa nota e la documentazione vengono raccolte nel terzo commit `docs: record verified sprint and checkpoint review`; alla ripresa ricavare il suo hash da Git. Nessun push autorizzato o eseguito. Nessuna migrazione/deploy/upgrade dipendenze.

Prima di ogni commit verificati branch main, elenco/diff dei file staged, esclusione di segreti e artefatti e git diff --cached --check. Nessun codice funzionale modificato per creare i commit: conservati i risultati precedenti (109 backend passati/15 integrazioni saltate, 93 mobile passati, typecheck/lint/build e bundle). Checklist iPhone principale confermata dall’utente; limiti delle verifiche già documentati.

Prossima azione: ispezionare Git e confermare lo stato del checkpoint locale; non ripetere i commit già creati. Se richiesto, approfondire remediation delle dipendenze Expo compatibili; un eventuale push richiede autorizzazione separata. Restano 28 findings mobile, test PostgreSQL isolati da eseguire e controlli VoiceOver/Unicode/offline non confermati individualmente. Il divieto precedente di commit è stato revocato solo per questi tre commit locali, non per operazioni future o push.

Questo aggiornamento sostituisce le precedenti indicazioni di attesa dell’autorizzazione e di lavoro Home/sprint non committato. Verificare sempre lo stato reale con git status.
