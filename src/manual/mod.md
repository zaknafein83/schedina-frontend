# Guida per il Moderatore

Il **Moderatore** (`MOD`) gestisce la vita operativa: calendario e partite,
composizione e stato dei **Concorsi**, punteggi, elaborazione, scommesse. Non
gestisce utenti né anagrafiche strutturali (quello spetta all'Amministratore).

## Permessi

| Azione | Mod | Admin |
|---|---|---|
| Calendario: creare giornate e partite | ✅ | ✅ |
| Inserire punteggi / primo marcatore | ✅ | ✅ |
| Concorsi: creare, selezionare partite, aprire/chiudere/riaprire/elaborare | ✅ | ✅ |
| Scommesse fine campionato: dichiarare il risultato | ✅ | ✅ |
| Vedere le schedine e i **vincitori per modalità** (con premi) | ✅ | ✅ |
| Gestire i Giocatori | ✅ | ✅ |
| **Regole**: creare e modificare le **soglie** | ✅ | ✅ |
| Eliminare una regola | ❌ | ✅ |
| Gestire utenti, leghe, squadre, stagioni, tornei | ❌ | ✅ |

## Flusso operativo

```
Calendario (giornate + partite) → Concorso (seleziona partite del turno) →
[apri] → utenti giocano → [chiudi] → punteggi → [elabora] → PROCESSED ✓
```

---

## 1. Calendario

Menu → **Calendario**: crea le giornate di campionato (per lega) e, nel dettaglio,
le **partite**. Qui inserisci i **punteggi**, **validi** le partite e indichi il
**primo marcatore**.

![Lista delle giornate](/aiuto/11-admin-concorsi.png)

---

## 2. Concorsi

Menu → **Concorsi**: crea il concorso del turno, **seleziona le partite**
disponibili di quel turno, poi **Apri**. Allo scadere **Chiudi**, inserisci i
punteggi (dal Calendario) e **Elabora**. Puoi **Riaprire** un concorso chiuso o
elaborato per correggere.

![Dettaglio concorso](/aiuto/12-admin-concorso.png)

> L'elaborazione calcola i risultati delle schedine come **due concorsi separati**,
> Totocalcio (1X2) e Under/Over, contando per ciascuno i pronostici corretti e
> marcandolo vincente con le stesse soglie della Regola (valutate a parte). Nella
> tabella Schedine vedi le due colonne separate. È ri-eseguibile.

---

## 3. Scommesse

Le scommesse di **fine campionato** le aprono gli utenti (lega + mercato +
bersaglio); tu **dichiari il risultato** dal riquadro *Dichiara risultato* e le
giocate si risolvono. Quelle di **partita** (Gol/No gol, Vincitore, Risultato
esatto, Primo marcatore) si risolvono in automatico dal punteggio — il *Primo
marcatore* (anche **Autogol**) lo imposti dal Calendario sulla partita.

---

## 4. Schedine

Menu → **Schedine**: scegli un concorso per vedere le schedine degli utenti, con
stato, punteggio e dettaglio dei pronostici.

![Viewer delle schedine](/aiuto/13-admin-schedine.png)

---

## Cosa NON puoi fare

Gestire utenti e anagrafiche strutturali (leghe, squadre, stagioni, tornei,
regole): serve un **Amministratore**.
