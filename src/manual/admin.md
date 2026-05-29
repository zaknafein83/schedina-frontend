# Guida per l'Amministratore

L'**Amministratore** ha pieno controllo: cura le anagrafiche, crea i concorsi e
le loro scommesse, gestisce gli utenti e segue l'intero ciclo di vita di una
giocata.

## Il modello in due concetti

- **Scommessa**: una singola cosa da pronosticare, con le sue opzioni e un
  esito ufficiale. Può essere legata a una partita (1X2, Under/Over, Gol/No gol)
  oppure stagionale (vincitore, capocannoniere, miglior difesa…).
- **Schedina**: la giocata di un utente, cioè un insieme di scelte (una per
  scommessa).

Un **Concorso** raggruppa le scommesse e ha le sue regole. Tipo *Giornata*
(partite) o *Stagionale*: cambia solo quali scommesse contiene.

```
Anagrafiche → Regola → Concorso (DRAFT) → +scommesse → [apri] → OPEN →
utenti giocano → [chiudi] → CLOSED → risolvi scommesse → [elabora] → PROCESSED ✓
```

---

## 0. Anagrafiche (una tantum)

Dal menu laterale:

- **Leghe** — il contesto delle partite (es. *Serie A 2026/27*).
- **Squadre** — appartengono a una lega (Import/Export CSV per popolare in massa).
- **Giocatori** — per le scommesse su persone; Nome, Cognome, Squadra, Ruolo
  (GK/DEF/MID/FWD). Import/Export CSV (upsert su nome+cognome+squadra).
- **Stagioni** e **Tornei** — riferimenti per le scommesse stagionali
  (vincitore di un torneo, capocannoniere…).
- **Regole** — i parametri di un concorso (vedi sotto).

### Regole

Menu → **Regole** → **Nuova regola**:

| Campo | Descrizione |
|---|---|
| **Scommesse richieste** | quante scommesse deve coprire la schedina |
| **Soglie di vittoria** | punteggi vincenti, es. `[12, 13]` (match esatto) |
| **Max schedine/utente** | limite di giocate per concorso (vuoto = illimitato) |
| **Schedina completa obbligatoria** | se attivo, l'utente deve rispondere a tutte le scommesse |
| **Lega** | opzionale (le regole stagionali non sono legate a una lega) |

> La vincita è a **soglia esatta**: con soglie `[12,13]` vince chi totalizza
> esattamente 12 o 13 pronostici corretti. Ogni scommessa indovinata vale 1.

---

## 1. Dashboard

La **Dashboard** mostra i contatori principali: utenti, schedine totali/vincenti,
concorsi aperti/processati, scommesse aperte, notifiche.

![Dashboard amministratore](/aiuto/10-admin-dashboard.png)

---

## 2. Creare un concorso

Menu → **Concorsi** → **Nuovo concorso**. Campi: **Nome**, **Tipo**
(Giornata / Stagionale), **Regola**, **Apertura** e **Chiusura**. Nasce in
`DRAFT` (non visibile agli utenti).

![Lista dei concorsi](/aiuto/11-admin-concorsi.png)

---

## 3. Aggiungere le partite (1X2 / Under-Over / Gol-No gol)

Nel dettaglio del concorso, sezione **Partite**, clicca **Aggiungi partita**:

- **Casa** e **Ospite** — scegli le due squadre. Sono raggruppate per divisione
  (Serie A / B / C): le due squadre di una partita devono essere della **stessa
  divisione**, ma una schedina può contenere partite di **divisioni diverse**.
- **Data e ora** della partita.
- **Mercati da creare**: spunta quelli che vuoi — *Esito 1X2*, *Under/Over*
  (con la soglia, es. 2.5), *Gol/No gol*. Vengono creati i relativi pronostici,
  con le opzioni (1/X/2, Under/Over, Gol/No gol) generate in automatico.

![Dettaglio concorso: partite e pronostici](/aiuto/12-admin-concorso.png)

### Altre scommesse (stagionali)

Per i pronostici non legati a una partita usa **Aggiungi (vincitore,
capocannoniere…)** e seleziona le opzioni candidate:

| Mercato | Target |
|---|---|
| Vincitore, Più clean sheet, Più gol fatti, Meno gol subiti | Squadra |
| Capocannoniere, Miglior assist, Miglior portiere, Primo marcatore | Giocatore |

---

## 4. Aprire, inserire i risultati, elaborare

- **Apri**: stato → `OPEN`, gli utenti possono giocare.
- **Chiudi**: stato → `CLOSED` allo scadere del termine.
- **Risultati delle partite**: su ogni partita inserisci il **punteggio**
  (casa-ospite) e clicca **Salva**: i pronostici 1X2, Under/Over e Gol/No gol
  di quella partita si risolvono **automaticamente**. Per correggere, *Annulla
  esito* sul pronostico e reinserisci il punteggio.
- **Scommesse stagionali**: si risolvono a mano cliccando l'opzione vincente
  (*Imposta l'esito vincente*).
- **Elabora**: calcola le schedine e le marca Vincente/Non vincente; il
  concorso passa a `PROCESSED`. È **incrementale** e **ri-eseguibile**: puoi
  elaborare anche con solo alcuni esiti inseriti e rilanciare dopo.

(Le operazioni di chiusura/risoluzione/elaborazione può farle anche un **Mod**.)

---

## 5. Schedine

Menu → **Schedine**: scegli un concorso per vedere tutte le giocate degli
utenti con stato e punteggio; **Vedi** apre il dettaglio con le scelte e gli
esiti (✓/✗).

![Viewer delle schedine](/aiuto/13-admin-schedine.png)

---

## 6. Utenti

Menu → **Utenti**: cambia il **ruolo** (USER ↔ MOD ↔ ADMIN) e attiva/disattiva
gli account. Delega a un **Mod** le operazioni quotidiane (chiusura,
risoluzione, elaborazione) senza concedere poteri strutturali.

---

## 7. Import / Export

Le sezioni **Leghe**, **Squadre**, **Giocatori** e **Regole** hanno
**Import / Export**: scarichi i record in JSON, importi JSON o CSV per
popolare in massa, e per Squadre/Giocatori scarichi un template CSV.
`Export all` restituisce un unico JSON con tutte le anagrafiche (backup).

---

## Errori comuni

**"Il concorso non ha scommesse"** — aggiungi almeno una scommessa prima di
aprire.

**"Lega con partite o scommesse collegate"** — l'eliminazione di una lega è
bloccata se ci sono partite/scommesse che la referenziano: rimuovile prima.

**Errore in un esito dopo l'elaborazione** — usa *Annulla esito* sulla
scommessa, reimposta l'opzione corretta e clicca di nuovo **Elabora**.
