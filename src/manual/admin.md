# Guida per l'Amministratore

L'**Amministratore** ha pieno controllo: cura le anagrafiche, costruisce il
calendario delle giornate con le loro partite, gestisce le scommesse extra e
gli utenti, e segue l'intero ciclo di vita di una giocata.

## Il modello in tre concetti

- **Giornata**: una tappa del calendario. Contiene le **partite** su cui si
  gioca la schedina. Ha le sue **soglie di vittoria** e una finestra di gioco
  (apertura/chiusura).
- **Schedina**: la giocata di un utente su una giornata. Per ogni partita
  contiene due pronostici — **1X2** e **Under/Over** — entrambi a punteggio.
- **Scommessa extra**: una previsione singola e indipendente dalla schedina, di
  **fine stagione** (vincitore, capocannoniere…) o **di giornata** (gol/no gol,
  risultato esatto…). Gli utenti la giocano una scelta per volta.

```
Anagrafiche → Giornata (DRAFT) → +partite → [apri] → OPEN →
utenti compilano la schedina → [chiudi] → CLOSED →
inserisci i punteggi → [elabora] → PROCESSED ✓
(in parallelo) Scommesse extra → risolvi → giocate valutate
```

---

## 0. Anagrafiche (una tantum)

Dal menu laterale:

- **Leghe / Divisioni** — il contesto delle partite (es. *Serie A 2026/27*).
- **Squadre** — appartengono a una lega (Import/Export CSV per popolare in massa).
- **Giocatori** — per le scommesse su persone; Nome, Cognome, Squadra, Ruolo
  (GK/DEF/MID/FWD). Import/Export CSV (upsert su nome+cognome+squadra).
- **Stagioni** e **Tornei** — riferimenti per le scommesse di fine stagione.

> Non esiste più una *Regola* separata: le **soglie di vittoria** vivono
> direttamente sulla giornata.

---

## 1. Dashboard

La **Dashboard** mostra i contatori principali: utenti, schedine totali/vincenti,
giornate aperte/elaborate, scommesse aperte e giocate, notifiche.

![Dashboard amministratore](/aiuto/10-admin-dashboard.png)

---

## 2. Creare una giornata

Menu → **Calendario** → **Nuova giornata**. Campi: **Nome** (es. *Giornata 1*),
**Numero** (opzionale, altrimenti progressivo), **Stagione** (opzionale),
**Apertura** e **Chiusura**, **Soglie vincenti** (punti separati da virgola,
es. `12, 13`). Nasce in `DRAFT` (non visibile agli utenti).

> La vincita è a **soglia esatta**: con soglie `12, 13` vince chi totalizza
> esattamente 12 o 13 pronostici corretti. Ogni partita vale fino a 2 punti
> (1X2 + Under/Over), quindi con N partite il massimo è 2·N.

![Lista delle giornate](/aiuto/11-admin-concorsi.png)

---

## 3. Aggiungere le partite

Nel dettaglio della giornata, sezione **Partite**, clicca **Aggiungi partita**:

- **Casa** e **Ospite** — scegli le due squadre. Sono raggruppate per divisione
  (Serie A / B / C): le due squadre di una partita devono essere della **stessa
  divisione**, ma una giornata può contenere partite di **divisioni diverse**.
- **Data e ora** della partita.
- **Soglia Under/Over** (es. 2.5) usata per il pronostico U/O di quella partita.

Ogni partita aggiunge automaticamente i due pronostici della schedina (1X2 e
Under/Over): non serve crearli a mano.

![Dettaglio giornata: partite](/aiuto/12-admin-concorso.png)

---

## 4. Aprire, inserire i punteggi, elaborare

- **Apri**: stato → `OPEN`, gli utenti possono compilare la schedina (serve
  almeno una partita).
- **Chiudi**: stato → `CLOSED` allo scadere del termine.
- **Punteggi delle partite**: su ogni partita inserisci il punteggio
  (casa-ospite) e clicca **Salva**. Da lì si calcolano gli esiti 1X2 e
  Under/Over. Con **Valida** blocchi il punteggio.
- **Elabora**: calcola le schedine (1 punto per ogni pronostico corretto) e le
  marca Vincente/Non vincente in base alle soglie; la giornata passa a
  `PROCESSED`. È **incrementale** e **ri-eseguibile**: puoi elaborare anche con
  solo alcuni punteggi inseriti e rilanciare dopo.

(Le operazioni di chiusura/inserimento punteggi/elaborazione può farle anche un
**Mod**.)

---

## 5. Scommesse extra

Menu → **Scommesse**. In alto scegli il tipo — **Fine stagione** (legata a una
stagione) o **Di giornata** (legata a una giornata) — e il relativo contesto.
Con **Nuova scommessa** scegli il **mercato** e le opzioni candidate:

| Mercato | Opzioni |
|---|---|
| Gol/No gol | automatiche (Gol / No gol) |
| Risultato esatto | risultati che inserisci tu (es. `0-0, 1-0, 1-1`) |
| Vincitore, Più clean sheet, Più gol fatti, Meno gol subiti | Squadre |
| Capocannoniere, Miglior assist, Miglior portiere, Primo marcatore | Giocatori |

Per le scommesse **di giornata** puoi collegare una **partita**: con *Gol/No
gol* l'esito si risolve in automatico all'inserimento del punteggio.

Per risolverle: clicca l'opzione vincente sotto *"Imposta l'esito vincente"* →
la scommessa passa a **RESOLVED** e tutte le giocate degli utenti vengono
valutate. **Annulla esito** la riapre; **Annulla** (void) la neutralizza.

> Dal dettaglio di una giornata, **Scommesse di giornata** apre direttamente
> questa pagina già filtrata.

---

## 6. Schedine

Menu → **Schedine**: scegli una giornata per vedere tutte le schedine degli
utenti con stato e punteggio; **Vedi** apre il dettaglio con i pronostici 1X2 /
Under/Over partita per partita e i relativi esiti (✓/✗).

![Viewer delle schedine](/aiuto/13-admin-schedine.png)

---

## 7. Utenti

Menu → **Utenti**: cambia il **ruolo** (USER ↔ MOD ↔ ADMIN) e attiva/disattiva
gli account. Delega a un **Mod** le operazioni quotidiane (chiusura,
inserimento punteggi, elaborazione, risoluzione scommesse) senza concedere
poteri strutturali.

---

## 8. Import / Export

Le sezioni **Leghe**, **Squadre** e **Giocatori** hanno **Import / Export**:
scarichi i record in JSON, importi JSON o CSV per popolare in massa, e per
Squadre/Giocatori scarichi un template CSV. `Export all` restituisce un unico
JSON con tutte le anagrafiche (backup).

---

## Errori comuni

**"La giornata non ha partite"** — aggiungi almeno una partita prima di aprire.

**"Giornata con schedine, impossibile eliminare"** — non puoi eliminare una
giornata su cui gli utenti hanno già giocato.

**"Le due squadre devono appartenere alla stessa divisione"** — scegli casa e
ospite dalla stessa lega (la giornata però può mischiare divisioni).

**Errore in un punteggio dopo l'elaborazione** — reinserisci il punteggio
corretto sulla partita e clicca di nuovo **Elabora**.
