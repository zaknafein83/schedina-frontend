# Guida per il Moderatore

Il **Moderatore** (`MOD`) è una figura operativa: non crea concorsi
da zero ma li **gestisce** durante la loro vita — chiusura, inserimento
risultati, processing.

## Cosa può fare un Mod

| Azione | Mod | Admin |
|---|---|---|
| Visualizzare i concorsi | ✅ | ✅ |
| Inserire i punteggi reali delle partite | ✅ | ✅ |
| Chiudere un concorso | ✅ | ✅ |
| Avviare il processing (calcolo vincitori) | ✅ | ✅ |
| Ri-elaborare un concorso già processato | ✅ | ✅ |
| Creare Leghe, Squadre, Regole | ❌ | ✅ |
| Creare/eliminare Concorsi | ❌ | ✅ |
| Aggiungere o togliere partite | ❌ | ✅ |
| Gestire utenti e ruoli | ❌ | ✅ |

## Flusso tipico del Mod

```
Concorso OPEN  →  scade il termine  →  [MOD chiude]  →
Concorso CLOSED  →  [MOD inserisce risultati]  →
                  →  [MOD avvia processing]  →
                  →  Concorso PROCESSED  ✓
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

## 4. Avviare il processing

Quando tutti i risultati sono inseriti, clicca **Elabora**.
Il backend (`CouponEngine`) confronta i pronostici di ogni schedina
con gli esiti ufficiali, calcola il numero di partite indovinate, e marca
le schedine come `WINNING` o `NOT_WINNING` in base alle soglie del regolamento.

Lo stato del concorso passa a `PROCESSED`.

## 5. Ri-elaborare un concorso

Se ti accorgi a posteriori di un errore in un risultato:

1. Riapri il dettaglio del concorso `PROCESSED`
2. Correggi il risultato della partita sbagliata
3. Clicca di nuovo **Elabora**

Il sistema **resetta** le schedine e ricalcola tutto da capo —
le notifiche di vincita vengono aggiornate di conseguenza.

---

## Cosa NON puoi fare

Se hai bisogno di:

- Creare o eliminare un concorso
- Aggiungere/rimuovere partite a un concorso esistente
- Modificare leghe, squadre, regole
- Promuovere un utente a Mod o Admin

…contatta un **Amministratore**: queste azioni sono fuori dai permessi
del ruolo Mod.
