# FAIRWAY IQ — stato corrente

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

Checkpoint: **15 ottobre 2026**, America/New_York. Fonte primaria: codice, manifest e Git ispezionati; risultati storici e dichiarazioni dell'utente sono distinti sotto. Handoff operativo: [NEXT_SESSION.md](NEXT_SESSION.md). Questo documento non prova lo stato di servizi o database in esecuzione.

## Architettura corrente

- `frontend/`: React 19, TypeScript 6, Vite 8, Tailwind 4, Motion 14. `src/App.tsx` implementa homepage, navigazione e dashboard dimostrativa con dati statici e animazioni. Non è un client autenticato collegato al backend.
- `mobile/`: Expo SDK 57, React 19.2.3, React Native 0.86.3, Expo Router, TypeScript strict. Route conservate in `mobile/app/`; componenti, hook, servizi e calcoli fuori dalle route. SecureStore gestisce il refresh di autenticazione; AsyncStorage 2.2.0 gestisce esclusivamente i round locali.
- `backend/`: Python 3.12, FastAPI, Pydantic Settings, SQLAlchemy 2.x, psycopg, PostgreSQL, Alembic, Argon2id. Avvio senza creazione automatica dello schema. Impostazioni da ambiente privato, non letto per questa ricognizione.
- `docs/`: documentazione tecnica ed evidenze. `docs/architecture.md` e `docs/project-plan.md` sono vuoti alla ricognizione: non attestano architettura o roadmap implementate.

## Funzionalità implementate e stato per sottosistema

### Backend e autenticazione

- `GET /`, `GET /health`; registrazione utenti e verifica credenziali `/auth/login`.
- Sessioni opache server-side: `/auth/token`, `/auth/refresh`, `/auth/logout`, `/auth/me`. Non JWT. Password Argon2id; nel database solo digest dei token.
- Rotazione refresh, revoca al riutilizzo, logout, profilo con campi consentiti, validazione/errori sanitizzati e limiti per IP in memoria del processo.
- Mobile collegato: registrazione, login, Profile, SecureStore, ripristino sessione, refresh, logout e route protette; preview campione esplicita separata dal profilo personale.
- L'utente ha confermato su iPhone: connettività Wi-Fi di casa, health, registrazione, login, Profile, ripristino e logout. Refresh dopo scadenza **assunto funzionante per scelta dell'utente, non verificato sul dispositivo**; Back/deep link dopo logout, offline e casi di errore restano da verificare manualmente.
- Stato attuale dei processi backend/Expo e raggiungibilità di rete: non verificati in questa ricognizione; non riavviarli alla cieca se già attivi.

### Web

Homepage premium e demo interattiva con dati di esempio; nessuna prova di analisi reale o integrazione account. Build/lint web non eseguiti in questo checkpoint; comportamento responsive, tastiera e animazioni richiedono verifica dedicata se modificati.

### Mobile

- Welcome, registrazione/login, tab Home, Rounds, Analytics, AI Coach, Profile. Home mostra campioni; Analytics e Coach sono placeholder, senza servizio AI attivo.
- Tracker 9/18 buche, nome campo, par/strokes/putts, totali e scorecard. Strokes include i putt; putts non può superare strokes.
- Modifiche **non committate**: draft e buca selezionata persistenti, storico datato, riapertura scorecard, validazione dei dati memorizzati, coda di scrittura e retry degli errori. Route Rounds delegata a `RoundTracker.tsx`.
- Fine anticipata implementata: almeno una buca completa, conferma esplicita; salva il prefisso giocato, esclude buche finali vuote da colpi/par, conserva lunghezza pianificata e mostra giocate/pianificate. Buchi intermedi e punteggi parziali/invalidi bloccano correttamente il salvataggio.
- L'utente ha confermato salvataggio draft e riapertura storico dopo reload **prima** della modifica di fine anticipata. Fine anticipata e annullamento della conferma: ancora non verificati su iPhone.

## Database

Migrazioni presenti: `0001_create_users`, `0002_create_auth_sessions`; modelli `users`, `auth_sessions`, `refresh_tokens`. `docs/backend-sessions.md` registra applicazione autorizzata di 0002 al database locale di sviluppo e controlli di integrità, più 85 test sul database isolato. È **evidenza storica documentata**, non una nuova interrogazione del database. Revisione effettiva, disponibilità e dati correnti non ricontrollati. Nessuna migrazione/query/modifica database eseguita in questo checkpoint. Test integrati solo con `TEST_DATABASE_URL` isolato e guardie esistenti; mai sostituire l'URL di sviluppo.

## Ultime verifiche

| Verifica | Risultato e tipo di evidenza |
| --- | --- |
| Mobile typecheck, lint, `npm test` | Rieseguiti il 15 ottobre per questo checkpoint: tutti passati, **69 test**, zero skip/fallimenti |
| Backend pytest | Esecuzione precedente osservata nella conversazione: **70 passati, 15 saltati**, URL del database di test non configurato in quella shell; una deprecazione Starlette/httpx. Non rieseguito oggi |
| PostgreSQL integrazione | Documentazione storica: **85 passati, zero skip**; non riprodotti oggi |
| iOS bundle export | Successo precedente alla correzione di fine anticipata; non prova funzionamento su dispositivo, non rieseguito dopo tale correzione |
| Web build/lint | Non eseguiti in questo checkpoint; nessun esito corrente rivendicato |
| Whitespace e memoria | `git diff --check` e controllo file/link/segreti riportati nel development log del checkpoint |

## Incompleto, bug noti e rischi

- **Priorità:** verificare la fine anticipata su iPhone aggiornato. Lo screenshot con 2 strokes e 3 putts contiene un punteggio invalido: 2 colpi prima del green + 3 putt significa 5 strokes, 3 putts. Il vecchio messaggio nello screenshot suggeriva una build precedente, ma la versione sul telefono non è stata verificata.
- L'utente segnala altri bug non ancora descritti: raccoglierli uno alla volta senza inventare riproduzioni.
- Round locali condivisi tra account e preview sul dispositivo, non cifrati, non sincronizzati né salvati sul backend. Limite 1.000; nessuna UI di eliminazione/export o reset distruttivo di dati corrotti. Scorecard conclusa non riprendibile; chiusura prima della conferma di salvataggio può perdere le ultime modifiche. Dashboard indipendente dai round reali.
- Accessibilità, VoiceOver, testo grande, tastiera, piccoli schermi, Android, offline e guasti storage richiedono ulteriori prove manuali. Nessuna verifica visiva/device simulata.
- Audit precedente: 28 advisory (10 moderate, 18 high) nell'albero Expo/React Native preesistente; nessuna nominava AsyncStorage o le dipendenze aggiunte. Non è una scansione aggiornata di oggi; niente upgrade fuori ambito.
- Produzione non pronta: HTTPS/TLS operativo, rate limiting distribuito, limiti richieste/concorrenza, verifica email, recupero password, revoca globale, cleanup sessioni e telemetria sicura restano da affrontare. Registrazione può consentire enumerazione account. Non considerare la LAN uno spiegamento pubblico.

## Git e checkpoint

Alla ricognizione: branch `main`, HEAD **`75eced0` — feat(auth): add server sessions and mobile authentication**. Tracking locale `origin/main`: un commit avanti; nessun fetch effettuato, quindi non è una verifica dello stato remoto corrente.

Nulla in staging. Modifiche precedenti preservate: tracker/persistenza/fine anticipata, test, manifest e lockfile mobile, documentazione dei round e vecchio handoff. File nuovi: componente RoundTracker, hook useRoundLibrary, roundStore e relativi test. Questo checkpoint aggiunge i quattro file di memoria e aggiorna AGENTS.md/collegamento legacy. Elenco preciso in [NEXT_SESSION.md](NEXT_SESSION.md); verificare sempre `git status` alla ripresa.

Nessun commit/push/migrazione autorizzato per il lavoro corrente. Il precedente consenso riguardava solo il commit locale di autenticazione, già eseguito. Lavoro nuovo non committato; nessun commit o push in questo checkpoint.
