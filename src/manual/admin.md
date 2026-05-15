# Guida per l'Amministratore

L'**Amministratore** (`ADMIN`) ha pieno controllo sull'applicazione: crea i
dati propedeutici (leghe, squadre, regole), apre i concorsi, gestisce
gli utenti e supervisiona l'intero ciclo di vita di una giocata.

## Il ciclo di vita di un concorso

```
Lega → Squadre → Regola → Concorso (DRAFT) → aggiungi partite →
[apri] → OPEN → utenti giocano → [chiudi] → CLOSED →
inserisci risultati → [elabora] → PROCESSED ✓
```

Le tre frecce **`[apri]` `[chiudi]` `[elabora]`** sono le azioni a tuo
carico (un Mod può fare le ultime due, ma non `[apri]`).

---

## 0. Step propedeutici (da fare una volta sola)

Prima di poter creare un concorso devi avere a sistema:

1. Almeno una **Lega**
2. Le **Squadre** che giocheranno
3. Una **Regola** che definisce i parametri del concorso

Ne parliamo nell'ordine.

### 0.1 Creare una Lega

Menu laterale → **Leghe** → pulsante **Nuova Lega**.

![Creazione di una nuova lega](/aiuto/20-admin-lega.png)

I campi richiesti:

- **Nome**: es. *Serie A 2026/27*
- **Paese** (opzionale): es. *Italia*

> Puoi anche **importare** una lista di leghe da un file JSON tramite
> il pulsante *Import / Export* in alto a destra.

### 0.2 Aggiungere le Squadre

Menu laterale → **Squadre** → **Nuova Squadra**, oppure usa *Import* con
il template CSV scaricabile.

![Form di creazione squadra](/aiuto/21-admin-squadra.png)

I campi richiesti:

- **Lega**: scegli quella creata prima
- **Nome**: es. *Internazionale*
- **Sigla** (opzionale): es. *INT*

Per popolazioni grandi (10+ squadre) usa il **template CSV**: scarica,
compila in Excel/Google Sheets, importa.

### 0.3 Definire una Regola

Menu laterale → **Regole** → **Nuova Regola**. La regola è il "contratto"
del concorso: dice quante partite servono per essere validi, quante
schedine al massimo può fare ogni utente, ecc.

![Form di creazione regola](/aiuto/22-admin-regola.png)

I campi principali:

| Campo | Descrizione | Valore tipico |
|---|---|---|
| **Lega** | Lega di riferimento | *Serie A 2026/27* |
| **Partite richieste** | Numero di pronostici obbligatori | 13 |
| **Soglie di vittoria** | Array es. `[13, 12]` = vince chi ne indovina 13 e/o 12 | `[13]` |
| **Max doppie** | Pronostici doppi consentiti | 3 |
| **Max triple** | Pronostici tripli consentiti | 1 |
| **Max schedine/utente** | Limite di giocate per utente nel concorso | 3 |

> Tu sei l'unico che può creare/modificare regole.

---

## 1. Creare un Concorso

Menu laterale → **Concorsi** → **Nuovo Concorso**.

![Form di creazione concorso](/aiuto/23-admin-concorso.png)

Campi:

- **Nome**: es. *Schedina #5*
- **Lega**: la lega di riferimento
- **Regola**: una delle regole compatibili (stessa lega)
- **Data apertura** e **chiusura**: gli istanti in cui il concorso passerà
  automaticamente in `OPEN` e poi (potenzialmente) `CLOSED`

Il concorso nasce in stato `DRAFT`: non ancora visibile agli utenti.

## 2. Aggiungere le partite

Apri il **Dettaglio** del concorso `DRAFT`. Trovi una tabella vuota delle
partite e il pulsante **Aggiungi partita**.

![Tabella partite e form di aggiunta](/aiuto/24-admin-partite.png)

Per ogni partita imposta:

- **Casa** e **Ospite** (dropdown delle squadre della lega)
- **Numero partita** (opzionale, per ordinare la schedina)
- **Data/ora prevista**
- **Tipo di scommessa**:
  - `1X2` (default) → l'utente sceglie 1, X o 2
  - `Under/Over` → l'utente sceglie U o O rispetto a una soglia di goal totali
- **Soglia U/O** (solo se Under/Over): es. `2.5`

Il numero di partite deve essere **almeno pari al `requiredMatches`** della
regola.

> Le partite Under/Over vincono se il *totale goal* nella partita reale è
> minore (U) o maggiore (O) della soglia. Le partite 1X2 vincono se l'esito
> coincide con il segno calcolato dai punteggi.

## 3. Aprire il concorso

Quando le partite sono pronte, dalla pagina **Concorsi** clicca **Apri**.

![Pulsante Apri su un concorso in stato DRAFT](/aiuto/25-admin-apri.png)

Lo stato passa a `OPEN`. Da questo momento:

- Il concorso compare nella lista degli utenti
- Gli utenti possono compilare e confermare schedine
- Non puoi più aggiungere/rimuovere partite

> Una volta aperto, **non puoi più tornare indietro**. Se hai sbagliato
> qualcosa devi cancellare il concorso e ricrearlo (cosa possibile solo
> se nessuno ha ancora confermato schedine).

## 4. Durante il concorso (OPEN)

Mentre il concorso è `OPEN` puoi monitorare l'andamento:

- **Dashboard**: numero di utenti attivi, schedine in corso, concorsi in stato
  `OPEN`
- **Notifiche**: vedi quali notifiche sono state inviate agli utenti

![Dashboard amministratore con i contatori](/aiuto/26-admin-dashboard.png)

## 5. Chiudere il concorso

Allo scadere del termine clicca **Chiudi**. Lo stato passa a `CLOSED`:
nessuno può più confermare nuove schedine.

> Tipicamente questa azione la fa anche un **Mod**.

## 6. Inserire risultati ed elaborare

Identico al flow del Mod (vedi *Guida Moderatore* → step 3 e 4):

- Apri il dettaglio del concorso `CLOSED`
- Inserisci i due punteggi (casa / ospite) per ogni partita
- Clicca **Elabora**: il sistema confronta i pronostici e marca le schedine
  come `WINNING` o `NOT_WINNING`

Il concorso passa a `PROCESSED` e gli utenti ricevono notifica.

## 7. Gestione utenti

Menu laterale → **Utenti**.

![Lista utenti con dropdown per cambio ruolo](/aiuto/27-admin-utenti.png)

Per ogni utente puoi:

- **Cambiare il ruolo** (USER ↔ MOD ↔ ADMIN) tramite il dropdown
- **Disattivare** un account (l'utente non può più loggarsi)

> Usa il ruolo MOD per delegare le operazioni di chiusura/processing
> a chi gestisce il giorno-per-giorno del concorso senza dargli i poteri di
> modifica strutturale.

## 8. Import / Export dei dati

Ogni sezione (Leghe, Squadre, Regole, Concorsi) ha un pulsante
**Import / Export** che permette di:

- Scaricare tutti i record correnti in formato **JSON**
- Importare un file **JSON o CSV** per popolare in massa
- Scaricare un **template CSV** (solo per Squadre) come base

Usalo per:

- Backup periodici prima di operazioni grosse
- Migrare i dati di una stagione precedente
- Popolazione iniziale di un campionato nuovo

---

## Errori comuni e soluzioni

**"Squadre insufficienti per il concorso"**
La regola richiede N partite ma la lega ha meno di N×2 squadre attive.
Aggiungi squadre o riduci `requiredMatches`.

**"Non posso aprire il concorso"**
Verifica che il concorso abbia abbastanza partite (≥ `requiredMatches`).

**"Eliminazione bloccata"**
La risorsa è referenziata da altre (es. una lega da squadre, una squadra
da partite). Elimina prima i record dipendenti.

**Modifica risultato dopo il processing**
Si può fare: correggi il punteggio e re-clicca **Elabora**. Il sistema
resetta le schedine e ricalcola tutto.
