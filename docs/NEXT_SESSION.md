# FAIRWAY IQ — ripresa esatta

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

Aggiornato: **15 ottobre 2026**, America/New_York. Handoff canonico; sostituisce le priorità del vecchio `next-session.md`. Leggere anche [CURRENT_STATE.md](CURRENT_STATE.md) e [project-status.md](project-status.md).

## Task interrotto

**Testare e correggere il tracker round su iPhone, soprattutto Finish Round prima della buca 9/18.** L'utente ha rinviato a domani una prova più accurata. Non iniziare analisi, AI, sync backend o nuove funzionalità prima di chiudere questo task o ricevere un cambio esplicito di obiettivo.

Ultima azione di sviluppo funzionale completata: implementata fine anticipata con conferma, calcolo solo sulle buche giocate, persistenza e riapertura di scorecard parziali, etichette giocate/pianificate; 69 test passati. Poi spiegato che 2 strokes/3 putts è invalido e suggerito reload. **Non è arrivata conferma che la nuova fine anticipata funzioni su iPhone.** Ultima azione di questa sessione: ricognizione e memoria persistente, senza modifiche funzionali.

## Implementazione presente ma verifica incompleta

Persistenza draft/buca corrente, storico completo e ripristino dopo reload sono implementati; l'utente li ha confermati prima della correzione. La fine anticipata è implementata e testata automaticamente; conferma, annullamento, salvataggio parziale e reload richiedono verifica sul telefono. Altri bug sono stati annunciati ma non specificati. Non trattare questi controlli come già superati.

## Esatta prossima azione

1. Eseguire il protocollo di ripresa in AGENTS.md; verificare Git e i sorgenti sotto. Riassumere brevemente in italiano.
2. Riprendere la prova iPhone dell'utente. Verificare che abbia caricato il codice nuovo con Expo → Reload; riavviare Expo solo se necessario. Non modificare `.env` né ripetere setup già funzionante.
3. Sul draft esistente o su un round di test, compilare le buche 1–3 con par 4, strokes 5, putts 2; lasciare 4–9 vuote. Finish Round deve proporre **3/9**. Keep playing deve preservare i dati. Confermare poi la fine: **15 strokes, par giocato 12, +3, 6 putts**.
4. Attendere “Saved on this device”, ricaricare, aprire lo storico: scorecard di tre buche con lunghezza pianificata 9. Con sole due buche compilate e terza vuota aspettarsi 2/9. Provare anche putts > strokes: deve rimanere un errore, non è un bug da disabilitare.
5. Se fallisce, raccogliere azione, messaggio e screenshot aggiornati, riprodurre dal codice e correggere nel perimetro del tracker. Registrare prove reali, non dedurre esito dai test logici. Chiedere quindi il prossimo bug segnalato dall'utente.

## File coinvolti e stato Git

Branch `main`, HEAD `75eced0`; tracking locale un commit avanti a `origin/main`, remoto non aggiornato con fetch. Nulla in staging alla ricognizione.

Modifiche funzionali non committate:

- `mobile/app/(tabs)/rounds.tsx`: delega al componente, route conservata.
- `mobile/components/RoundTracker.tsx` (nuovo): UI, storico e conferma fine anticipata.
- `mobile/hooks/useRoundLibrary.ts` (nuovo): hydration/salvataggio/retry.
- `mobile/services/roundStore.ts` (nuovo): libreria versionata, parsing, scritture seriali, conclusione atomica.
- `mobile/types/round.ts`, `mobile/utils/round.ts`: buche pianificate/giocate e validazione/calcoli.
- `mobile/tests/round.test.mjs`, `mobile/tests/roundStore.test.mjs` (nuovo): regressioni e persistenza.
- `mobile/package.json`, `mobile/package-lock.json`: AsyncStorage compatibile con SDK 57.
- `docs/mobile-round-tracker.md`, `docs/next-session.md`: evidenze precedenti e rimando canonico.

Modifiche documentali di questo checkpoint: `AGENTS.md`, `docs/CURRENT_STATE.md`, `docs/NEXT_SESSION.md`, `docs/development-log.md`, `docs/project-status.md` e avviso nel vecchio handoff. Nessun file dell'app modificato per creare la memoria.

## Test eseguiti e ancora necessari

- 15 ottobre, checkpoint memoria: mobile typecheck/lint passati; **69 test passati**, nessuno saltato. Per sola documentazione non serve ripeterli subito alla ripresa; rieseguirli dopo modifiche funzionali.
- Backend precedente: 70 passati, 15 saltati, una deprecazione; integrazione isolata storica 85/85, non rieseguita. Nessuna migrazione da fare.
- Export iOS precedente alla fine anticipata passato; non rieseguito per la correzione. Web non verificato in questo checkpoint.
- Ancora necessari: sequenza manuale sopra; storico durante altro draft senza perdita dati; round 18 buche e fine parziale; offline, storage failure, VoiceOver, testo grande e piccoli schermi; Android non verificato.
- Refresh autenticazione dopo scadenza: assunto dall'utente, non provato; resta in coda, non sostituisce la priorità round tracker.

## Comandi di ripresa

Dalla radice del repository:

```sh
git status --short
git branch --show-current
git log -1 --oneline
```

Se serve avviare il backend già configurato (non duplicare un processo attivo):

```sh
backend/.venv/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --no-proxy-headers
```

In un altro terminale, dalla radice:

```sh
cd mobile
npm start
```

Dopo una modifica funzionale, da `mobile/`:

```sh
npm run typecheck
npm run lint
npm test
```

Dalla radice, prima del handoff:

```sh
git diff --check
git status --short
```

Per eventuali controlli backend seguire AGENTS.md; non impostare URL reali nella memoria né sostituire il database di sviluppo a quello isolato. LAN: usare l'indirizzo attuale del Mac già configurato privatamente; `GET /health` è il controllo HTTP, non un'aggiunta all'URL base mobile. Nessun IP privato fissato qui.

## Approvazioni e decisioni da preservare

- Test e correzioni del tracker già richiesti; nessun nuovo consenso richiesto per normali correzioni reversibili in questo ambito.
- **Commit e push autorizzati dall’utente con «fai tutto» il 15 ottobre** per tracker e memoria, oltre al precedente commit di autenticazione. Nessuna migrazione, reset database o major upgrade autorizzato. Alla ripresa verificare l’esito con Git; non ripetere commit/push già completati.
- Strokes = tutti i colpi, putt inclusi. Se 2 colpi prima del green + 3 putt, inserire 5/3. Mantenere putts ≤ strokes.
- Par predefinito non prova una buca giocata; ignorare solo buche vuote alla fine, non lacune intermedie. Richiedere almeno una buca completa.
- Fine anticipata esplicita, cancellabile; niente zeri per buche non giocate. Il giro concluso non è riprendibile.
- Storage round locale/condiviso fra account/preview; nessuna sincronizzazione backend. Mai token in AsyncStorage. Non leggere `.env` né cancellare dati utente per risolvere i test.
- Preservare tutte le modifiche non committate esistenti. Non promettere esecuzione autonoma domattina: il protocollo parte quando arriva il messaggio dell'utente.
