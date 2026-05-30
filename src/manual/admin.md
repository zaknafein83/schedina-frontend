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
- **Scommesse**: di **fine campionato** (catalogo che crei tu) o **di partita**
  (sempre disponibili agli utenti).

```
Anagrafiche → Calendario (giornate per-lega + partite) →
Concorso (seleziona partite del turno) → [apri] → utenti compilano →
[chiudi] → punteggi sulle partite → [elabora] → PROCESSED ✓
```

---

## 0. Anagrafiche

Leghe, **Squadre** (per lega), **Giocatori** (ruolo GK/DEF/MID/FWD), **Stagioni**,
**Tornei**, **Regole** (soglie vincenti della schedina, riusabili). Import/Export
CSV per Leghe/Squadre/Giocatori.

---

## 1. Calendario (giornate di campionato)

Menu → **Calendario** → **Nuova giornata**: scegli **Lega**, **numero di turno**,
nome. Entra nel dettaglio per **aggiungere le partite** (due squadre della stessa
lega, data, soglia Under/Over). Qui inserisci anche i **punteggi**, **validi** le
partite e indichi il **primo marcatore** (per la relativa scommessa).

![Lista delle giornate](/aiuto/11-admin-concorsi.png)

---

## 2. Concorsi (Totocalcio)

Menu → **Concorsi** → **Nuovo concorso**: nome, **numero di turno**, **Regola**
(soglie), apertura/chiusura. Nel dettaglio **selezioni le partite** del turno
(colonna "Disponibili" → "Selezionate") prese dalle giornate delle varie leghe.
Poi **Apri** (servono partite selezionate), **Chiudi**, **Riapri**, **Elabora**.

![Dettaglio concorso: selezione partite](/aiuto/12-admin-concorso.png)

> L'elaborazione assegna +1 punto per ogni pronostico corretto (1X2 e U/O, fino a
> 2 a partita) e marca le schedine Vincente/Non vincente secondo le soglie della
> Regola. È incrementale e ri-eseguibile; il concorso diventa `PROCESSED` quando
> tutte le partite hanno il punteggio.

---

## 3. Scommesse

Menu → **Scommesse** (fine campionato): per una **stagione**, crei scommesse con i
candidati (squadre o giocatori; per *Miglior portiere* e *Più clean sheet* il
picker mostra solo i **portieri**). Le risolvi a mano cliccando l'opzione vincente.

Le scommesse **di partita** (Gol/No gol, Vincitore, Risultato esatto, Primo
marcatore) non si creano: sono sempre disponibili agli utenti per ogni partita.
Si risolvono **in automatico** dal punteggio (tranne *Primo marcatore*, che
imposti dal Calendario).

---

## 4. Schedine

Menu → **Schedine**: scegli un **concorso** per vedere le schedine degli utenti
con stato e punteggio; **Vedi** apre il dettaglio con i pronostici 1X2 / U-O.

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
