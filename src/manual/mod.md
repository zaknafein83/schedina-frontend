# Guida per il Moderatore

Il **Moderatore** (`MOD`) è una figura operativa: non crea i dati
propedeutici da zero ma **gestisce** la vita dei concorsi — apertura,
chiusura, inserimento risultati, processing — e cura l'anagrafica dei
giocatori usata nei pronostici.

## Cosa può fare un Mod

| Azione | Mod | Admin |
|---|---|---|
| Visualizzare i concorsi | ✅ | ✅ |
| Aprire / chiudere un concorso | ✅ | ✅ |
| Inserire i punteggi reali delle partite | ✅ | ✅ |
| Avviare il processing (calcolo vincitori) | ✅ | ✅ |
| Ri-elaborare un concorso già processato | ✅ | ✅ |
| Gestire i **side bet** per partita (gol/no gol, primo marcatore) | ✅ | ✅ |
| Gestire le **pool stagionali** (open/close/process, risoluzione bet) | ✅ | ✅ |
| CRUD anagrafica **Giocatori** + import CSV | ✅ | ✅ |
| Consultare i **Listini** (squadre/giocatori) | ✅ | ✅ |
| Creare Leghe, Squadre, Regole, Stagioni, Tornei | ❌ | ✅ |
| Creare/eliminare Concorsi e Pool stagionali | ❌ | ✅ |
| Aggiungere o togliere partite | ❌ | ✅ |
| Gestire utenti e ruoli | ❌ | ✅ |

## Flusso tipico del Mod

```
Concorso OPEN  →  scade il termine  →  [MOD chiude]  →
Concorso CLOSED  →  [MOD inserisce risultati]  →
                  →  [MOD avvia processing]  →
                  →  Concorso PROCESSED  ✓
```

In parallelo, per la pool stagionale:

```
Pool OPEN  →  (utenti compilano)  →  [MOD chiude]  →
Pool CLOSED  →  [MOD risolve bet uno alla volta]  →
            →  [MOD lancia processing più volte]  →
            →  Tutti i bet RESOLVED  →  Pool PROCESSED ✓
```

---

## 1. La tua dashboard

Dopo il login atterri sulla pagina **Concorsi (Mod)**. Vedi tutti i concorsi
indipendentemente dallo stato.

![Dashboard del Moderatore con la lista concorsi](/aiuto/10-mod-dashboard.png)

Per ogni concorso il badge di stato indica cosa puoi fare:

- **OPEN** → il concorso è aperto, gli utenti stanno giocando. Aspetta la scadenza
- **CLOSED** → puoi inserire i risultati delle partite
- **PROCESSED** → i vincitori sono già stati calcolati; puoi comunque ri-elaborarlo
  se trovi un errore (es. risultato corretto a posteriori)

Nel menu laterale trovi anche **Pool stagionali**, **Giocatori**, **Schedine**
e **Listini**.

## 2. Chiudere un concorso

Quando il termine di chiusura è scaduto (o vuoi chiudere prima), clicca
**Chiudi** sulla card del concorso. Lo stato passa a `CLOSED`: nessun
utente potrà più confermare nuove schedine.

![Pulsante Chiudi su un concorso aperto](/aiuto/11-mod-chiudi.png)

## 3. Inserire i risultati delle partite

Entra nel **Dettaglio** del concorso `CLOSED`. Per ogni partita inserisci
**due punteggi numerici** (casa / ospite). Il sistema calcola
automaticamente l'esito 1/X/2 (o U/O per le partite Under/Over) e
mostra un'anteprima in tempo reale.

![Inserimento punteggio casa-ospite con anteprima 1/X/2](/aiuto/12-mod-risultato.png)

Dopo aver salvato, la partita mostra il badge sintetico `2–1 (1)` che combina
punteggio e segno.

> Se sbagli un risultato, puoi correggerlo: basta reinserire i punteggi
> e salvare. Il sistema accetta modifiche finché non avvii il processing.

### 3.1 Side bet: Gol/No gol e Primo marcatore

Ogni riga partita ha un'icona viola (a forma di "strati") che apre un modal
dedicato ai **side bet** configurati per quella partita:

- **Gol/No gol** — si risolve **automaticamente** quando inserisci il
  punteggio (sopra). Se entrambi i team hanno segnato almeno un gol → `Goal`,
  altrimenti `No goal`. Non devi fare nulla a mano.
- **Primo marcatore** — qui invece serve la tua risoluzione manuale. Apri
  il modal, clicca l'icona ✓ accanto al bet, e scegli il giocatore dal
  dropdown (la lista contiene i giocatori delle due squadre dell'incontro).
  Se la partita finisce 0-0 seleziona `Nessun marcatore`.

Lo stato di ogni side bet si vede nel modal:
- **In attesa** (giallo) → ancora non risolto
- **Risolto** (verde) → con il risultato a fianco

Puoi annullare la risoluzione di un side bet (icona "Undo") se hai sbagliato.

## 4. Avviare il processing

Quando tutti i risultati sono inseriti, clicca **Elabora**.
Il backend (`CouponEngine`) confronta i pronostici di ogni schedina
con gli esiti ufficiali, calcola il numero di partite indovinate
(**inclusi i side bet azzeccati**), e marca le schedine come `WINNING`
o `NOT_WINNING` in base alle soglie del regolamento.

Lo stato del concorso passa a `PROCESSED`.

> Ogni side bet azzeccato vale come una partita azzeccata in più nel
> `correctCount` finale. I side bet ancora in attesa (es. "Primo marcatore"
> non risolto) non contano: l'utente non viene penalizzato, semplicemente
> il pronostico resta neutro.

## 5. Ri-elaborare un concorso

Se ti accorgi a posteriori di un errore in un risultato:

1. Riapri il dettaglio del concorso `PROCESSED`
2. Correggi il risultato della partita sbagliata (o di un side bet)
3. Clicca di nuovo **Elabora**

Il sistema **resetta** le schedine e ricalcola tutto da capo —
le notifiche di vincita vengono aggiornate di conseguenza.

---

## 6. Pool stagionali

Le **pool stagionali** raccolgono i pronostici "lunghi" della stagione:
scudetti, coppe, capocannoniere, miglior portiere, miglior assist, ecc.
Non hai partite settimanali ma una lista di domande a cui gli utenti
hanno risposto una volta sola a inizio stagione.

Trovi la lista delle pool nel menu laterale → **Pool stagionali**.

### 6.1 Lifecycle della pool

```
DRAFT  →  [Admin apre]  →  OPEN  →  [Mod chiude]  →
CLOSED  →  [Mod risolve bet via via]  →  PROCESSED ✓
```

- **DRAFT**: pool in configurazione (l'admin sta scegliendo i bet)
- **OPEN**: gli utenti compilano la schedina stagionale
- **CLOSED**: stagione iniziata, niente più compilazioni
- **PROCESSED**: tutti i bet sono stati risolti, vincitori calcolati

Tu come Mod intervieni dalla chiusura in poi.

### 6.2 Chiudere la pool

Quando la stagione sta per cominciare e non vuoi più accettare schedine,
apri la pool e clicca **Chiudi pool**. Lo stato passa a `CLOSED`.

### 6.3 Risolvere i bet stagionali

Nel dettaglio della pool trovi una tabella con tutti i bet configurati:

| Etichetta | Torneo | Tipo | Stato | Risultato |
|---|---|---|---|---|
| Vincitore Serie A | Serie A | WINNER | In attesa | — |
| Capocannoniere Serie A | Serie A | TOP_SCORER | In attesa | — |
| Vincitore Coppa Italia | Coppa Italia | WINNER | Risolto | Inter |

Per ogni bet ancora in attesa, clicca l'icona ✓ e seleziona la squadra
(per i bet target `TEAM`) oppure il giocatore (per i bet target `PLAYER`).

I bet si risolvono **uno alla volta**, man mano che la stagione li chiarisce:

| Quando lo sai? | Bet tipici |
|---|---|
| Fine campionato | Vincitore, Capocannoniere, Assist, Portiere, Miglior attacco/difesa |
| Maggio | Vincitore Coppa Italia |
| Giugno | Vincitore Champions League |

### 6.4 Processing multi-snapshot

Ogni volta che risolvi uno o più bet puoi cliccare **Processing** per
ricalcolare i punteggi parziali di tutte le schedine. Non devi aspettare
di aver risolto tutto.

Cosa succede a ogni processing:

- Per ogni schedina, il sistema confronta le scelte dell'utente con i
  bet **già risolti**
- Aggiorna il `correctCount` con il numero di bet azzeccati finora
- I bet ancora in attesa restano `isCorrect = null` (in ⏳ per l'utente)
- La pool resta in `CLOSED` finché non hai risolto **tutti** i bet
- Solo quando l'ultimo bet è risolto, la pool transita a `PROCESSED`
  e vengono marcate le schedine `WINNING` / `NOT_WINNING`

> Se hai sbagliato la risoluzione di un bet, clicca l'icona "Undo": torna
> in attesa. Puoi anche correggere il valore e ri-lanciare il processing.

---

## 7. Anagrafica Giocatori

Per i bet "Capocannoniere", "Miglior portiere", "Miglior assist" e per il
side bet "Primo marcatore" serve un'anagrafica giocatori. Trovi la pagina
nel menu sotto **Giocatori**.

Per ogni giocatore puoi gestire:

- **Nome** e **Cognome** (obbligatori)
- **Squadra** (opzionale: un giocatore libero/svincolato può non averla)
- **Ruolo**: `GK` portiere, `DEF` difensore, `MID` centrocampista, `FWD` attaccante
- **Attivo** sì/no (gli inattivi non compaiono nei dropdown utente)

### 7.1 Import CSV

In alto a destra trovi il pulsante **Import / Export**:

- Scarica un **template CSV** per popolare in massa
- Importa un file CSV o JSON
- Esporta tutti i giocatori esistenti

Colonne del CSV:

| Colonna | Esempio | Note |
|---|---|---|
| `firstName` | Lautaro | obbligatorio |
| `lastName` | Martínez | obbligatorio |
| `teamName` | Inter | opzionale (deve esistere) |
| `leagueName` | Serie A | opzionale, aiuta nel resolve della squadra |
| `role` | FWD | opzionale (GK/DEF/MID/FWD) |
| `isActive` | true | opzionale |

L'import è **upsert**: se esiste già un giocatore con lo stesso
`(firstName, lastName, teamName)` viene aggiornato, altrimenti creato.

> Usa l'import CSV all'inizio di ogni stagione per popolare in blocco le
> rose. È molto più rapido di crearli uno a uno dalla UI.

## 8. Listini

Nel menu **Listini** trovi una vista read-only di squadre e giocatori,
filtrabile per lega / squadra / ruolo. Comoda per verificare al volo
l'esatto nome di un giocatore prima di risolvere un bet.

---

## Cosa NON puoi fare

Se hai bisogno di:

- Creare o eliminare un concorso
- Aggiungere/rimuovere partite a un concorso esistente
- Creare/eliminare una pool stagionale
- Configurare quali bet stagionali abilitare (l'admin decide questo)
- Modificare leghe, squadre, regole, stagioni, tornei
- Promuovere un utente a Mod o Admin

…contatta un **Amministratore**: queste azioni sono fuori dai permessi
del ruolo Mod.
