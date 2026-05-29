# Guida per l'utente

Tutto quello che ti serve per giocare su **Schedina**: registrazione,
compilazione di una schedina, stagionali e controllo dei risultati.

## In breve

1. Ti registri (o accedi) con la tua email
2. Apri **Concorsi** e scegli quello aperto
3. Compili i pronostici e clicchi **Invia schedina**
4. In parallelo puoi compilare la **schedina stagionale** (una sola per stagione)
5. Dopo i risultati controlli l'esito in **Schedine** o ti arriva una notifica

---

## 1. Accesso

Dalla schermata di **login** clicca *"Non hai un account? Registrati"*.
Compila il form e conferma. Verrai indirizzato alla lista dei concorsi.

![Schermata di login con il link di registrazione](/aiuto/01-login.png)

> Password dimenticata? Dalla schermata di login → *"Password dimenticata"*
> ricevi un token che incolli sulla pagina di reset per scegliere una nuova
> password.

## 2. Concorsi aperti

Dopo il login atterri su **Concorsi**: ci sono tutti quelli in stato `OPEN`.
Ogni card mostra nome, lega, **countdown alla chiusura** e numero di partite
richieste. Clicca una card per entrare nella compilazione.

![Lista dei concorsi aperti](/aiuto/02-user-concorsi.png)

## 3. Compilare la schedina

Per ogni partita scegli il pronostico cliccando uno dei bottoni a destra:

- **1**, **X**, **2** sulle partite *risultato finale*
- **U** / **O** sulle partite *Under / Over* (con la soglia goal indicata,
  es. `U/O 2.5`)

![Bottoni 1 / X / 2 per ogni partita](/aiuto/03-user-pronostico.png)

### Doppie e triple

Sulle partite **1X2** puoi cliccare un secondo o terzo bottone per la
doppia/tripla (aumenta le chance, costa moltiplicatore). Il numero massimo
ammesso è scritto nelle regole del concorso. Sulle **Under/Over** la
scelta è singola.

### Side bet della partita

Sotto i bottoni di esito alcune partite mostrano tendine extra:

- **Gol/No gol** — scegli `Goal` o `No goal`
- **Primo marcatore** — scegli un giocatore tra le due squadre o `Nessuno`

I side bet sono **opzionali**: puoi inviare la schedina senza compilarli.
Ogni side bet azzeccato vale come una partita in più nel tuo `correctCount`.

## 4. Confermare

Quando hai compilato tutte le partite richieste clicca **Invia schedina**.
Una volta inviata è bloccata e partecipa al concorso. Puoi crearne altre
fino al limite del regolamento (di solito 3 per utente).

![Pulsante Invia schedina in fondo alla pagina](/aiuto/04-user-conferma.png)

## 5. Schedine

In **Schedine** trovi tutte le tue giocate con lo stato:

| Stato | Significato |
|---|---|
| `DRAFT` | Bozza non confermata — puoi modificarla |
| `CONFIRMED` | Confermata, in attesa che il concorso si chiuda |
| `WINNING` | Vincente 🎉 |
| `NOT_WINNING` | Non vincente |

![Lista delle proprie schedine con il loro stato](/aiuto/05-user-mie-schedine.png)

Espandi una schedina per vedere, partita per partita, i tuoi pronostici,
il risultato ufficiale (es. `2–1 (1)`) e un'icona ✓ o ✗. Se la partita
aveva side bet, in fondo trovi una sezione **Side bet** con le tue scelte
e i relativi esiti.

## 6. Pronostici stagionali

Oltre ai concorsi settimanali esiste una **pool stagionale**: pronostichi
all'inizio della stagione i vincitori dei campionati, delle coppe e i premi
individuali (capocannoniere, miglior portiere, miglior assist).

La trovi nel menu sotto **Stagionali**.

### Come funziona

- **Una sola pool aperta** per stagione, **una sola schedina** per utente
- Devi rispondere a tutti i pronostici prima di confermare
- I pronostici sono raggruppati per torneo. Esempi:

| Torneo | Tipo | Cosa scegli |
|---|---|---|
| Serie A | Vincitore | Una squadra |
| Serie A | Capocannoniere | Un giocatore |
| Serie A | Miglior attacco/difesa | Una squadra |
| Coppa Italia | Vincitore | Una squadra |
| Champions League | Vincitore | Una squadra |

### Risultati graduali

I bet stagionali si risolvono **uno alla volta**, man mano che la stagione
li chiarisce. In **Le mie stagionali** vedi il punteggio parziale e lo stato
di ogni singolo bet: ✓ azzeccato, ✗ sbagliato, ⏳ in attesa.

La pool diventa `WINNING` o `NOT_WINNING` solo quando **tutti** i bet sono
risolti. Fino ad allora resta in `PROCESSED` con punteggio parziale.

## 7. Listini, notifiche, mobile

- **Listini** (menu): consulta squadre e giocatori (filtri per lega, squadra,
  ruolo). Utile per controllare il nome esatto prima di una scelta.
- **Notifiche** (campanella in alto): nuovo concorso, schedina vincente,
  risultati pubblicati. Cliccala per leggerle.
- **Mobile**: hamburger in alto a sinistra per il menu, tabelle scrollabili
  con uno swipe.

---

## Domande frequenti

**Posso modificare una schedina già confermata?**
No: bloccata. Puoi però crearne altre fino al limite del concorso.

**Cosa succede se il concorso si chiude e ho ancora una DRAFT?**
Le DRAFT non partecipano. Conferma sempre prima della scadenza.

**Quando vedo i risultati?**
Appena l'admin inserisce i punteggi e avvia il processing. Ti arriva
una notifica.

**Devo compilare i side bet?**
No, sono opzionali: aumentano il `correctCount` se azzeccati, ma puoi
ignorarli.

**Posso modificare la stagionale?**
Solo se è in `DRAFT`. Una volta confermata è bloccata fino alla chiusura
della pool, e non puoi crearne una nuova per la stessa pool.

**Cosa significa il simbolo ⏳?**
Pronostico ancora in attesa di risoluzione. Tipico per "primo marcatore"
e per i bet stagionali non ancora maturi.
