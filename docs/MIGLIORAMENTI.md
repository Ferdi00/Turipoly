# Turipoly — Analisi e interventi

## Problemi nella versione iniziale

1. **La partita non finiva:** nessuna vittoria o eliminazione; gli affitti potevano generare saldi negativi senza conseguenze.
2. **Poche decisioni strategiche:** comprare o passare, senza gruppi, upgrade, disinvestimento o scelta sulle riunioni.
3. **Turni poco controllabili:** avanzamento automatico dopo un timer, pulsanti non sempre visivamente bloccati, possibilità di aggiungere giocatori dopo l’inizio. I timer non erano annullati dal reset.
4. **Progressi persi al reload:** nessun salvataggio. Il reset non ripuliva correttamente tutti i messaggi e i dialoghi.
5. **Regole distribuite e duplicate:** `event-cards.js` sostituiva globalmente `doEvent` di `game.js`, mantenendo due implementazioni degli stessi eventi.
6. **Rendering costoso:** tutte le 40 caselle e le pedine venivano eliminate e ricreate a ogni aggiornamento, con nuove animazioni e perdita del focus.
7. **Usabilità del tabellone:** caselle non interattive, nome completo solo al passaggio del mouse, controlli dentro il tabellone e numerose regole CSS sovrapposte. Su telefono serviva un’alternativa alla lettura di 40 caselle molto piccole.
8. **Asset sovradimensionato e documentazione incoerente:** logo PNG da 856.705 byte usato per immagini piccole; README con €1.300 iniziali anziché i €1.500 del codice.

## Interventi implementati

- Motore indipendente dall’interfaccia, con fasi esplicite: tiro disponibile, acquisto, carta, fine turno e fine partita.
- Configurazione iniziale di 2–4 nomi diversi, durata 12/20 round o fino all’ultimo superstite, classifica finale e gestione dei pareggi.
- Otto gruppi di proprietà, affitto doppio per gruppo completo, un upgrade per postazione, vendita al 50% e liquidazione automatica dei debiti.
- Riunione con scelta: perdere il tiro o pagare €50. Mazzo casuale mescolato senza reinserimento.
- Fine turno esplicita, blocco dei tiri ripetuti e protezione dalle azioni inviate nella fase sbagliata.
- Salvataggio dopo ogni decisione; ripristino validato; tiro registrato prima dell’animazione e carta applicata soltanto alla conferma. Nessun effetto duplicato ricaricando.
- Caselle costruite una sola volta. Le stesse pedine vengono spostate tra caselle; si aggiornano proprietari, testo accessibile e indicazione del giocatore attivo.
- Comandi esterni al tabellone, dettagli accessibili da tocco e tastiera, gestione proprietà, regole consultabili, indicatori di liquidità e patrimonio, ingrandimento del tabellone.
- Layout mobile con comandi prima della mappa; navigazione del percorso con le frecce; focus nei dialoghi, pulsanti nativi, annunci dei risultati e movimento ridotto.
- Un solo foglio di stile consolidato, logo WebP da 19.982 byte, server locale e test senza dipendenze da installare.

## Misure

| Risorsa | Prima | Dopo |
| --- | ---: | ---: |
| Logo effettivamente caricato | 856.705 byte | 19.982 byte |
| Risorse locali iniziali, esclusi font | 918.604 byte | 117.966 byte |
| Caselle ricreate per aggiornamento | 40 | 0 |
| Implementazioni della logica eventi | 2, una sovrascriveva l’altra | 1 |

I byte iniziali sono la somma dei file caricati dalla pagina, senza compressione HTTP, cache o font esterni, usando per il confronto iniziale i sorgenti del commit di partenza; **non sono un benchmark Lighthouse o una misura del tempo di caricamento**. La logica aggiuntiva aumenta il JavaScript, ma il ridimensionamento del logo riduce il totale di circa l’87%. Il PNG sorgente resta nel repository e non viene richiesto dalla pagina.

## Verifiche

- 28 test automatici passati, inclusa una simulazione di 60 partite complete e riproducibili da 2, 3 e 4 giocatori e il contrasto dei colori delle pedine.
- Verificati stipendio sull’ingresso, acquisto e rinuncia, conservazione dei pagamenti, gruppi, upgrade, vendite, liquidazione, bancarotta, riunioni, mazzo, fine round, classifica, pareggi e rifiuto di salvataggi corrotti.
- Durante le simulazioni: nessun saldo negativo, proprietari validi, salvataggio ripristinabile dopo ogni azione e raggiungimento della fine partita.
- Verifica sintattica degli script e controllo whitespace del diff.
- Prova nel browser Chrome desktop: avvio, acquisto, recupero dello stesso acquisto dopo reload, gestione proprietà, passaggio di turno e interfaccia mobile emulata a 320 e 440 pixel.

## Limiti e possibili sviluppi

Il bilanciamento riprende i prezzi originali, aggiungendo scelte e una conclusione definita. Le simulazioni verificano la correttezza; **non dimostrano che i valori economici siano ottimali o che le durate equivalgano a un certo numero di minuti**. Servono partite reali con i colleghi per regolare affitti, bonus e durata preferita.

Il salvataggio è locale e singolo per indirizzo; non è una sincronizzazione tra dispositivi o schede. Non sono stati aggiunti un backend, account, multiplayer online, aste o scambi. La vista mobile è stata controllata in emulazione, non su dispositivi fisici o su ogni browser. Il tabellone compatto conserva una densità da gioco da tavolo: per i testi si usano dettagli e ingrandimento.

## Aggiornamento grafico e animazioni — 10 novembre 2026

Il tabellone riprende una scrivania verde: foglio con il marchio, appunti, mazzo degli imprevisti, cartellino di turno e timbri. Le pedine sono badge numerati e le caselle usano un set di icone SVG. Carte, pannelli e configurazione della squadra seguono lo stesso tema, con controlli e contrasti distinti dalle decorazioni.

### Sequenza del turno

1. Il motore calcola il tiro e salva subito il risultato definitivo.
2. I dadi mostrano la faccia estratta con un breve lancio di circa mezzo secondo.
3. Un badge temporaneo percorre tutte le caselle intermedie, incluse curve e passaggio dall'ingresso. La durata è limitata a un secondo.
4. La pedina reale raggiunge la destinazione e si apre l'eventuale carta o scelta di acquisto. I comandi tornano disponibili.

La presentazione non modifica denaro, posizioni o carte: un reload riprende l'esito già salvato. Durante il movimento sono bloccate le azioni che potrebbero interferire con il turno. Anche lo spostamento aggiuntivo della carta Smart working segue il percorso sul tabellone.

Acquisti, vendite, upgrade, riunioni e passaggi di turno ricevono timbri e aggiornamenti del cartellino. Incassi e spese mostrano una ricevuta temporanea vicino al saldo. La classifica finale aggiunge coriandoli di carta che vengono rimossi a fine effetto. Non sono presenti loop decorativi o suoni automatici.

### Controlli e prestazioni

- Il comando sotto il tabellone conserva la preferenza per animazioni attive o ridotte. La preferenza di movimento ridotto del dispositivo ha la precedenza.
- Disattivare le animazioni durante un tiro o nascondere la scheda annulla gli effetti e libera il turno. Badge temporaneo, percorso evidenziato e riferimenti alle animazioni vengono eliminati.
- Con movimento ridotto restano visibili risultati, saldi, messaggi e timbri. Le ricevute statiche scompaiono dopo circa 1,5 secondi.
- Le animazioni usano CSS e Web Animations API, senza aggiungere dipendenze runtime. Il percorso usa trasformazioni e le caselle continuano a essere riutilizzate.
- Su telefono i comandi precedono il tabellone; appunti e timbri decorativi vengono nascosti per lasciare spazio al gioco. L'ingrandimento resta confinato nel tabellone.

### Verifiche di questa fase

- **36 test automatici superati**: i 28 precedenti, comprese le 60 partite simulate, più 8 test su percorsi, durate, API mancanti, movimento ridotto e pulizia dopo l'annullamento.
- Sintassi dei cinque script e controllo whitespace del diff superati.
- Prove automatiche in Chrome headless aprendo direttamente `index.html`: dadi, percorso animato, blocco dei tiri duplicati, interruzione durante il movimento, acquisto e preferenza recuperati dopo reload, carte applicate una sola volta, Smart working, annullamento su cambio di visibilità, tastiera, zoom e classifica finale.
- Verificato il contenimento orizzontale della pagina a **320, 390, 768, 1024, 1440, 1920 e 3840 px**, anche con quattro giocatori e nomi lunghi.
- Ispezionate le immagini desktop e mobile emulato, comprese le carte. Corrette la leggibilità del mazzo e la centratura delle icone nelle carte da telefono.
- Il controllo statico grafico segnala ancora caratteri piccoli nel tabellone e nei metadati e caratteristiche del tema cartaceo, come palette crema, carte e bordi dei pannelli. Il tabellone compatto resta una panoramica da esplorare con dettagli e ingrandimento.

L'anteprima HTTP integrata non era raggiungibile nell'ambiente di verifica; i controlli nel browser sono stati completati sul file locale. Le verifiche responsive usano viewport emulati: non sono misure di fluidità su dispositivi fisici. Le dimensioni delle risorse riportate nella prima parte di questo documento si riferiscono alla fase precedente a questo aggiornamento grafico.
