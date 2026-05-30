# Guida per il Moderatore

Il **Moderatore** (`MOD`) gestisce la vita operativa delle giornate — apertura,
chiusura, inserimento punteggi, elaborazione — risolve le scommesse extra e cura
l'anagrafica dei giocatori. Non crea né elimina le giornate: quello spetta
all'Amministratore.

## Permessi

| Azione | Mod | Admin |
|---|---|---|
| Aprire / chiudere una giornata | ✅ | ✅ |
| Aggiungere partite a una giornata | ✅ | ✅ |
| Inserire i punteggi delle partite | ✅ | ✅ |
| Elaborare una giornata (anche ri-elaborare) | ✅ | ✅ |
| Creare e risolvere le scommesse extra | ✅ | ✅ |
| Vedere le schedine degli utenti | ✅ | ✅ |
| Gestire i Giocatori | ✅ | ✅ |
| **Creare / eliminare** una giornata | ❌ | ✅ |
| Gestire utenti, leghe, squadre, stagioni, tornei | ❌ | ✅ |

## Flusso operativo

```
Giornata OPEN  →  scade il termine  →  [chiudi]  →  CLOSED  →
[inserisci i punteggi]  →  [elabora]  →  PROCESSED ✓
```

---

## 1. Calendario / Giornate

Dal menu **Calendario** vedi tutte le giornate con il loro stato. Il badge dice
cosa puoi fare: **OPEN** (utenti stanno giocando), **CLOSED** (puoi inserire i
punteggi ed elaborare), **PROCESSED** (vincitori calcolati; ri-elaborabile).

![Lista delle giornate](/aiuto/11-admin-concorsi.png)

Le azioni rapide sulla riga: **Apri** (da DRAFT), **Chiudi** (da OPEN),
**Elabora** (da CLOSED). Clicca sul nome per entrare nel dettaglio.

---

## 2. Inserire i punteggi

Nel dettaglio della giornata, sezione **Partite**, su ogni partita inserisci il
**punteggio** (casa-ospite) e clicca **Salva**: gli esiti 1X2 e Under/Over si
calcolano dal punteggio. Con **Valida** blocchi il risultato della partita.

![Dettaglio giornata con le partite](/aiuto/12-admin-concorso.png)

---

## 3. Elaborare

Quando hai inserito i punteggi clicca **Elabora**. Il sistema calcola per ogni
schedina i pronostici corretti (1 punto ciascuno, fino a 2 per partita) e la
marca **Vincente** o **Non vincente** in base alle soglie della giornata. Lo
stato della giornata diventa `PROCESSED` e ai vincitori arriva una notifica.

> L'elaborazione è **incrementale**: puoi elaborare anche con solo alcuni
> punteggi inseriti e rilanciarla più volte. La giornata diventa `PROCESSED`
> solo quando tutte le partite hanno il punteggio.

---

## 4. Scommesse extra

Dal menu **Scommesse** crei e risolvi le scommesse di fine stagione o di
giornata. Per risolverle clicca l'opzione vincente sotto *"Imposta l'esito
vincente"*: la scommessa passa a **RESOLVED** e le giocate degli utenti vengono
valutate. **Annulla esito** la riapre; **Annulla** (void) la neutralizza. Le
scommesse *Gol/No gol* collegate a una partita si risolvono in automatico
all'inserimento del punteggio.

---

## 5. Schedine

Dal menu **Schedine** scegli una giornata per vedere tutte le schedine degli
utenti, con stato e punteggio; **Vedi** apre il dettaglio con i pronostici 1X2 /
Under/Over e gli esiti.

![Viewer delle schedine per giornata](/aiuto/13-admin-schedine.png)

---

## 6. Giocatori

Menu → **Giocatori**: servono per le scommesse su persone (capocannoniere,
miglior portiere, primo marcatore…). Per ognuno: Nome, Cognome, Squadra
(opzionale), Ruolo (GK/DEF/MID/FWD), Attivo. È disponibile anche
**Import / Export** CSV/JSON.

---

## Cosa NON puoi fare

Per creare o eliminare le giornate, e per gestire utenti e anagrafiche
strutturali (leghe, squadre, stagioni, tornei), serve un **Amministratore**.
