# Guida per l'Amministratore

L'**Amministratore** ha pieno controllo: crea le entità di base (leghe,
squadre, regole, stagioni, tornei, giocatori), apre concorsi e pool
stagionali, gestisce gli utenti e segue l'intero ciclo di vita di una
giocata.

## I due cicli di vita

```
Settimanale:  Lega → Squadre → Regola → Concorso (DRAFT) → +partite →
              OPEN → utenti giocano → CLOSED → risultati → PROCESSED ✓

Stagionale:   Stagione + Tornei + Giocatori → Pool (DRAFT) → +bet →
              OPEN → utenti giocano → CLOSED → risolvi bet (multi-step) →
              tutti RESOLVED → PROCESSED ✓
```

Le azioni **`[apri]` `[chiudi]` `[elabora/risolvi]`** sono a tuo carico
(un Mod può fare `chiudi` ed `elabora/risolvi`, ma non `apri`).

---

## 0. Step propedeutici (una tantum)

| # | Cosa | Per cosa serve |
|---|---|---|
| 0.1 | **Leghe** | Contesto delle partite settimanali |
| 0.2 | **Squadre** | Componenti delle partite |
| 0.3 | **Giocatori** | Capocannoniere, primo marcatore, miglior portiere |
| 0.4 | **Regole** | Parametri del concorso settimanale |
| 0.5 | **Stagioni** | Periodo di riferimento delle pool |
| 0.6 | **Tornei** | Competizioni di cui si pronostica vincitore/premi |

### 0.1 Leghe

Menu → **Leghe** → **Nuova Lega**. Campi: **Nome** (es. *Serie A 2026/27*)
e **Paese** opzionale. In alto a destra il pulsante **Import / Export**
per popolare in massa da JSON.

![Creazione di una nuova lega](/aiuto/20-admin-lega.png)

### 0.2 Squadre

Menu → **Squadre** → **Nuova Squadra** (o usa il template CSV). Campi:
**Lega**, **Nome**, **Sigla** opzionale.

![Form di creazione squadra](/aiuto/21-admin-squadra.png)

Per popolazioni grandi (10+) usa **Import / Export → template CSV**:
scarica, compila in Excel/Google Sheets, importa.

### 0.3 Giocatori

Menu → **Giocatori**. Serve per i bet stagionali "TOP_SCORER",
"TOP_ASSIST", "BEST_GOALKEEPER" e per il side bet "Primo marcatore".

Campi: **Nome**, **Cognome** (obbligatori), **Squadra**, **Ruolo**
(`GK` / `DEF` / `MID` / `FWD`), **Attivo**.

Import CSV (upsert su `firstName + lastName + teamName`):

| Colonna | Esempio |
|---|---|
| `firstName` | Lautaro |
| `lastName` | Martínez |
| `teamName` | Inter |
| `leagueName` | Serie A |
| `role` | FWD |
| `isActive` | true |

> Anche un Mod può gestirli. All'inizio di una nuova stagione importa
> in blocco le rose aggiornate.

### 0.4 Regole

Menu → **Regole** → **Nuova Regola**. È il "contratto" del concorso
settimanale: definisce quante partite, quante doppie/triple, le soglie
di vittoria, il limite di schedine per utente.

![Form di creazione regola](/aiuto/22-admin-regola.png)

| Campo | Descrizione | Valore tipico |
|---|---|---|
| **Lega** | Lega di riferimento | *Serie A 2026/27* |
| **Partite richieste** | N° pronostici obbligatori | 13 |
| **Soglie di vittoria** | Es. `[13, 12]` = vince chi ne indovina 13 o 12 | `[13]` |
| **Max doppie / triple** | Numero massimo per schedina | 3 / 1 |
| **Max schedine/utente** | Limite di giocate per concorso | 3 |

### 0.5 Stagioni

Menu → **Stagioni** → **Nuova stagione**. Solo **una corrente** alla
volta (vincolo DB).

Campi: **Etichetta** univoca (es. `2025-26`), **Data inizio / fine**
opzionali, **Imposta come corrente**.

Per cambiare la corrente più tardi: azione rapida **"Imposta corrente"**
sulla nuova riga (il sistema sposta automaticamente il flag).

### 0.6 Tornei

Menu → **Tornei** → **Nuovo torneo**. Un Torneo è una competizione di
cui si pronostica un vincitore o un premio individuale. È **distinto**
dalla Lega: la "Serie A" può esistere sia come Lega (contesto del
concorso settimanale) sia come Torneo (target dei bet stagionali).

| Type | Esempio | Country |
|---|---|---|
| `LEAGUE_NATIONAL` | Serie A, B, C | Italia |
| `CUP_NATIONAL` | Coppa Italia | Italia |
| `CUP_INTERNATIONAL` | Champions League | — |

Al primo avvio il backend seeda i tornei standard italiani; aggiungi
o disattiva dalla pagina secondo le competizioni che ti interessano.

---

## 1. Creare un Concorso settimanale

Menu → **Concorsi** → **Nuovo Concorso**. Campi: **Nome**, **Lega**,
**Regola** (compatibile con la lega), **Data apertura** e **chiusura**.

![Form di creazione concorso](/aiuto/23-admin-concorso.png)

Nasce in `DRAFT`: non visibile agli utenti.

## 2. Aggiungere le partite

Nel dettaglio del concorso `DRAFT` clicca **Aggiungi partita** per
ciascun match:

- **Casa** / **Ospite** (dropdown squadre della lega)
- **Numero partita** opzionale (ordina la schedina)
- **Data/ora**
- **Tipo di scommessa**: `1X2` (default) o `Under/Over` con **soglia U/O**

![Tabella partite e form di aggiunta](/aiuto/24-admin-partite.png)

Il numero di partite deve essere **≥ `requiredMatches`** della regola.

### Side bet per partita

Ogni riga ha un'icona viola che apre il modal **Side bet**:

- **Gol/No gol** — si risolve automaticamente dal punteggio in fase di
  inserimento risultato
- **Primo marcatore** — risoluzione manuale, scegli il giocatore dal
  dropdown delle due squadre

I side bet sono opzionali per l'utente. Ogni side bet azzeccato vale
+1 nel `correctCount`.

## 3. Aprire il concorso

Dalla pagina **Concorsi** clicca **Apri**: stato → `OPEN`. Da questo
momento gli utenti lo vedono e possono compilare; **non puoi più
aggiungere/rimuovere partite**.

![Pulsante Apri su un concorso in stato DRAFT](/aiuto/25-admin-apri.png)

> Apertura **non reversibile**. Se serve correggere qualcosa puoi
> cancellare il concorso (solo se nessuno ha confermato schedine) e
> ricrearlo.

## 4. Durante e dopo

Mentre il concorso è `OPEN`, dalla **Dashboard** monitori numero di
utenti attivi, schedine in corso, concorsi aperti.

![Dashboard amministratore con i contatori](/aiuto/26-admin-dashboard.png)

Alla scadenza chiudi (`Chiudi` → `CLOSED`, può farlo anche un Mod).

Per **risultati + processing** il flusso è identico al Mod (vedi *Guida
Moderatore* → §3 e §4): inserisci punteggi, risolvi i "Primo
marcatore", clicca **Elabora**, lo stato passa a `PROCESSED` e gli
utenti ricevono notifica.

---

## 5. Pool stagionali

Menu → **Pool stagionali**. Qui crei e configuri i concorsi "lunghi"
della stagione.

### Creare e configurare

**Nuova pool** con: **Stagione** corrente, **Nome**, **Apertura /
Chiusura** e **Soglie di vincita** (es. `7,8,9`). Nasce in `DRAFT`.

Nel dettaglio clicca **Aggiungi** per ogni bet: combinazione di
**Torneo** + **Tipo**.

| Tipo | Target | Esempio (Torneo: Serie A) |
|---|---|---|
| `WINNER` | Squadra | Vincitore Serie A |
| `TOP_SCORER` | Giocatore | Capocannoniere Serie A |
| `TOP_ASSIST` | Giocatore | Miglior assist Serie A |
| `CLEAN_SHEET_TEAM` | Squadra | Porta inviolata Serie A |
| `BEST_GOALKEEPER` | Giocatore | Miglior portiere Serie A |
| `MOST_GOALS_FOR` | Squadra | Miglior attacco Serie A |
| `LEAST_GOALS_AGAINST` | Squadra | Miglior difesa Serie A |

Combinazione tipica per una pool italiana:

| Torneo | Bet abilitati |
|---|---|
| Serie A | WINNER, TOP_SCORER, TOP_ASSIST, BEST_GOALKEEPER, MOST_GOALS_FOR, LEAST_GOALS_AGAINST |
| Serie B | WINNER, TOP_SCORER |
| Serie C / Coppa Italia / Champions | WINNER |

> Bet modificabili **solo in DRAFT**. Aperta la pool, la configurazione
> è bloccata. Coppia (Torneo + Tipo) unica per pool.

### Apertura, chiusura, risoluzione

**Apri pool** → `OPEN`. **Chiudi pool** quando la stagione comincia
(può anche un Mod). Da `CLOSED` risolvi i bet uno alla volta come
descritto in *Guida Moderatore §5*: il processing multi-snapshot
ricalcola i punteggi parziali, la pool passa a `PROCESSED` solo quando
**tutti** i bet sono RESOLVED.

---

## 6. Utenti

Menu → **Utenti**. Per ogni utente: **cambia ruolo** (USER ↔ MOD ↔
ADMIN) dal dropdown e **disattiva** l'account se serve.

![Lista utenti con dropdown per cambio ruolo](/aiuto/27-admin-utenti.png)

> Usa il ruolo MOD per delegare le operazioni di chiusura/processing
> a chi gestisce il day-by-day senza dare poteri strutturali.

## 7. Import / Export

Le sezioni **Leghe**, **Squadre**, **Giocatori**, **Regole** e
**Concorsi** hanno un pulsante **Import / Export** che permette:

- Scaricare i record correnti in **JSON**
- Importare un **JSON o CSV** per popolare in massa
- Scaricare un **template CSV** (Squadre e Giocatori) come base

L'endpoint **Export all** restituisce un singolo JSON con tutto:
backup completo, comodo prima di operazioni grosse o per migrare i
dati di una stagione precedente.

---

## Errori comuni

**"Squadre insufficienti per il concorso"** — la regola richiede N
partite ma la lega ha < N×2 squadre attive. Aggiungi squadre o riduci
`requiredMatches`.

**"Non posso aprire il concorso"** — il concorso ha meno partite di
quante ne richiede la regola.

**"Eliminazione bloccata"** — la risorsa è referenziata altrove (lega
da squadre, squadra da partite). Elimina prima i dipendenti.

**Errore in un risultato dopo il processing** — correggi e clicca di
nuovo **Elabora**: il sistema resetta e ricalcola.

**"Pool senza bet configurati"** — aggiungi almeno un bet (torneo +
tipo) prima di aprire.

**"Pronostico già configurato"** — la coppia (Torneo + Tipo) esiste
già in questa pool. Sono uniche.

**Pool resta CLOSED dopo il processing** — è normale finché c'è
almeno un bet PENDING. Risolvi gli ultimi e rilancia.

**"Stagione corrente già impostata"** — non puoi averne due con
`isCurrent=true`. Usa "Imposta corrente" sulla nuova: il flag si
sposta automaticamente.
