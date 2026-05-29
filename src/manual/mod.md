# Guida per il Moderatore

Il **Moderatore** (`MOD`) gestisce la vita operativa dei concorsi —
apertura, chiusura, risultati, processing — e cura l'anagrafica dei
giocatori. Non crea le entità strutturali (leghe, regole, concorsi):
quelle sono dell'Admin.

## Permessi

| Azione | Mod | Admin |
|---|---|---|
| Aprire / chiudere un concorso | ✅ | ✅ |
| Inserire risultati partite e side bet | ✅ | ✅ |
| Avviare processing (anche re-processing) | ✅ | ✅ |
| Chiudere e processare pool stagionali (multi-snapshot) | ✅ | ✅ |
| CRUD **Giocatori** + import CSV | ✅ | ✅ |
| Consultare i Listini | ✅ | ✅ |
| Creare/eliminare concorsi e pool | ❌ | ✅ |
| Aggiungere/togliere partite e side bet | ❌ | ✅ |
| Configurare i bet stagionali della pool | ❌ | ✅ |
| Gestire utenti, ruoli, anagrafiche strutturali | ❌ | ✅ |

## Flusso operativo

```
Concorso OPEN  →  scade il termine  →  [MOD chiude]  →  CLOSED  →
[MOD inserisce risultati]  →  [MOD elabora]  →  PROCESSED ✓

Pool OPEN  →  (utenti compilano)  →  [MOD chiude]  →  CLOSED  →
[MOD risolve bet uno a uno + processing]  →  tutti RESOLVED  →  PROCESSED ✓
```

---

## 1. Dashboard concorsi

Dopo il login atterri su **Concorsi (Mod)** con tutti i concorsi in
qualunque stato. Il badge di stato dice cosa puoi fare:

- **OPEN** → utenti stanno giocando, aspetta la scadenza
- **CLOSED** → puoi inserire i risultati
- **PROCESSED** → vincitori calcolati; puoi comunque ri-elaborarlo

![Dashboard del Moderatore con la lista concorsi](/aiuto/10-mod-dashboard.png)

Nel menu trovi anche **Pool stagionali**, **Giocatori**, **Schedine**
e **Listini**.

## 2. Chiudere un concorso

Sulla card del concorso aperto clicca **Chiudi**: lo stato passa a
`CLOSED` e nessuno potrà più confermare schedine.

![Pulsante Chiudi su un concorso aperto](/aiuto/11-mod-chiudi.png)

## 3. Risultati delle partite

Entra nel dettaglio del concorso `CLOSED`. Per ogni partita inserisci
**due punteggi numerici** (casa / ospite): il sistema calcola
automaticamente l'esito 1/X/2 (o U/O) e ne mostra l'anteprima.

![Inserimento punteggio casa-ospite con anteprima 1/X/2](/aiuto/12-mod-risultato.png)

Dopo il salvataggio compare un badge `2–1 (1)` che combina punteggio e
segno. Finché non lanci il processing puoi correggere reinserendo i
punteggi.

### Side bet

Ogni riga partita ha un'icona viola che apre il modal **side bet**:

- **Gol/No gol** — si risolve **da solo** quando inserisci il punteggio
  della partita. Non devi fare nulla.
- **Primo marcatore** — risoluzione **manuale**: clicca ✓ accanto al bet,
  scegli il giocatore dal dropdown (o `Nessun marcatore` per lo 0-0).

Stato visibile nel modal: **In attesa** (giallo) o **Risolto** (verde).
Se hai sbagliato un side bet, l'icona "Undo" lo riporta in attesa.

## 4. Processing

Quando tutti i risultati sono inseriti clicca **Elabora**. Il
`CouponEngine` confronta i pronostici con gli esiti (1X2/UO **+** side
bet risolti), calcola il `correctCount` di ogni schedina e la marca
`WINNING` o `NOT_WINNING` in base alle soglie della regola. Lo stato
del concorso diventa `PROCESSED`.

> I side bet ancora in attesa (es. "Primo marcatore" non risolto) non
> contano e non penalizzano: il pronostico resta neutro.

### Ri-elaborare

Se ti accorgi di un errore a posteriori:

1. Apri il dettaglio del concorso `PROCESSED`
2. Correggi il risultato (o un side bet)
3. Clicca di nuovo **Elabora**

Il sistema resetta le schedine e ricalcola tutto. Le notifiche di
vincita si aggiornano di conseguenza.

---

## 5. Pool stagionali

Le pool raccolgono i pronostici "lunghi" della stagione (scudetti,
coppe, capocannoniere, ecc.). Trovi la lista nel menu → **Pool
stagionali**.

### Lifecycle

```
DRAFT  →  [Admin apre]  →  OPEN  →  [Mod chiude]  →
CLOSED  →  [Mod risolve bet + processing]  →  PROCESSED ✓
```

Tu intervieni da `OPEN` → `CLOSED` in poi.

### Chiudere e risolvere

Quando la stagione sta per cominciare apri la pool e clicca **Chiudi
pool**. Da `CLOSED` nel dettaglio trovi la tabella di tutti i bet
configurati:

| Etichetta | Torneo | Tipo | Stato | Risultato |
|---|---|---|---|---|
| Vincitore Serie A | Serie A | WINNER | In attesa | — |
| Capocannoniere Serie A | Serie A | TOP_SCORER | In attesa | — |
| Vincitore Coppa Italia | Coppa Italia | WINNER | Risolto | Inter |

Per ogni bet ancora in attesa clicca ✓ e seleziona la squadra (bet
`TEAM`) o il giocatore (bet `PLAYER`). Tipiche finestre temporali:

| Quando lo sai | Bet tipici |
|---|---|
| Fine campionato | Vincitore, Capocannoniere, Assist, Portiere, Attacco/Difesa |
| Maggio | Vincitore Coppa Italia |
| Giugno | Vincitore Champions League |

### Processing multi-snapshot

Dopo aver risolto uno o più bet clicca **Processing** per ricalcolare
i punteggi parziali. Cosa succede:

- Le schedine confrontano le scelte solo coi bet **già risolti**
- `correctCount` si aggiorna; i bet in attesa restano `isCorrect = null`
- La pool resta `CLOSED` finché c'è almeno un bet PENDING
- Quando **tutti** i bet sono risolti la pool transita a `PROCESSED`
  e le schedine diventano `WINNING` / `NOT_WINNING`

> "Undo" su un bet sbagliato lo riporta in attesa; correggi e rilancia
> il processing.

---

## 6. Anagrafica Giocatori

Serve per i bet "Capocannoniere", "Miglior portiere", "Miglior assist"
e per il side bet "Primo marcatore". Menu → **Giocatori**.

Per ogni giocatore: **Nome**, **Cognome**, **Squadra** (opzionale),
**Ruolo** (`GK` / `DEF` / `MID` / `FWD`), **Attivo** sì/no
(gli inattivi non compaiono nei dropdown utente).

### Import CSV

In alto a destra **Import / Export**: scarica template, importa CSV o
JSON, esporta i giocatori esistenti.

| Colonna | Esempio | Note |
|---|---|---|
| `firstName` | Lautaro | obbligatorio |
| `lastName` | Martínez | obbligatorio |
| `teamName` | Inter | opzionale (deve esistere) |
| `leagueName` | Serie A | opzionale, aiuta la risoluzione squadra |
| `role` | FWD | opzionale (GK/DEF/MID/FWD) |
| `isActive` | true | opzionale |

L'import è **upsert** su `(firstName, lastName, teamName)`: se esiste
viene aggiornato, altrimenti creato.

## 7. Listini

Menu → **Listini**: vista read-only di squadre e giocatori, filtrabile.
Utile per verificare al volo l'esatto nome di un giocatore prima di
risolvere un bet.

---

## Cosa NON puoi fare

Per le seguenti azioni contatta un **Amministratore**:

- Creare/eliminare un concorso o aggiungere partite
- Creare una pool stagionale o configurarne i bet
- Modificare leghe, squadre, regole, stagioni, tornei
- Promuovere un utente a Mod o Admin
