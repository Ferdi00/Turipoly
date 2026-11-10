# Turipoly

Il gioco da tavolo dell’ufficio, per **2–4 colleghi sullo stesso dispositivo**. HTML, CSS e JavaScript: nessuna dipendenza runtime, nessuna build, nessun account.

## Giocare in locale

Puoi aprire direttamente `index.html`. Per un indirizzo stabile e un salvataggio più prevedibile, con Node.js 18 o superiore esegui:

```powershell
node scripts/serve.cjs
```

Apri **http://127.0.0.1:4173**. In alternativa, con npm disponibile: `npm start`.

Per pubblicare su GitHub Pages: Settings → Pages → Deploy from a branch → scegli il branch e `/ (root)`. Pubblica tutti i file dell’app, inclusi `game-data.js`, `event-cards.js`, `game-engine.js` e `turi-logo.webp`. Non serve eseguire una build.

## Regole

- Configura 2–4 giocatori prima di iniziare. Ciascuno parte con **€1.500**. I nomi si possono modificare anche durante la partita.
- Scegli **12 round**, **20 round** oppure **Straordinari**, fino a un solo giocatore superstite. Un round contiene un turno per ogni giocatore ancora in partita.
- Tira due dadi e avanza in senso orario. Passando dall’ingresso ricevi **€200**, anche arrivandoci esattamente. I doppi non danno un tiro aggiuntivo.
- Puoi comprare la postazione libera su cui arrivi o lasciarla disponibile. Il costo, l’affitto e la liquidità residua sono visibili prima di confermare.
- Se arrivi sulla postazione di un collega paghi l’affitto. Un **gruppo completo dello stesso colore** raddoppia gli affitti delle sue postazioni.
- Possedere un gruppo completo sblocca **un upgrade per postazione**: costa metà del prezzo d’acquisto e porta l’affitto a **3× quello base**. Un upgrade già acquistato resta attivo anche vendendo un’altra postazione del gruppo.
- Prima del tiro o a fine turno puoi aprire **Le tue postazioni** per potenziare o vendere. La banca restituisce il **50% dell’investimento**, incluso l’eventuale upgrade. La vendita richiede conferma.
- Le carte si applicano premendo **Continua**. Gli imprevisti casuali usano un mazzo mescolato senza reinserimento: si rimescola dopo aver pescato tutte le carte.
- La riunione con Turi blocca il tiro del prossimo turno. Puoi **restare e saltare il tiro**, oppure **delegare per €50** e tirare normalmente.
- Se non riesci a pagare, la banca liquida automaticamente i beni a partire dal **rimborso più basso**. Se non bastano, paghi solo il denaro disponibile ed esci per **bancarotta**. Nessun saldo negativo e nessun denaro creato per il creditore.
- Premi **Termina il turno** quando hai concluso. Il gioco non passa al collega mentre stai ancora leggendo.
- Dopo 12 o 20 round vince il **patrimonio**: liquidità + valore d’acquisto di postazioni e upgrade. Ogni collega superstite completa il round finale. A parità di patrimonio la vittoria è condivisa. Un solo superstite vince immediatamente, in qualsiasi modalità.

## Usabilità e salvataggio

Il gioco salva dopo ogni azione su questo browser e riprende automaticamente ricaricando la pagina, anche durante un acquisto o una carta. Il tiro è salvato prima dell’animazione: ricaricare non permette di ritirare i dadi. Una carta ancora da confermare non ha ancora applicato i suoi effetti.

Usa lo **stesso dispositivo, browser e indirizzo** per ritrovare il salvataggio. `localhost`, `127.0.0.1`, GitHub Pages e il file locale possono avere salvataggi separati. La modalità privata o il blocco dei dati locali possono impedirlo: in quel caso il gioco mostra un avviso e resta utilizzabile fino alla chiusura della pagina. Esiste un solo salvataggio per indirizzo; usa una sola scheda di gioco alla volta.

**Nuova partita** apre la configurazione senza cancellare quella attuale: viene sostituita solo premendo **Tutti in ufficio**. Chiudi la configurazione per continuare la partita precedente.

Seleziona una casella per leggere nome completo, proprietario, prezzo e affitti. Su telefono i comandi vengono prima del tabellone. Il tabellone compatto è una panoramica; **Ingrandisci tabellone** permette di leggere le caselle scorrendo al suo interno. I dettagli restano sempre disponibili.

Si può giocare da tastiera: Tab per i comandi; frecce per le caselle in ordine di percorso; Home/End per la prima/ultima casella; Invio o Spazio per i pulsanti. Escape chiude i pannelli, rinuncia all’acquisto e lascia aperte le carte da confermare. Le animazioni rispettano la preferenza di movimento ridotto.

## Sviluppo e test

```powershell
node --test tests/*.test.cjs
```

Oppure `npm run check`, che verifica anche la sintassi dei quattro script. I test coprono le regole economiche, i passaggi di turno, gli eventi, il ripristino dei salvataggi e 60 partite complete con semi riproducibili.

| File | Responsabilità |
| --- | --- |
| `game-data.js` | Caselle, prezzi, affitti, colori e gruppi |
| `event-cards.js` | Testi e conseguenze delle carte |
| `game-engine.js` | Regole e stato, utilizzabile anche nei test Node |
| `game.js` | Interfaccia, input, dialoghi e salvataggio |
| `style.css` | Stile e adattamento a schermi diversi |
| `scripts/serve.cjs` | Server statico locale senza dipendenze |
| `tests/game-engine.test.cjs` | Regressioni delle meccaniche e simulazioni |

Il logo originale PNG rimane come sorgente; la pagina carica la versione WebP ridimensionata. I font Google sono facoltativi: se non disponibili, si usano quelli di sistema. Il gioco è esclusivamente locale: non include multiplayer online, aste, scambi tra giocatori o account.

Vedi [l’analisi delle modifiche](docs/MIGLIORAMENTI.md) per problemi iniziali, interventi e limiti delle verifiche.
