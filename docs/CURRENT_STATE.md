# FAIRWAY IQ — stato corrente

> Aggiornamento successivo del 15 ottobre 2026: l’utente ha autorizzato commit e push con «fai tutto». Le indicazioni di mancata autorizzazione nei checkpoint precedenti sotto sono storiche. Tracker, fine anticipata e memoria vengono inclusi nel nuovo checkpoint; le prove iPhone della fine anticipata restano pendenti. Verificare hash e sincronizzazione effettivi con Git alla ripresa.

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
