# Guida per l'Amministratore

L'**Amministratore** cura le anagrafiche, costruisce il **calendario** delle
giornate, compone i **Concorsi** del Totocalcio, gestisce le **scommesse** e gli
utenti, e segue l'intero ciclo di vita di una giocata.

## Il modello in concetti

- **Giornata di campionato** (*Calendario*): è **per-lega** (Serie A / B / C…) e
  identifica un turno. Contiene solo le **partite** di quella lega in quel turno.
  Esistono "Serie A — Giornata 1", "Serie B — Giornata 1", ecc. È solo calendario.
- **Concorso** (*Totocalcio*): la cosa **giocabile**. Fa riferimento a un turno e
  contiene una **selezione di partite** (scelte a mano tra le giornate di quel
  turno, anche di leghe diverse). Ha finestra apertura/chiusura e una **Regola**
  (soglie vincenti). È questo che l'utente compila.
- **Schedina**: il bollettino dell'utente sul concorso (1X2 + Under/Over per partita).
- **Scommesse**: di **fine campionato** (le aprono gli utenti per lega/mercato; tu
  ne dichiari il risultato) o **di partita** (sempre disponibili agli utenti).

```
Anagrafiche → Calendario (giornate per-lega + partite) →
Concorso (seleziona partite del turno) → [apri] → utenti compilano →
[chiudi] → punteggi sulle partite → [elabora] → PROCESSED ✓
```

---

## 0. Anagrafiche

Leghe, **Squadre** (per lega), **Giocatori** (ruolo GK/DEF/MID/FWD), **Stagioni**,
**Tornei**, **Regole** (solo **soglie vincenti** della schedina; riusabili).
Modificando le soglie di una regola, i concorsi già elaborati che la usano vengono
**rielaborati** automaticamente. I **premi in €** si impostano sul singolo
**Concorso** (separati per Totocalcio e Under/Over). Import/Export CSV per
Leghe/Squadre/Giocatori.

---

## 1. Calendario (giornate di campionato)

Menu → **Calendario** → **Nuova giornata**: scegli **Lega**, **numero di turno**,
nome. Entra nel dettaglio per **aggiungere le partite** (due squadre della stessa
lega, data, soglia Under/Over). Qui inserisci anche i **punteggi**, **validi** le
partite e indichi il **primo marcatore** (per la relativa scommessa).

**Import/Export CSV** (in alto a destra): esporti tutto il calendario o importi
intere giornate da un file. Ogni riga è una partita; colonne: `number` (turno),
`homeTeamName`, `awayTeamName` e — opzionali — `leagueName`, `giornataName`,
`date` (AAAA-MM-GG), `overUnderLine`. Le **squadre devono già esistere**; se ometti
`leagueName` la lega è dedotta dalla squadra di casa. Le righe con squadre non
trovate vengono saltate e contate. La giornata (lega+turno) viene creata se manca
e le partite sono aggiornate senza duplicati. Scarica il **Template** come esempio.

![Lista delle giornate](/aiuto/11-admin-concorsi.png)

---

## 2. Concorsi (Totocalcio)

Menu → **Concorsi** → **Nuovo concorso**: nome, **numero di turno**, **Regola**
(soglie), apertura/chiusura. Nel dettaglio **selezioni le partite** del turno
(colonna "Disponibili" → "Selezionate") prese dalle giornate delle varie leghe, e
imposti i **Premi (€)** per soglia — **separati per Totocalcio e Under/Over** (es. il
13 può valere importi diversi nei due giochi). Salvando i premi, se il concorso è già
elaborato le vincite vengono ricalcolate. Poi **Apri** (servono partite selezionate),
**Chiudi**, **Riapri**, **Elabora**.

![Dettaglio concorso: selezione partite](/aiuto/12-admin-concorso.png)

> L'elaborazione calcola **due concorsi separati**: Totocalcio (1X2) e Under/Over.
> Per ciascuno conta i pronostici corretti e lo marca vincente con le stesse soglie
> della Regola (valutate a parte) — un utente può vincere un gioco e non l'altro. La
> tabella Schedine mostra le due colonne distinte. È incrementale e ri-eseguibile;
> il concorso diventa `PROCESSED` quando tutte le partite hanno il punteggio.

---

## 3. Scommesse

Menu → **Scommesse** (fine campionato): **non le crei più tu** — le aprono
direttamente gli utenti scegliendo lega + mercato + bersaglio. Tu **dichiari il
risultato**: nel riquadro *Dichiara risultato* scegli **Lega**, **Mercato** e il
**vincitore** (squadra o giocatore; per *Miglior portiere* e *Più clean sheet* il
picker mostra solo i **portieri**) → tutte le giocate corrispondenti vengono
risolte. Sotto vedi l'elenco delle scommesse della stagione con stato e numero di
giocate; puoi *Annullare l'esito* o *Annullare/Eliminare* una scommessa.

Le scommesse **di partita** (Gol/No gol, Vincitore, Risultato esatto, Primo
marcatore) non si creano: sono sempre disponibili agli utenti per ogni partita.
Si risolvono **in automatico** dal punteggio (tranne *Primo marcatore*, che
imposti dal Calendario — puoi indicare anche **Autogol**).

---

## 4. Schedine

Menu → **Schedine**: scegli un **concorso** per vedere, in cima, i **vincitori per
modalità** (Totocalcio 1X2 e Under/Over) con i premi, e sotto la tabella di tutte le
schedine con i risultati e l'importo vinto per gioco; **Vedi** apre il dettaglio con
i pronostici 1X2 / U-O.

![Viewer delle schedine](/aiuto/13-admin-schedine.png)

---

## 5. Utenti

Menu → **Utenti**: cambia ruolo (USER/MOD/ADMIN) e attiva/disattiva. Delega a un
**Mod** la gestione operativa (calendario, punteggi, concorsi, scommesse) senza
poteri strutturali.

---

## Errori comuni

**"Il concorso non ha partite selezionate"** — seleziona almeno una partita prima
di aprire.

**"La partita deve appartenere a una giornata del turno N"** — le partite del
concorso devono essere dello stesso numero di turno del concorso.

**"Le squadre devono appartenere alla lega della giornata"** — scegli squadre
della lega della giornata di campionato.
