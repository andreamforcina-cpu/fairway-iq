# FAIRWAY IQ — stato corrente

## Authorized local round checkpoint — 2026-10-16

The user explicitly authorized the three proposed local commits with “si autorizzo”. Created `53c4636` — `feat(backend): persist account-owned golf rounds` (11 files), and `6ebbf7b` — `feat(mobile): sync account-owned rounds and isolate local caches` (15 files). This entry is included in the third authorized documentation commit, `docs: record round persistence acceptance and checkpoint review`; obtain its hash from Git after creation. The three groups exactly match the reviewed manifest. Push is **not authorized** and was not performed. No fetch, deployment, database operation or migration in this commit session.

Before each commit checked main branch, exact staged manifest, credential/artifact patterns and `git diff --cached --check`; synthetic database fixture URLs were treated as test-only placeholders. Existing private environments and generated/dependency directories excluded. No application code changed while creating commits, so prior successful evidence remains: 197 backend/PostgreSQL tests, 124 mobile tests, TypeScript/lint/Expo compatibility/platform exports; no unnecessary test reruns. Principal iPhone flow is user-reported working; optional device edge cases remain as documented. Dependency/security/operational limits remain open.

**Exact next action:** inspect Git to confirm the three-commit local checkpoint and clean working tree; do not repeat commits. If publication is requested, push requires separate explicit authorization. Otherwise select the next product/security task with the user; no further feature work is implied by this checkpoint. Do not repeat setup or the confirmed principal iPhone test. This entry supersedes prior instructions to await local commit authorization. Final commit result/clean-tree verification is provided in the session response and is recoverable from Git.

## Round checkpoint review completed — 2026-10-16

Completed the requested review and prepared [checkpoint-rounds-review-2026-10-16.md](checkpoint-rounds-review-2026-10-16.md), including an exact pending-file manifest and three proposed local commits: backend round persistence; mobile account synchronization including existing SDK patches and Crypto; documentation/evidence. No blocking defect identified in the examined diff. This is not public-release approval.

Fresh checks: working diff/untracked inventory, branch/index, credential-pattern review (existing synthetic fixture URLs excluded), ignored environment/dependencies/builds and whitespace passed. No application changes or test reruns during this review; previous evidence remains 197 backend/PostgreSQL passes and 124 mobile passes plus TypeScript/lint/exports and user-reported principal iPhone acceptance. Known dependency findings and individually unconfirmed device edge cases remain documented.

Git main at b21af72; index empty; all prior work and the review/memory remain uncommitted. No commit, push, fetch, database operation or deployment. **Exact next action:** wait for explicit authorization of the three proposed local commits, without push. After authorization, reconcile actual Git status with the report manifest and verify staged files/secrets/artifacts/whitespace before each commit. The instruction to proceed to review did not authorize commits or further features. Do not repeat completed setup/device checks by default.

## User-reported iPhone acceptance — 2026-10-16

After the guided iPhone checklist, the user reported “si funziona tutto”. Recorded as user-reported success of the principal authenticated round flow: early-finished test round, expected score totals, Synced status, refresh and online relaunch persistence. This is not an agent-executed device test. The second-account check was conditional (“if you have a second account”); it is not individually confirmed by this general response. Offline retry, full 9/18 device rounds, VoiceOver, refresh during unsaved edits and preview preservation were not individually tested in the latest guided checklist and remain unverified on device. Automated account-isolation and related regressions retain their previously documented results.

No application code changed and no automated suite rerun for this documentation-only confirmation. Prior results remain 124 mobile tests plus typecheck/lint/platform exports, and 197 backend tests including isolated PostgreSQL. No new database operation, migration, commit, push or deployment. Git working changes preserved, main b21af72, nothing staged. Fresh documentation whitespace check passed.

**Next recommended action:** review the uncommitted backend/mobile integration diff and prepare a concrete checkpoint proposal; do not commit/push without explicit authorization. Optional remaining device edge cases can be verified separately. Do not repeat completed setup or the principal save/restore test by default. This confirmation completes the requested principal device check, not full production/MVP readiness.

## Mobile account round integration — 2026-10-16

User authorized the next mobile integration stage. Implemented authenticated round submission/history, per-account and per-API-origin cache/drafts, durable UUID submission keys and server acknowledgments, pending/synced row status, explicit retry/refresh and account-aware Home. Existing opaque-token manager now serializes authorized operations with login/refresh/logout and checks the expected account before access-token use. Tracker/dashboard remount on account/preview scope changes. Score validation aligns Unicode control/invisible character handling with the backend.

Legacy policy: old shared local rounds/drafts remain in sample preview; no automatic ownership assignment/import. Pending copies survive failed requests and retry with the same UUID/payload. Drafts remain local. Cache is bounded at 1,000, preserving pending rounds; older acknowledged entries remain on the server. This is not full offline sync: restore still requires the existing online session flow, no background network monitor was added, and cached scores are not encrypted or deleted on logout.

Fresh verification: **124 mobile tests passed**, zero failures/skips (31 new account/transport/session/hook regressions); TypeScript, lint, Expo dependency compatibility and final iOS/Android/web exports passed. Hook tests use a synthetic harness, not a native renderer. Install added only SDK-compatible `expo-crypto ~57.0.4` for UUIDs, preserving pre-existing SDK patches; npm still reports 28 findings (18 high/10 moderate). Prior backend result **197 passed/zero skipped** remains historical from the preceding PostgreSQL verification, not rerun for this mobile-only change. Development migration 0003 was already applied/verified in the previous step. No new DB operation, private environment inspection/change, commit, push or deployment. App tooling loaded the existing public mobile API setting without printing its value.

**Exact next task:** restart the backend and Expo with existing private configuration, then run the iPhone checklist in [mobile-account-rounds.md](mobile-account-rounds.md): account A save/refresh/relaunch, account B isolation, partial/full scorecards and Home, pending offline submission/retry with no duplicate, unsaved draft during refresh, preview preservation, VoiceOver/navigation. A custom development client may require rebuild for the native Crypto module. No device end-to-end acceptance is claimed yet.

Git: main at b21af72, nothing staged; all prior backend/mobile SDK/audit work preserved and this mobile integration remains uncommitted. Technical report: [mobile integration report](daily-reports/2026-10-16-mobile-account-rounds-integration.md). This authorized implementation supersedes older notes saying mobile integration awaits authorization; it does not authorize commits, push, deployment, legacy import or further features.

## Development migration applied — 2026-10-16

Following the user's next-step request and explicit execution approval, applied `0003_create_golf_rounds` to the confirmed local `fairway_iq_dev` database. Preflight showed revision 0002 and no existing round tables. Used an explicit local socket target without reading private `.env` contents; the migration ran in a transaction with lock/statement timeouts and committed successfully. No user/session data was queried or changed by the migration, and no database reset/drop occurred. Read-only postflight confirmed revision 0003 and zero ORM/schema differences. This supersedes earlier notes saying the development migration is pending. Production was not migrated.

No application code changed. The immediately preceding isolated PostgreSQL suite remains **197 passed, zero skipped**, one existing deprecation; not repeated for a schema-only operation already covered by that suite. Fresh checks: development revision/schema agreement and `git diff --check` passed. Four memory documents and the round contract updated; existing uncommitted work preserved. No commit, push or deployment; main remains b21af72, nothing staged.

**Next task:** propose and obtain authorization for mobile round API integration, including account-isolated cache/history, stable retry keys and explicit treatment of unowned legacy local rounds. Mobile is still using local shared history; applying the backend migration alone does not enable mobile synchronization. No mobile/device verification is claimed. Existing dependency and production-hardening risks remain open.

## Isolated PostgreSQL acceptance — 2026-10-16

User explicitly authorized preparing a local isolated test database and executing the tests. Created a new dedicated `fairway_iq_test_sprint1_20261016` database from template0 after confirming that name did not exist. Used local socket authentication with the existing local role; no credentials or private `.env` files read or changed. The local role is a PostgreSQL superuser: this test evidence does not establish production least-privilege permissions.

Fresh full backend run with an explicitly process-scoped `TEST_DATABASE_URL`: **197 passed, zero failed, zero skipped**, one existing Starlette/httpx deprecation, 6.11 seconds pytest runtime. All 26 previously skipped PostgreSQL cases passed, including all 11 round integration cases: real session authentication, full/early persistence, cross-account denial, duplicate/conflicting retries, tied-timestamp pagination, transaction rollback, constraints/cascade and concurrent submissions. Migration/ORM metadata agreement passed. Migrations ran only inside dedicated temporary test schemas; no development/production schema migrated. Post-run verification found zero matching test/race schemas and zero public tables. The dedicated empty test database remains available.

Repeat command from root: `TEST_DATABASE_URL=postgresql+psycopg:///fairway_iq_test_sprint1_20261016 backend/.venv/bin/python -m pytest -c backend/pytest.ini backend/tests -q`. No persistent environment configuration was written. `git diff --check` passed. No application code changes, commit, push or deployment in this test session; prior working changes preserved, nothing staged, main at b21af72.

**Exact next task:** review the intended development database target and request explicit approval to apply migration 0003 there. Isolated PostgreSQL acceptance is now verified; earlier skipped-test checkpoints below are historical. Mobile still uses shared local round history and is not integrated with these APIs. Mobile integration/legacy ownership policy remains the next separately authorized development stage. Production least privilege and existing dependency risks remain unresolved. See [PostgreSQL acceptance report](daily-reports/2026-10-16-sprint-1-postgresql-verification.md).

## Round test files rerun — 2026-10-16

At the user's request, executed the existing `backend/tests/test_rounds.py` and `backend/tests/test_rounds_integration.py` with current configuration: **62 passed, 11 skipped**, zero failures, one existing Starlette/httpx deprecation. All skipped cases require an explicitly configured isolated `TEST_DATABASE_URL`, still unavailable. No database was accessed or migrated; no application code, private environment files, staging, commit or push changed. Next action remains isolated PostgreSQL configuration and integration execution; the current result does not verify live persistence.

## Test rerun — 2026-10-16

User requested testing after Sprint 1. Fresh full backend run: **171 passed, 26 skipped**, zero failures, one existing Starlette/httpx deprecation. `TEST_DATABASE_URL` is still absent from this execution environment; PostgreSQL integration, including round concurrency/ownership persistence, remains unverified. No private environment file read, database connection, migration, commit or push performed. Existing working changes preserved. Next action: confirm the intended dedicated isolated test database and configure its URL privately before integration execution; never substitute the development URL. This is a testing checkpoint, not mobile integration authorization.

## Sprint 1 — backend round persistence, 2026-10-16

Implemented the authorized backend slice: UUID round/hole models, migration `0003_create_golf_rounds` prepared, strict schemas, authenticated `POST /rounds`, `GET /rounds`, and `GET /rounds/{round_id}`. Ownership comes from the existing opaque-token session. Owner-scoped submission UUIDs support identical retries (200), new submissions (201), and conflicting reuse (409). History uses bounded timestamp/UUID keyset pagination. Complete/early status and totals are derived. Parent/children are transactional; safe generic errors, rollback and no-store headers cover round routes. No JWT, mobile integration, dependency change, migration execution, commit, push or deployment occurred in this sprint.

Fresh verification: full backend suite **171 passed, 26 skipped**, zero failures; one existing Starlette/httpx deprecation. This includes 62 new unit/mock API/offline-migration tests. Eleven new PostgreSQL cases, including cross-account API access, atomic rollback, constraints, pagination and concurrent retries, are among the skips: no isolated `TEST_DATABASE_URL` configured in the shell. They are prepared, **not PostgreSQL-verified**. No development URL substituted. Mobile/web checks and iPhone testing were not rerun for this backend-only change; earlier results remain historical. Whitespace and secret/artifact review are recorded in the sprint report.

**Exact next task:** privately configure an isolated `fairway_iq_test...` database via `TEST_DATABASE_URL` and run `backend/.venv/bin/python -m pytest -c backend/pytest.ini backend/tests -q` from the repository root. Resolve any PostgreSQL failures before claiming live acceptance. Then review the intended development target and obtain explicit approval before applying migration 0003. Mobile integration requires the next authorized stage; first decide treatment of unowned legacy local history. Do not silently attach legacy records to the logged-in account.

Migration is prepared/offline-tested, not applied anywhere. Existing backend functionality passes non-DB regression checks. Full end-to-end MVP remains incomplete; mobile still uses local, shared round history. Existing 28 mobile dependency findings are historical and unresolved, not re-audited here. Cross-row child count/prefix constraints are enforced by the application rather than triggers; request-size/write-rate/infrastructure protections still need deployment review.

Git checkpoint: branch `main`, HEAD `b21af72`; nothing staged, all sprint work uncommitted. Preserved pre-existing SDK 57 manifest/lockfile changes, historical assessment/security review, and all earlier memory entries. No remote fetch or new commit/push. The original MVP assessment remains a historical baseline; this authorized sprint supersedes its instruction to wait before implementing round persistence.

Contract: [backend-rounds.md](backend-rounds.md). Technical report: [Sprint 1 development report](daily-reports/2026-10-16-sprint-1-development-report.md).

## Audit MVP completato — 16 ottobre 2026

Audit soltanto: rapporto in inglese salvato in [MVP_READINESS_ASSESSMENT.md](MVP_READINESS_ASSESSMENT.md), con matrice funzionalità, percorso utente, rischi, test, modello pesato, stime e roadmap. Codice applicativo e dipendenze non modificati dall’audit; preservate le patch SDK 57 e le modifiche documentali preesistenti. Nessun commit/push/deploy/migrazione o ispezione .env.

Conclusione verificata sul codice: prototipo locale valido, non ancora V1 con persistenza server. Il percorso si interrompe al salvataggio round su PostgreSQL: mancano modelli/API round, proprietà per utente e recupero server. Home deriva dati locali reali; Analytics e Coach restano placeholder. Web consigliato come landing/demo.

Stime di pianificazione esplicite, non misure di copertura: UI 75%, backend 44%, capacità MVP pesata 49.5% (circa 50%), fiducia media. Effort restante ipotizzato 100/160/240 ore; realistico 8 settimane a 20h o 16 a 10h, per pilot mobile invitato online-first, esclusi AI/GPS/sync offline complesso. Il numero non annulla i blocchi di rilascio.

Verifiche nuove dell’audit: backend 109 passati/15 integrazioni saltate, una deprecazione; mobile typecheck/lint e 93 test passati; web TypeScript/build/lint passati, nessuna suite interazioni disponibile; audit mobile 28 (18 high/10 moderate), web zero; git diff --check ed esclusione artefatti passati. Nessun database di test isolato configurato: non usato quello di sviluppo. Nessuna nuova prova device dopo le patch; vecchie conferme utente restano storiche.

Prossima azione consigliata: concordare il contratto di persistenza round per utente e il trattamento dei dati locali legacy; poi, solo con autorizzazione a implementare, vertical slice round autenticato POST/GET con test isolamento account. Applicazione migrazioni soggetta a consenso separato. L’audit è concluso: non iniziare funzionalità in automatico e non committare/pubblicare il rapporto senza richiesta.

Git main a b21af72; nulla staged. Restano non committati memoria, manifest/lockfile SDK 57 e review dipendenze precedenti, più il nuovo assessment. Questo checkpoint sostituisce le precedenti priorità automatiche: la roadmap è una proposta, non un’autorizzazione.


## Remediation dipendenze SDK 57 — 16 ottobre 2026

Richiesta eseguita: audit aggiornato, verifica patch e compatibilità del decoder URI. Applicate solo le quattro patch consigliate da Expo: expo 57.0.30, constants 57.0.22, linking 57.0.13, router 57.0.28. Manifest e lockfile mobile aggiornati; nessun major upgrade o override forzato. Audit ancora 28 findings (18 high, 10 moderate): non dichiarare vulnerabilità risolte.

Tutte le release Router 57 controllate mantengono query-string 7.1.3/decoder 0.2.2. Decoder 0.5.0 è ESM: test isolato in directory temporanea ha confermato un mismatch con il consumer CommonJS (nessuna modifica alla risoluzione dipendenze del progetto). Non è una prova Metro/device né un test DoS. Dettagli e fonti: [review remediation](security/sdk57-remediation-review-2026-10-16.md).

Verifiche nuove: expo install --check ora passa; typecheck/lint passati, 93 test mobile passati, export iOS/Android/web passato, git diff --check superato. Nessun test manuale iPhone dopo queste patch: le precedenti conferme non coprono le nuove versioni. Backend/web non rieseguiti, nessun codice applicativo cambiato.

Prossima azione: riavviare Expo eventualmente già attivo e fare smoke test iPhone di navigazione/link protetti, login/restore/logout, round/Home e riapertura; rebuild se si usa un development build. Per eliminare la advisory decoder occorre valutare un percorso upstream compatibile oppure una migrazione SDK separata, con approvazione esplicita prima di major upgrade. Nessun fix sicuro drop-in verificato in SDK 57.

Git main a b21af72; modifiche manifest/lockfile/review/memoria tutte non staged/non committate. Preservate le note locali di push preesistenti. Nessun nuovo commit/push/deploy/migrazione; .env non ispezionati. Questo aggiornamento prevale sulle vecchie istruzioni di semplice attesa del review dipendenze: il review e le patch compatibili sono completati, il rischio residuo resta aperto.


## Pubblicazione confermata — 16 ottobre 2026

Dopo conferma esplicita dell’utente al push dei tre commit, git push origin main è riuscito: origin/main avanzato da acbf216 a b21af72. Pubblicati backend 5783aa7, mobile d3feb56 e documentazione b21af72. HEAD e riferimento locale origin/main verificati uguali; working tree pulito prima di questo aggiornamento della memoria.

Solo i quattro file di memoria sono ora aggiornati localmente per registrare l’esito: restano non staged/non committati; nessun quarto commit o push aggiuntivo autorizzato o eseguito. Nessun codice funzionale cambiato e nessun test ripetuto per il solo push. Verifiche whitespace passate. Nessuna migrazione o deploy.

Prossima azione: approfondire le remediation Expo compatibili se richiesto; non ripetere i tre commit o il push già riusciti. Restano 28 advisory mobile e integrazioni PostgreSQL/controlli device specifici descritti nel rapporto. Eventuale pubblicazione di questo aggiornamento documentale richiede autorizzazione.

Questo esito sostituisce le precedenti indicazioni di tre commit solo locali e push non autorizzato.


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
