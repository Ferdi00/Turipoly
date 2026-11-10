const eventDeck = {
  coffee: { title: 'La pausa caffè', icon: '☕', tone: 'bad', text: 'La macchinetta si è mangiata la moneta. Il caffè, almeno, era buono?', delta: -2, reason: 'La macchinetta si è mangiata la moneta.', log: 'perde €2 alla macchinetta.' },
  printer: { title: 'La stampante è in sciopero', icon: '🖨️', tone: 'bad', text: 'Il report è sparito dentro la stampante. Toner e pazienza sono a carico tuo.', delta: -50, reason: 'La stampante ha inghiottito il report.', log: 'paga €50 per la stampante.' },
  meeting: { title: 'Poteva essere un’email', icon: '📅', tone: 'bad', text: 'La riunione dura un’ora. Hai perso tempo e ordinato un altro caffè.', delta: -20, reason: 'Riunione di un’ora e un altro caffè.', log: 'resta bloccato in riunione.' },
  parking: { title: 'Posto riservato al direttore', icon: '🚗', tone: 'bad', text: 'Hai parcheggiato nel posto di Turi. Nessuna multa ufficiale: solo una sonora multa morale.', delta: -25, reason: 'Multa morale per il posto auto del direttore.', log: 'paga una multa morale di €25 per il parcheggio.' },
  remote: { title: 'Smart working dal divano', icon: '🛋️', tone: 'good', text: 'La call è finita in anticipo e hai persino trovato le ciabatte. Avanza di tre caselle.', move: 3, log: 'avanza di 3 caselle in smart working.' },
  boss: { title: '“Hai un minuto?”', icon: '💬', tone: 'bad', text: 'Il messaggio di Turi si trasforma in una revisione urgente. Il minuto era un’unità di misura ottimistica.', delta: -30, reason: '“Hai un minuto?” diventa una revisione urgente.', log: 'spende €30 dopo il messaggio di Turi.' },
  friday: { title: 'Venerdì, ore 16:59', icon: '🕔', tone: 'good', text: 'Chiudi il laptop alle 17:00 precise e riesci a evitare la riunione dell’ultimo minuto.', delta: 80, reason: 'Hai chiuso il laptop alle 17:00 precise.', log: 'scappa prima della riunione del venerdì.' },
  lunch: { title: 'Pranzo di team', icon: '🍝', tone: 'bad', text: 'Bella compagnia, ottimo pranzo. Questa volta però hai offerto tu.', delta: -25, reason: 'Questa volta il pranzo di team l’hai offerto tu.', log: 'offre il pranzo al team.' },
  bonus: { title: 'Obiettivo centrato!', icon: '🎯', tone: 'good', text: 'Turi ha detto “bravi tutti” e il bonus è arrivato davvero. Segnati la data.', delta: 150, reason: 'Obiettivo centrato: bonus meritato.', log: 'riceve un bonus di €150.' },
  coin: { title: 'Moneta inghiottita', icon: '🪙', tone: 'bad', text: 'La macchinetta del caffè ha riconosciuto la tua faccia. E si è tenuta la moneta.', delta: -2, reason: 'Moneta inghiottita dalla macchinetta.', log: 'perde €2 alla macchinetta.' },
  expenses: { title: 'Report spese', icon: '🧾', tone: 'bad', text: 'Il taxi della trasferta non rientra nei rimborsi. La prossima volta: monopattino aziendale.', delta: -40, reason: 'Il taxi della trasferta non era rimborsabile.', log: 'paga €40 di spese non rimborsate.' },
  printerWin: { title: 'Un piccolo miracolo', icon: '✅', tone: 'good', text: 'La stampante funziona al primo tentativo. Tutti si fermano a guardare.', delta: 40, reason: 'La stampante ha funzionato al primo tentativo!', log: 'riceve €40 per il miracolo della stampante.' },
  turiCoffee: { title: 'Caffè offerto da Turi', icon: '☕', tone: 'good', text: 'Turi offre il caffè a tutto l’ufficio. Un gesto inatteso, da segnare sul calendario.', delta: 20, reason: 'Turi offre il caffè.', log: 'riceve un caffè offerto da Turi.' },
  promotion: { title: 'Promozione: da lunedì!', icon: '📈', tone: 'good', text: 'La promozione è confermata. Lo stipendio nuovo parte, naturalmente, da lunedì.', delta: 200, reason: 'La promozione parte da lunedì.', log: 'riceve €200 di aumento promesso.' },
  team: { title: 'Team building obbligatorio', icon: '🧗', tone: 'bad', text: 'Il karaoke aziendale è stato divertente. Le corde vocali e il portafoglio la pensano diversamente.', delta: -35, reason: 'Il team building ha un costo.', log: 'paga €35 per il team building.' },
  monday: { title: 'Ci sentiamo lunedì', icon: '📨', tone: 'good', text: 'Il weekend è passato senza messaggi di lavoro. Lunedì è iniziato meglio del previsto.', delta: 60, reason: 'Il lunedì è andato meglio del previsto.', log: 'incassa €60 dopo il weekend.' },
  budget: { title: 'Revisione budget', icon: '📉', tone: 'bad', text: 'Ci sono tagli su tutto. Soprattutto sul tuo bonus.', delta: -75, reason: 'Tagli sul budget e sul bonus.', log: 'perde €75 nella revisione budget.' },
  chance: { title: 'Imprevisto!', icon: '🎲', tone: 'chance', random: true },
};

const surpriseDeck = [
  { title: 'Fortuna in fondo al cassetto', icon: '🎁', tone: 'good', text: 'Trovi una gift card dimenticata nel cassetto della scrivania.', delta: 100, reason: 'Gift card ritrovata nel cassetto.', log: 'trova una gift card da €100.' },
  { title: 'Cuffie in sciopero', icon: '🎧', tone: 'bad', text: 'Le cuffie si rompono proprio durante la call con il cliente.', delta: -60, reason: 'Hai rotto le cuffie durante la call.', log: 'spende €60 per un nuovo paio di cuffie.' },
  { title: 'Pranzo restituito', icon: '🥪', tone: 'good', text: 'Un collega ti restituisce finalmente i soldi del pranzo. Era ora!', delta: 50, reason: 'Un collega ti restituisce il pranzo.', log: 'recupera €50 dal collega.' },
  { title: 'La call poteva essere un’email', icon: '🚕', tone: 'bad', text: 'La call poteva essere un’email. Il taxi per arrivarci, purtroppo, no.', delta: -40, reason: 'Spesa imprevista per una riunione inutile.', log: 'paga €40 per raggiungere una riunione.' },
];

let eventMoveAfterCard = 0;

window.doEvent = function (id) {
  const card = eventDeck[id] || eventDeck.chance;
  const drawn = card.random ? surpriseDeck[Math.floor(Math.random() * surpriseDeck.length)] : card;
  const amount = drawn.delta || 0;
  eventMoveAfterCard = drawn.move || 0;

  if (amount !== 0) money(current, amount, drawn.reason);
  if (drawn.log) log(`${players[current].name} ${drawn.log}`);

  $('event-card').className = `event-card tone-${drawn.tone}`;
  $('event-label').textContent = drawn.tone === 'good' ? 'BUONE NUOVE' : drawn.tone === 'bad' ? 'IMPREVISTO' : 'PROBABILITÀ';
  $('event-art').textContent = drawn.icon;
  $('event-title').textContent = drawn.title;
  $('event-copy').textContent = drawn.text;
  $('event-result').textContent = eventMoveAfterCard ? 'AVANZA DI 3 CASELLE' : amount > 0 ? `INCASSI €${amount}` : `PAGHI €${Math.abs(amount)}`;
  $('event-result').className = `event-card-result ${amount > 0 || eventMoveAfterCard ? 'result-good' : amount < 0 ? 'result-bad' : ''}`;
  $('event-number').textContent = String(Math.floor(Math.random() * 89) + 11);
  $('event-dialog').showModal();
  return false;
};

function continueAfterEvent() {
  if (!$('event-dialog').open) return;
  $('event-dialog').close();

  if (eventMoveAfterCard) {
    const player = players[current];
    const oldPosition = player.pos;
    player.pos = (player.pos + eventMoveAfterCard) % spaces.length;
    if (oldPosition + eventMoveAfterCard >= spaces.length) money(current, 200, 'Hai completato un altro giro di ufficio. Incassi lo stipendio.');
    eventMoveAfterCard = 0;
    render();
    status('🛋️', 'Smart working!', `${player.name} avanza di 3 caselle dal divano.`);
    setTimeout(() => resolve(spaces[player.pos]), 320);
    return;
  }

  setTimeout(nextTurn, 400);
}

$('event-continue').addEventListener('click', continueAfterEvent);
$('event-dialog').addEventListener('cancel', event => {
  event.preventDefault();
  continueAfterEvent();
});
