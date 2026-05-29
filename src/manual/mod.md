# Guida per il Moderatore

Il **Moderatore** (`MOD`) gestisce la vita operativa dei concorsi — apertura,
chiusura, risoluzione delle scommesse, elaborazione — e cura l'anagrafica dei
giocatori. Non crea né elimina concorsi: quello spetta all'Amministratore.

## Permessi

| Azione | Mod | Admin |
|---|---|---|
| Aprire / chiudere un concorso | ✅ | ✅ |
| Aggiungere scommesse a un concorso | ✅ | ✅ |
| Risolvere le scommesse (impostare l'esito) | ✅ | ✅ |
| Elaborare un concorso (anche ri-elaborare) | ✅ | ✅ |
| Vedere le schedine degli utenti | ✅ | ✅ |
| Gestire i Giocatori | ✅ | ✅ |
| **Creare / eliminare** un concorso | ❌ | ✅ |
| Gestire utenti, leghe, squadre, regole, stagioni, tornei | ❌ | ✅ |

## Flusso operativo

```
Concorso OPEN  →  scade il termine  →  [chiudi]  →  CLOSED  →
[risolvi le scommesse]  →  [elabora]  →  PROCESSED ✓
```

---

## 1. Concorsi

Dal menu **Concorsi** vedi tutti i concorsi con il loro stato. Il badge dice
cosa puoi fare: **OPEN** (utenti stanno giocando), **CLOSED** (puoi risolvere ed
elaborare), **PROCESSED** (vincitori calcolati; ri-elaborabile).

![Lista dei concorsi](/aiuto/11-admin-concorsi.png)

Le azioni rapide sulla riga: **Apri** (da DRAFT), **Chiudi** (da OPEN),
**Elabora** (da CLOSED). Clicca sul nome per entrare nel dettaglio.

---

## 2. Risolvere le scommesse

Nel dettaglio del concorso vedi tutte le **scommesse**. Per ognuna, sotto
*"Imposta l'esito vincente"*, clicca l'opzione corretta: la scommessa passa a
**RESOLVED** e mostra l'esito scelto.

![Dettaglio concorso con le scommesse da risolvere](/aiuto/12-admin-concorso.png)

- **Annulla esito**: riporta la scommessa ad aperta se hai sbagliato.
- **Annulla** (void): neutralizza una scommessa che non si gioca più (non viene
  conteggiata).
- Per le scommesse legate a una partita con punteggio, l'esito (1X2, U/O,
  Gol/No gol) può essere derivato automaticamente; altrimenti lo imposti a mano.

---

## 3. Elaborare

Quando tutte le scommesse sono risolte (o annullate) clicca **Elabora**. Il
sistema calcola per ogni schedina i pronostici corretti (1 punto ciascuno) e la
marca **Vincente** o **Non vincente** in base alle soglie della regola. Lo stato
del concorso diventa `PROCESSED` e ai vincitori arriva una notifica.

> L'elaborazione è **incrementale**: puoi elaborare anche con solo alcune
> scommesse risolte (le altre restano in sospeso) e rilanciarla più volte. Il
> concorso diventa `PROCESSED` solo quando tutte le scommesse sono risolte.

---

## 4. Schedine

Dal menu **Schedine** scegli un concorso per vedere tutte le giocate degli
utenti, con stato e punteggio; **Vedi** apre il dettaglio con le singole scelte
e gli esiti.

![Viewer delle schedine per concorso](/aiuto/13-admin-schedine.png)

---

## 5. Giocatori

Menu → **Giocatori**: servono per le scommesse su persone (capocannoniere,
miglior portiere, primo marcatore…). Per ognuno: Nome, Cognome, Squadra
(opzionale), Ruolo (GK/DEF/MID/FWD), Attivo. È disponibile anche
**Import / Export** CSV/JSON.

---

## Cosa NON puoi fare

Per creare o eliminare concorsi, e per gestire utenti e anagrafiche strutturali
(leghe, squadre, regole, stagioni, tornei), serve un **Amministratore**.
