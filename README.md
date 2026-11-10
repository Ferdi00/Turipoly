# Turipoly

Un piccolo gioco da tavolo web a tema ufficio, pronto da pubblicare con GitHub Pages. È realizzato con HTML, CSS e JavaScript vanilla: non servono build o dipendenze.

## Avvio

Apri `index.html` nel browser oppure pubblica la cartella su GitHub Pages (Settings → Pages → Deploy from a branch → `main` → `/ (root)`).

## Regole della prima versione

- Da 2 a 4 colleghi, con nomi modificabili cliccando sul nome.
- Ogni giocatore parte con €1.300. Un giro completo paga €200.
- Tira due dadi e muovi la pedina; puoi comprare le postazioni libere.
- Se finisci su una postazione di un collega, paghi l’affitto.
- Gli imprevisti modificano il saldo o la posizione; la riunione urgente con Turi fa saltare un turno.
- La partita è locale al browser e si azzera ricaricando o scegliendo “Nuova partita”.

I testi e i prezzi delle caselle si modificano all’inizio di `game.js`, nell’array `spaces`.
