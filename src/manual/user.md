# Guida per l'utente

Benvenuto su **Schedina**! Questa guida ti accompagna passo passo nell'uso
dell'app: dalla registrazione alla compilazione di una schedina, fino al
controllo dei risultati. Trovi anche le sezioni dedicate ai nuovi pronostici
**stagionali** e ai **side bet** per singola partita (gol/no gol, primo
marcatore).

## In breve

1. Ti registri (o accedi) con la tua email
2. Apri la lista dei **Concorsi** aperti
3. Selezioni un concorso e **compili una schedina** con i tuoi pronostici
4. **Confermi** la schedina entro la data di chiusura
5. Quando l'amministratore inserisce i risultati, vedi se hai vinto in **Schedine**
6. In parallelo, puoi compilare la **schedina stagionale** una sola volta per stagione

---

## 1. Registrazione e accesso

Dalla schermata di **login** clicca su *"Non hai un account? Registrati"*.

![Schermata di login con il link di registrazione](/aiuto/01-login.png)

Compila il form con i tuoi dati e conferma. Verrai indirizzato direttamente
alla lista dei concorsi disponibili.

> Se dimentichi la password puoi richiederne il reset dalla schermata
> di login → *"Password dimenticata"*.

## 2. Concorsi aperti

Dopo il login atterri sulla pagina **Concorsi**: trovi qui tutti i concorsi
in stato `OPEN` (cioè aperti alle giocate). Ogni card mostra:

- Nome del concorso
- Lega di riferimento
- **Countdown alla chiusura** (entro questo termine devi confermare la schedina)
- Numero di partite richieste

![Lista dei concorsi aperti](/aiuto/02-user-concorsi.png)

Clicca su un concorso per entrare nella schermata di compilazione.

## 3. Compilare la schedina

Per ogni partita scegli il pronostico cliccando uno dei bottoni a destra:

- **1**, **X**, **2** per le partite di tipo *risultato finale*
- **U** / **O** per le partite di tipo *Under / Over* (con la soglia
  goal indicata, es. `U/O 2.5`)

![Bottoni 1 / X / 2 per ogni partita](/aiuto/03-user-pronostico.png)

### 3.1 Doppie e triple

Sulle partite **1X2** puoi scegliere più di un esito (doppia o tripla):
basta cliccare un secondo o terzo bottone. Una **doppia** aumenta la
probabilità di indovinare ma riduce il moltiplicatore. Le regole del
concorso indicano quante doppie/triple sono ammesse.

> Sulle partite **Under/Over** la scelta è singola: o U o O.

### 3.2 Side bet della partita

Alcune partite possono avere **pronostici extra** oltre al risultato
1/X/2 o Under/Over. Compaiono sotto i bottoni di esito principale,
come tendine a discesa:

- **Gol/No gol** — entrambe le squadre andranno in gol? Scegli `Goal`
  oppure `No goal`
- **Primo marcatore** — chi segnerà per primo? Scegli un giocatore
  dalla lista delle due squadre, oppure `Nessuno` se prevedi uno 0-0

I side bet sono **opzionali**: puoi confermare la schedina anche senza
selezionarli. Ogni side bet azzeccato vale come una partita azzeccata in
più (concorre al `correctCount` totale).

> I side bet "Gol/No gol" vengono risolti automaticamente non appena
> l'amministratore inserisce il punteggio della partita. I "Primo marcatore"
> richiedono invece una risoluzione manuale, quindi possono restare in
> attesa anche dopo l'inserimento del risultato.

## 4. Confermare la schedina

Quando hai compilato tutte le partite richieste clicca **Invia schedina**.

![Pulsante Invia schedina in fondo alla pagina](/aiuto/04-user-conferma.png)

Una volta inviata, la schedina è **bloccata** e partecipa al concorso.
Puoi crearne altre fino al limite previsto dal regolamento (di solito 3 per utente).

## 5. Schedine

Nel menu *"Schedine"* trovi tutte le tue giocate, con il loro stato:

| Stato | Significato |
|---|---|
| `DRAFT` | Bozza non ancora confermata — puoi modificarla |
| `CONFIRMED` | Confermata, in attesa che il concorso si chiuda |
| `WINNING` | Vincente! 🎉 |
| `NOT_WINNING` | Non vincente |

![Lista delle proprie schedine con il loro stato](/aiuto/05-user-mie-schedine.png)

Espandi una schedina per vedere il dettaglio: per ogni partita compaiono
i tuoi pronostici, il risultato ufficiale (es. `2–1 (1)`) e un'icona
✓ o ✗ a indicare se hai indovinato. Se la partita aveva dei side bet,
vedrai in fondo una sezione **Side bet** con le tue scelte (es. `Gol/No gol:
Goal → Goal ✓`) e i relativi esiti.

## 6. Pronostici stagionali

Oltre ai concorsi settimanali esiste una **pool stagionale**: pronostichi
all'inizio della stagione i vincitori dei campionati (Serie A, B, C),
delle coppe (Coppa Italia, Champions League) e dei premi individuali
(capocannoniere, miglior portiere, miglior assist, ecc.).

Trovi la pagina nel menu sotto *"Stagionali"*.

### 6.1 Come funziona

- Esiste **una sola pool aperta** per stagione
- Compili **una sola schedina** (non multiple come per i concorsi settimanali)
- Per ogni pronostico scegli una squadra o un giocatore dal dropdown
- Devi rispondere a tutti i pronostici prima di confermare

I pronostici sono raggruppati per torneo. Esempi:

| Torneo | Tipo pronostico | Cosa scegli |
|---|---|---|
| Serie A | Vincitore | Una squadra |
| Serie A | Capocannoniere | Un giocatore |
| Serie A | Miglior portiere | Un giocatore |
| Serie A | Miglior attacco | Squadra con più gol fatti |
| Serie A | Miglior difesa | Squadra con meno gol subiti |
| Coppa Italia | Vincitore | Una squadra |
| Champions League | Vincitore | Una squadra |

### 6.2 Quando vedo i risultati

I pronostici stagionali si risolvono **uno alla volta**, man mano che
nella stagione si conosce l'esito (es. il capocannoniere è chiaro a fine
campionato, il vincitore della Coppa Italia a maggio). Ogni volta che
l'amministratore registra un esito, la tua schedina viene ricalcolata.

Nel menu *"Le mie stagionali"* puoi controllare:

- Il **punteggio parziale** (quanti pronostici hai già azzeccato)
- Lo stato di ogni singolo pronostico:
  - ✓ azzeccato
  - ✗ sbagliato
  - ⏳ in attesa (ancora non risolto)

La pool diventa `WINNING` o `NOT_WINNING` solo quando **tutti** i pronostici
sono stati risolti. Fino ad allora resta in stato `PROCESSED`.

## 7. Listini

Nel menu *"Listini"* trovi un'anagrafica **read-only** consultabile in
qualsiasi momento:

- **Squadre**: elenco filtrato per lega
- **Giocatori**: elenco filtrato per lega, squadra e ruolo
  (Portiere / Difensore / Centrocampista / Attaccante)

Utile per controllare l'esatto nome di un giocatore prima di sceglierlo
nella schedina (es. quando cerchi un primo marcatore o un capocannoniere).

## 8. Notifiche

L'icona della **campanella** nell'header ti avvisa quando:

- Un nuovo concorso è stato aperto
- Una tua schedina è risultata vincente
- L'amministratore ha pubblicato i risultati di un concorso a cui hai partecipato

Cliccala per aprire la pagina **Notifiche** e segnarle come lette.

## 9. Uso da mobile

L'app è pensata anche per il cellulare:

- Apri il menu laterale con l'icona **hamburger** in alto a sinistra
- Le tabelle (es. listini) scorrono orizzontalmente con uno swipe
- Tutti i bottoni sono dimensionati per il touch

---

## Domande frequenti

**Posso modificare una schedina già confermata?**
No. Una volta confermata, la schedina è bloccata. Puoi però crearne altre
(fino al limite del concorso).

**Cosa succede se il concorso si chiude e non ho confermato?**
Le schedine in `DRAFT` non partecipano al concorso. Conferma sempre prima
della scadenza.

**Quando vedrò i risultati?**
Appena l'amministratore inserisce i punteggi reali delle partite e avvia
il processing. Riceverai una notifica.

**Devo per forza compilare i side bet?**
No. Sono pronostici extra opzionali: aumentano il tuo `correctCount`
se azzeccati ma puoi ignorarli senza penalità.

**Posso modificare la schedina stagionale?**
Solo finché è in `DRAFT`. Una volta confermata, è bloccata fino alla
chiusura della pool. Se hai già una schedina (in qualsiasi stato diverso
da `CANCELLED`) non puoi crearne una nuova per la stessa pool.

**Cosa significa il simbolo ⏳ in una mia schedina?**
Quel pronostico è ancora in attesa di risoluzione. Tipico per i side bet
"primo marcatore" o per i pronostici stagionali risolti gradualmente.
