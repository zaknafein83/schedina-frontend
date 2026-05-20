# Guida per l'Amministratore

L'**Amministratore** (`ADMIN`) ha pieno controllo sull'applicazione: crea i
dati propedeutici (leghe, squadre, regole, stagioni, tornei, giocatori),
apre concorsi e pool stagionali, gestisce gli utenti e supervisiona
l'intero ciclo di vita di una giocata.

## I due cicli di vita

### Concorso settimanale

```
Lega → Squadre → Regola → Concorso (DRAFT) → aggiungi partite →
[apri] → OPEN → utenti giocano → [chiudi] → CLOSED →
inserisci risultati → [elabora] → PROCESSED ✓
```

### Pool stagionale

```
Stagione + Tornei + Giocatori →
Pool (DRAFT) → configura i bet → [apri] → OPEN → utenti giocano →
[chiudi] → CLOSED → risolvi i bet uno a uno → processing multiplo →
tutti RESOLVED → PROCESSED ✓
```

Le frecce **`[apri]` `[chiudi]` `[elabora/risolvi]`** sono le azioni a tuo
carico (un Mod può fare le ultime due ma non `[apri]`).

---

## 0. Step propedeutici (da fare una volta sola)

Prima di poter aprire concorsi e pool stagionali devi avere a sistema un
set minimo di dati:

| # | Cosa | Per cosa serve |
|---|---|---|
| 0.1 | **Leghe** | Contesto delle partite settimanali |
| 0.2 | **Squadre** | Componenti delle partite |
| 0.3 | **Giocatori** | Capocannoniere, primo marcatore, miglior portiere |
| 0.4 | **Regole** | Parametri dei concorsi settimanali |
| 0.5 | **Stagioni** | Periodo di riferimento delle pool stagionali |
| 0.6 | **Tornei** | Competizioni di cui si pronostica il vincitore |

### 0.1 Creare una Lega

Menu laterale → **Leghe** → pulsante **Nuova Lega**.

![Creazione di una nuova lega](/aiuto/20-admin-lega.png)

I campi richiesti:

- **Nome**: es. *Serie A 2026/27*
- **Paese** (opzionale): es. *Italia*

> Puoi anche **importare** una lista di leghe da un file JSON tramite
> il pulsante *Import / Export* in alto a destra.

### 0.2 Aggiungere le Squadre

Menu laterale → **Squadre** → **Nuova Squadra**, oppure usa *Import* con
il template CSV scaricabile.

![Form di creazione squadra](/aiuto/21-admin-squadra.png)

I campi richiesti:

- **Lega**: scegli quella creata prima
- **Nome**: es. *Internazionale*
- **Sigla** (opzionale): es. *INT*

Per popolazioni grandi (10+ squadre) usa il **template CSV**: scarica,
compila in Excel/Google Sheets, importa.

### 0.3 Anagrafica Giocatori

Menu laterale → **Giocatori**. Necessaria per i pronostici di tipo
"capocannoniere", "miglior assist", "miglior portiere" (pool stagionali)
e "primo marcatore" (side bet partita).

Per ogni giocatore:

- **Nome** e **Cognome** (obbligatori)
- **Squadra** (opzionale)
- **Ruolo**: `GK` / `DEF` / `MID` / `FWD`
- **Attivo** sì/no

Per popolare in massa usa **Import / Export → template CSV**:

| Colonna | Esempio |
|---|---|
| `firstName` | Lautaro |
| `lastName` | Martínez |
| `teamName` | Inter |
| `leagueName` | Serie A |
| `role` | FWD |
| `isActive` | true |

L'import è **upsert** su `(firstName, lastName, teamName)`.

> Il MOD può gestire i giocatori. Se gestisci più stagioni, importa
> all'inizio di ognuna le nuove rose.

### 0.4 Definire una Regola

Menu laterale → **Regole** → **Nuova Regola**. La regola è il "contratto"
del concorso settimanale: dice quante partite servono per essere validi,
quante schedine al massimo può fare ogni utente, ecc.

![Form di creazione regola](/aiuto/22-admin-regola.png)

I campi principali:

| Campo | Descrizione | Valore tipico |
|---|---|---|
| **Lega** | Lega di riferimento | *Serie A 2026/27* |
| **Partite richieste** | Numero di pronostici obbligatori | 13 |
| **Soglie di vittoria** | Array es. `[13, 12]` = vince chi ne indovina 13 e/o 12 | `[13]` |
| **Max doppie** | Pronostici doppi consentiti | 3 |
| **Max triple** | Pronostici tripli consentiti | 1 |
| **Max schedine/utente** | Limite di giocate per utente nel concorso | 3 |

> Tu sei l'unico che può creare/modificare regole.

### 0.5 Creare una Stagione

Menu laterale → **Stagioni** → **Nuova stagione**.

La **Stagione** rappresenta il periodo di una pool stagionale (es. il
campionato 2025-26). Solo **una stagione corrente** alla volta: il sistema
impone questo vincolo via constraint sul database.

Campi:

- **Etichetta**: es. `2025-26` (univoca)
- **Data inizio** / **Data fine** (opzionali ma utili per il riferimento)
- **Imposta come corrente** ✓

Per cambiare la stagione corrente più tardi, usa l'azione rapida
**"Imposta corrente"** in tabella: il sistema azzera il flag sulla
precedente e lo sposta sulla nuova.

### 0.6 Creare i Tornei

Menu laterale → **Tornei** → **Nuovo torneo**. Un **Tornei** rappresenta
una competizione di cui si pronostica un vincitore, un capocannoniere,
ecc. È **distinto** dalla Lega: la stessa "Serie A" può esistere come
Lega (contesto delle partite del concorso settimanale) e come Tornei
(target dei pronostici stagionali).

Tre tipi:

| Type | Esempio | Country |
|---|---|---|
| `LEAGUE_NATIONAL` | Serie A, Serie B, Serie C | Italia |
| `CUP_NATIONAL` | Coppa Italia | Italia |
| `CUP_INTERNATIONAL` | Champions League | — (nullable) |

Il sistema include un **seed automatico** all'avvio del backend con
i tornei standard italiani: Serie A, Serie B, Serie C, Coppa Italia,
Champions League. Aggiungi/disattiva dalla pagina se cambi competizioni.

---

## 1. Creare un Concorso settimanale

Menu laterale → **Concorsi** → **Nuovo Concorso**.

![Form di creazione concorso](/aiuto/23-admin-concorso.png)

Campi:

- **Nome**: es. *Schedina #5*
- **Lega**: la lega di riferimento
- **Regola**: una delle regole compatibili (stessa lega)
- **Data apertura** e **chiusura**: gli istanti in cui il concorso passerà
  automaticamente in `OPEN` e poi (potenzialmente) `CLOSED`

Il concorso nasce in stato `DRAFT`: non ancora visibile agli utenti.

## 2. Aggiungere le partite

Apri il **Dettaglio** del concorso `DRAFT`. Trovi una tabella vuota delle
partite e il pulsante **Aggiungi partita**.

![Tabella partite e form di aggiunta](/aiuto/24-admin-partite.png)

Per ogni partita imposta:

- **Casa** e **Ospite** (dropdown delle squadre della lega)
- **Numero partita** (opzionale, per ordinare la schedina)
- **Data/ora prevista**
- **Tipo di scommessa**:
  - `1X2` (default) → l'utente sceglie 1, X o 2
  - `Under/Over` → l'utente sceglie U o O rispetto a una soglia di goal totali
- **Soglia U/O** (solo se Under/Over): es. `2.5`

Il numero di partite deve essere **almeno pari al `requiredMatches`** della
regola.

### 2.1 Side bet della partita

Ogni riga partita ha un'icona viola (a forma di "strati") che apre il
modal **Side bet**. Da qui puoi aggiungere pronostici extra per quella
partita:

- **Gol/No gol** — entrambi i team segneranno?
- **Primo marcatore** — chi farà il primo gol?

I side bet sono **opzionali per l'utente** ma se configurati appaiono nella
sua schedina come tendine sotto i bottoni 1/X/2. Ogni side bet azzeccato
vale +1 nel `correctCount`.

Per il "Gol/No gol" non serve fare nulla in fase di risoluzione: si calcola
automaticamente dal punteggio quando inserisci 2-1, 0-0, ecc. Il "Primo
marcatore" invece va risolto a mano selezionando il giocatore dal dropdown
(stesso modal).

> Le partite Under/Over vincono se il *totale goal* nella partita reale è
> minore (U) o maggiore (O) della soglia. Le partite 1X2 vincono se l'esito
> coincide con il segno calcolato dai punteggi.

## 3. Aprire il concorso

Quando le partite sono pronte, dalla pagina **Concorsi** clicca **Apri**.

![Pulsante Apri su un concorso in stato DRAFT](/aiuto/25-admin-apri.png)

Lo stato passa a `OPEN`. Da questo momento:

- Il concorso compare nella lista degli utenti
- Gli utenti possono compilare e confermare schedine
- Non puoi più aggiungere/rimuovere partite

> Una volta aperto, **non puoi più tornare indietro**. Se hai sbagliato
> qualcosa devi cancellare il concorso e ricrearlo (cosa possibile solo
> se nessuno ha ancora confermato schedine).

## 4. Durante il concorso (OPEN)

Mentre il concorso è `OPEN` puoi monitorare l'andamento:

- **Dashboard**: numero di utenti attivi, schedine in corso, concorsi in stato
  `OPEN`
- **Notifiche**: vedi quali notifiche sono state inviate agli utenti

![Dashboard amministratore con i contatori](/aiuto/26-admin-dashboard.png)

## 5. Chiudere il concorso

Allo scadere del termine clicca **Chiudi**. Lo stato passa a `CLOSED`:
nessuno può più confermare nuove schedine.

> Tipicamente questa azione la fa anche un **Mod**.

## 6. Inserire risultati ed elaborare

Identico al flow del Mod (vedi *Guida Moderatore* → step 3 e 4):

- Apri il dettaglio del concorso `CLOSED`
- Inserisci i due punteggi (casa / ospite) per ogni partita
- Risolvi i side bet "Primo marcatore" via modal
- Clicca **Elabora**: il sistema confronta i pronostici (1X2/UO + side bet)
  e marca le schedine come `WINNING` o `NOT_WINNING`

Il concorso passa a `PROCESSED` e gli utenti ricevono notifica.

---

## 7. Pool stagionali

Menu laterale → **Pool stagionali**. Qui crei e configuri i concorsi
"lunghi" della stagione (scudetti, capocannoniere, coppe, ecc.).

### 7.1 Creare una pool

Clicca **Nuova pool**:

| Campo | Esempio |
|---|---|
| **Stagione** | 2025-26 (corrente) |
| **Nome** | *Pronostici Stagione 2025-26* |
| **Descrizione** | (opzionale) |
| **Apertura** / **Chiusura** | timestamp |
| **Soglie di vincita** | `7,8,9` (vince chi ne azzecca almeno 7) |

La pool nasce in `DRAFT`.

### 7.2 Configurare i bet abilitati

Nel dettaglio della pool clicca **Aggiungi** per ogni pronostico che vuoi
abilitare. Combini un **Torneo** con un **Tipo di pronostico**:

| Tipo | Target | Esempio (Torneo: Serie A) |
|---|---|---|
| `WINNER` | Squadra | Vincitore Serie A (scudetto) |
| `TOP_SCORER` | Giocatore | Capocannoniere Serie A |
| `TOP_ASSIST` | Giocatore | Miglior assist Serie A |
| `CLEAN_SHEET_TEAM` | Squadra | Porta inviolata Serie A |
| `BEST_GOALKEEPER` | Giocatore | Miglior portiere Serie A |
| `MOST_GOALS_FOR` | Squadra | Miglior attacco Serie A |
| `LEAST_GOALS_AGAINST` | Squadra | Miglior difesa Serie A |

L'etichetta visibile all'utente si genera in automatico ("Vincitore Serie A"),
ma puoi personalizzarla.

Esempio di configurazione tipica per una pool italiana:

| Torneo | Bet abilitati |
|---|---|
| Serie A | WINNER, TOP_SCORER, TOP_ASSIST, BEST_GOALKEEPER, MOST_GOALS_FOR, LEAST_GOALS_AGAINST |
| Serie B | WINNER, TOP_SCORER |
| Serie C | WINNER |
| Coppa Italia | WINNER |
| Champions League | WINNER |

> Puoi modificare/cancellare i bet **solo finché la pool è in DRAFT**.
> Una volta aperta, la configurazione è bloccata.

### 7.3 Aprire la pool

Quando la configurazione è pronta clicca **Apri pool**. Lo stato passa a
`OPEN`: gli utenti la vedono nel menu *"Stagionali"* e possono compilare
la loro schedina (una sola per utente).

### 7.4 Chiusura e risoluzione

Quando la stagione sta per iniziare, chiudi la pool (azione del Mod o tua).
Da `CLOSED` puoi risolvere i bet uno alla volta man mano che la stagione
li chiarisce: stesso meccanismo descritto nella guida del Mod (§6.3 e §6.4).

Il **processing multi-snapshot** ricalcola il `correctCount` parziale delle
schedine ogni volta che risolvi nuovi bet. La pool diventa `PROCESSED` solo
quando **tutti** i bet sono risolti.

---

## 8. Gestione utenti

Menu laterale → **Utenti**.

![Lista utenti con dropdown per cambio ruolo](/aiuto/27-admin-utenti.png)

Per ogni utente puoi:

- **Cambiare il ruolo** (USER ↔ MOD ↔ ADMIN) tramite il dropdown
- **Disattivare** un account (l'utente non può più loggarsi)

> Usa il ruolo MOD per delegare le operazioni di chiusura/processing
> a chi gestisce il giorno-per-giorno del concorso senza dargli i poteri di
> modifica strutturale.

## 9. Import / Export dei dati

Le sezioni **Leghe**, **Squadre**, **Giocatori**, **Regole** e **Concorsi**
hanno un pulsante **Import / Export** che permette di:

- Scaricare tutti i record correnti in formato **JSON**
- Importare un file **JSON o CSV** per popolare in massa
- Scaricare un **template CSV** (per Squadre e Giocatori) come base

Usalo per:

- Backup periodici prima di operazioni grosse
- Migrare i dati di una stagione precedente
- Popolazione iniziale di un campionato nuovo (es. caricare tutte le rose
  di Serie A in un colpo)

L'endpoint **Export all** restituisce un singolo JSON con leghe + squadre +
giocatori + regole + concorsi: utile come backup completo.

---

## Errori comuni e soluzioni

**"Squadre insufficienti per il concorso"**
La regola richiede N partite ma la lega ha meno di N×2 squadre attive.
Aggiungi squadre o riduci `requiredMatches`.

**"Non posso aprire il concorso"**
Verifica che il concorso abbia abbastanza partite (≥ `requiredMatches`).

**"Eliminazione bloccata"**
La risorsa è referenziata da altre (es. una lega da squadre, una squadra
da partite). Elimina prima i record dipendenti.

**Modifica risultato dopo il processing**
Si può fare: correggi il punteggio e re-clicca **Elabora**. Il sistema
resetta le schedine e ricalcola tutto.

**"Pool senza bet configurati, impossibile aprirla"**
Aggiungi almeno un bet (Aggiungi → torneo + tipo) prima di cliccare
**Apri pool**.

**"Pronostico già configurato"**
Hai già aggiunto quella combinazione (torneo + tipo) alla pool. Le coppie
sono uniche: non puoi avere due "Capocannoniere Serie A" nella stessa pool.

**Pool resta in CLOSED dopo il processing**
È normale: la pool transita a `PROCESSED` solo quando **tutti** i bet
configurati sono RESOLVED. Finché ne resta uno PENDING, il processing
aggiorna i punteggi parziali ma non chiude la pool.

**"Stagione corrente già impostata"**
Non puoi avere due stagioni con `isCurrent=true`. Usa l'azione rapida
"Imposta corrente" sulla nuova: il sistema sposta automaticamente il flag.
