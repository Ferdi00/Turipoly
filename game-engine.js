(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./game-data.js'), require('./event-cards.js'));
  else root.Turipoly = factory(root.TuripolyData, root.TuripolyCards);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (data, cards) {
  'use strict';
  const { spaces, colors } = data;
  const VERSION = 2;
  const START_CASH = 1500;
  const SALARY = 200;
  const phases = ['ready', 'purchase', 'event', 'end', 'gameover'];
  const euro = value => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  const propertyIds = spaces.flatMap((space, i) => space.type === 'property' ? [i] : []);
  const groupIds = index => propertyIds.filter(i => spaces[i].group === spaces[index]?.group);
  const owned = (state, player) => propertyIds.filter(i => state.owners[i] === player);
  const fullGroup = (state, index) => state.owners[index] !== null && groupIds(index).every(i => state.owners[i] === state.owners[index]);
  const upgradeCost = index => Math.ceil(spaces[index].price / 2);
  const rent = (state, index) => spaces[index].rent * (state.upgrades[index] ? 3 : fullGroup(state, index) ? 2 : 1);
  const resale = (state, index) => Math.floor((spaces[index].price + (state.upgrades[index] ? upgradeCost(index) : 0)) / 2);
  const worth = (state, player) => state.players[player].cash + owned(state, player).reduce((sum, i) => sum + spaces[i].price + (state.upgrades[i] ? upgradeCost(i) : 0), 0);

  function note(state, message) {
    state.log.unshift(message);
    state.log.length = Math.min(state.log.length, 40);
  }

  function announce(state, title, text, tone = 'neutral') { state.notice = { title, text, tone }; }

  function create(names = ['Collega 1', 'Collega 2'], maxRounds = 12) {
    if (!Array.isArray(names) || names.length < 2 || names.length > 4) throw new Error('Servono da 2 a 4 colleghi.');
    if (![0, 12, 20].includes(maxRounds)) throw new Error('Durata non valida.');
    const cleaned = names.map(name => String(name).trim().slice(0, 22));
    if (cleaned.some(name => !name) || new Set(cleaned.map(n => n.toLocaleLowerCase('it'))).size !== cleaned.length) throw new Error('Scegli nomi diversi e non vuoti.');
    return {
      version: VERSION,
      players: cleaned.map(name => ({ name, cash: START_CASH, pos: 0, skip: 0, bankrupt: false, turns: 0 })),
      current: 0, round: 1, maxRounds, phase: 'ready', dice: [0, 0],
      owners: spaces.map(() => null), upgrades: spaces.map(() => 0),
      pending: null, deck: [], log: ['La squadra è pronta. La settimana lavorativa può iniziare.'],
      notice: { title: 'Si timbra!', text: 'Tira i dadi, conquista le postazioni e completa i gruppi dello stesso colore.', tone: 'neutral' },
      result: null
    };
  }

  function rankings(state) {
    return state.players.map((p, i) => ({ player: i, name: p.name, cash: p.cash, worth: worth(state, i), bankrupt: p.bankrupt }))
      .sort((a, b) => Number(a.bankrupt) - Number(b.bankrupt) || b.worth - a.worth);
  }

  function finish(state, reason) {
    const ranking = rankings(state);
    state.phase = 'gameover';
    state.pending = null;
    state.result = { reason, winners: ranking.filter(p => !p.bankrupt && p.worth === ranking[0].worth).map(p => p.player) };
    const names = state.result.winners.map(i => state.players[i].name).join(' e ');
    announce(state, state.result.winners.length > 1 ? 'Vittoria condivisa!' : `${names} vince!`, reason, 'good');
    note(state, `${names}: ${state.result.winners.length > 1 ? 'vittoria condivisa' : 'vittoria'} con un patrimonio di ${euro(ranking[0].worth)}.`);
  }

  function checkSurvivors(state) {
    if (state.players.filter(p => !p.bankrupt).length === 1) {
      finish(state, 'È rimasto un solo collega in gioco. Ufficio conquistato.');
      return true;
    }
    return false;
  }

  // Sell the least valuable asset first, deterministically, then settle only real cash.
  // This keeps cash non-negative and never creates money for a creditor.
  function pay(state, player, amount, creditor = null) {
    const p = state.players[player];
    let assets = owned(state, player).sort((a, b) => resale(state, a) - resale(state, b) || a - b);
    while (p.cash < amount && assets.length) {
      const i = assets.shift();
      const refund = resale(state, i);
      p.cash += refund;
      state.owners[i] = null;
      state.upgrades[i] = 0;
      note(state, `${p.name} cede ${spaces[i].name} alla banca per ${euro(refund)} per coprire il debito.`);
    }
    const paid = Math.min(p.cash, amount);
    p.cash -= paid;
    if (creditor !== null) state.players[creditor].cash += paid;
    if (paid < amount) {
      p.bankrupt = true;
      p.skip = 0;
      note(state, `${p.name} è in bancarotta: versa ${euro(paid)} su ${euro(amount)} dovuti ed esce dalla partita.`);
      announce(state, `${p.name} lascia l’ufficio`, 'Le postazioni liquidate tornano disponibili. Gli altri colleghi continuano.', 'bad');
      checkSurvivors(state);
    }
    return paid;
  }

  function shuffledDeck(random) {
    const deck = cards.surpriseDeck.map((_, i) => i);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function move(state, amount, random) {
    const p = state.players[state.current];
    const position = p.pos + amount;
    const laps = Math.floor(position / spaces.length);
    p.pos = position % spaces.length;
    if (laps) {
      p.cash += SALARY * laps;
      note(state, `${p.name} passa dal cartellino e incassa ${euro(SALARY * laps)}.`);
    }
    resolve(state, random);
  }

  function resolve(state, random = Math.random) {
    const player = state.current;
    const p = state.players[player];
    const i = p.pos;
    const s = spaces[i];
    note(state, `${p.name} arriva su ${s.name}.`);
    state.phase = 'end';
    state.pending = null;
    if (s.type === 'property') {
      const owner = state.owners[i];
      if (owner === null) {
        if (p.cash >= s.price) {
          state.phase = 'purchase';
          state.pending = i;
          announce(state, 'Una postazione libera', `${s.name}: ${euro(s.price)}, affitto base ${euro(s.rent)}.`, 'good');
        } else announce(state, 'Budget insufficiente', `Per ${s.name} servono ${euro(s.price)}. Puoi gestire le tue postazioni prima di terminare il turno.`);
      } else if (owner === player) announce(state, 'Bentornato alla tua postazione', `${s.name} è tua. Nessun affitto da pagare.`, 'good');
      else {
        const due = rent(state, i);
        const paid = pay(state, player, due, owner);
        note(state, `${p.name} paga ${euro(paid)} a ${state.players[owner].name} per ${s.name}.`);
        if (!p.bankrupt) announce(state, `Affitto: ${euro(due)}`, `${state.players[owner].name} incassa${state.upgrades[i] ? ' per la postazione potenziata' : fullGroup(state, i) ? ' il doppio grazie al gruppo completo' : ''}.`, 'bad');
      }
    } else if (s.type === 'event') {
      const card = cards.eventDeck[s.event];
      let surprise = null;
      if (card.random) {
        if (!state.deck.length) state.deck = shuffledDeck(random);
        surprise = state.deck.pop();
      }
      state.phase = 'event';
      state.pending = { id: s.event, surprise };
      announce(state, 'Una novità in ufficio', 'Leggi la carta e continua per applicarne l’effetto.');
    } else if (s.type === 'jail') {
      p.skip = 1;
      announce(state, 'Turi ti ha convocato', 'Al prossimo turno puoi saltare la riunione pagando €50, oppure restare e perdere il tiro.', 'bad');
    } else if (s.type === 'rest') {
      const bonus = i === 20 ? 100 : 150;
      p.cash += bonus;
      announce(state, `${s.name}: +${euro(bonus)}`, s.description, 'good');
      note(state, `${p.name} incassa ${euro(bonus)} per ${s.name}.`);
    } else announce(state, 'Inizio del giro', 'Hai timbrato. Lo stipendio è già stato accreditato passando dal cartellino.', 'good');
  }

  function roll(state, dice, random = Math.random) {
    if (state.phase !== 'ready' || state.players[state.current].bankrupt || state.players[state.current].skip) return false;
    if (!Array.isArray(dice) || dice.length !== 2 || dice.some(n => !Number.isInteger(n) || n < 1 || n > 6)) return false;
    state.dice = [...dice];
    note(state, `${state.players[state.current].name} tira ${dice[0]} + ${dice[1]} = ${dice[0] + dice[1]}.`);
    move(state, dice[0] + dice[1], random);
    return true;
  }

  function purchase(state, accept) {
    if (state.phase !== 'purchase') return false;
    const i = state.pending;
    const p = state.players[state.current];
    if (accept) {
      if (state.owners[i] !== null || p.cash < spaces[i].price) return false;
      p.cash -= spaces[i].price;
      state.owners[i] = state.current;
      note(state, `${p.name} compra ${spaces[i].name} per ${euro(spaces[i].price)}.`);
      announce(state, fullGroup(state, i) ? 'Gruppo completo! Affitti raddoppiati.' : 'Postazione acquistata', `${spaces[i].name} è tua.${fullGroup(state, i) ? ' Puoi potenziare le postazioni di questo gruppo.' : ' Completa il gruppo per raddoppiare gli affitti.'}`, 'good');
    } else {
      note(state, `${p.name} rinuncia a ${spaces[i].name}.`);
      announce(state, 'Occasione lasciata ai colleghi', 'La postazione resta libera. Puoi terminare il turno.');
    }
    state.phase = 'end';
    state.pending = null;
    return true;
  }

  function pendingCard(state) {
    if (state.phase !== 'event') return null;
    return state.pending.surprise === null ? cards.eventDeck[state.pending.id] : cards.surpriseDeck[state.pending.surprise];
  }

  function continueEvent(state, random = Math.random) {
    const card = pendingCard(state);
    if (!card) return false;
    state.pending = null;
    state.phase = 'end';
    const p = state.players[state.current];
    if (card.delta < 0) pay(state, state.current, -card.delta);
    else p.cash += card.delta || 0;
    note(state, `${p.name} ${card.log}`);
    if (!p.bankrupt) {
      announce(state, card.title, card.reason || card.text, card.tone);
      if (card.move) move(state, card.move, random);
    }
    return true;
  }

  function meeting(state, payFee) {
    const p = state.players[state.current];
    if (state.phase !== 'ready' || !p.skip) return false;
    if (payFee) {
      if (p.cash < 50) return false;
      p.cash -= 50;
      p.skip = 0;
      note(state, `${p.name} paga €50 per delegare la riunione e può tirare i dadi.`);
      announce(state, 'Riunione delegata', 'Hai pagato €50. Ora puoi tirare i dadi.');
    } else {
      p.skip = 0;
      state.phase = 'end';
      note(state, `${p.name} resta in riunione e salta il tiro.`);
      announce(state, 'Poteva essere un’email', 'Riunione conclusa. Termina il turno per passare al prossimo collega.');
    }
    return true;
  }

  function canManage(state) { return ['ready', 'end'].includes(state.phase) && !state.players[state.current].bankrupt; }

  function upgrade(state, index) {
    const p = state.players[state.current];
    if (!canManage(state) || state.owners[index] !== state.current || state.upgrades[index] || !fullGroup(state, index) || p.cash < upgradeCost(index)) return false;
    p.cash -= upgradeCost(index);
    state.upgrades[index] = 1;
    note(state, `${p.name} potenzia ${spaces[index].name} per ${euro(upgradeCost(index))}. Affitto: ${euro(rent(state, index))}.`);
    announce(state, 'Upgrade completato', `L’affitto di ${spaces[index].name} sale a ${euro(rent(state, index))}.`, 'good');
    return true;
  }

  function sell(state, index) {
    if (!canManage(state) || state.owners[index] !== state.current) return false;
    const refund = resale(state, index);
    state.players[state.current].cash += refund;
    state.owners[index] = null;
    state.upgrades[index] = 0;
    note(state, `${state.players[state.current].name} vende ${spaces[index].name} alla banca per ${euro(refund)}.`);
    announce(state, 'Liquidità recuperata', `${euro(refund)} accreditati. Il gruppo potrebbe non essere più completo.`);
    return true;
  }

  function endTurn(state) {
    if (state.phase !== 'end') return false;
    state.players[state.current].turns++;
    // A round ends after every surviving player has had the same number of turns.
    const active = state.players.filter(p => !p.bankrupt);
    if (active.every(p => p.turns >= state.round)) {
      if (state.maxRounds && state.round >= state.maxRounds) {
        finish(state, `${state.maxRounds} round completati. Vince il patrimonio più alto: liquidità + valore d’acquisto delle postazioni e degli upgrade.`);
        return true;
      }
      state.round++;
    }
    do { state.current = (state.current + 1) % state.players.length; } while (state.players[state.current].bankrupt);
    state.phase = 'ready';
    state.dice = [0, 0];
    const p = state.players[state.current];
    announce(state, `Tocca a ${p.name}`, p.skip ? 'Turi ti aspetta. Scegli se restare in riunione o delegarla per €50.' : 'Tira i dadi oppure gestisci le tue postazioni.');
    return true;
  }

  function rename(state, player, name) {
    const cleaned = String(name).trim().slice(0, 22);
    if (!state.players[player] || !cleaned || state.players.some((p, i) => i !== player && p.name.toLocaleLowerCase('it') === cleaned.toLocaleLowerCase('it'))) return false;
    state.players[player].name = cleaned;
    return true;
  }

  function restore(raw) {
    // Persisted state is untrusted input. Reject incompatible and incomplete saves.
    try {
      const s = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(JSON.stringify(raw));
      const integer = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
      if (!s || s.version !== VERSION || !Array.isArray(s.players) || s.players.length < 2 || s.players.length > 4) return null;
      if (!integer(s.current, 0, s.players.length - 1) || !integer(s.round, 1, 1000000) || ![0, 12, 20].includes(s.maxRounds) || !phases.includes(s.phase)) return null;
      if (s.players.some(p => typeof p.name !== 'string' || !p.name.trim() || p.name.length > 22 || !integer(p.cash, 0, 1000000000) || !integer(p.pos, 0, 39) || !integer(p.skip, 0, 1) || typeof p.bankrupt !== 'boolean' || !integer(p.turns, 0, 1000000))) return null;
      if (!Array.isArray(s.owners) || s.owners.length !== 40 || !Array.isArray(s.upgrades) || s.upgrades.length !== 40) return null;
      if (s.owners.some((owner, i) => owner !== null && (spaces[i].type !== 'property' || !integer(owner, 0, s.players.length - 1) || s.players[owner].bankrupt))) return null;
      if (s.upgrades.some((level, i) => ![0, 1].includes(level) || (level && s.owners[i] === null))) return null;
      if (!Array.isArray(s.dice) || s.dice.length !== 2 || s.dice.some(n => !integer(n, 0, 6))) return null;
      if (!Array.isArray(s.deck) || s.deck.some(i => !integer(i, 0, cards.surpriseDeck.length - 1)) || new Set(s.deck).size !== s.deck.length) return null;
      if (!Array.isArray(s.log) || s.log.length > 40 || s.log.some(n => typeof n !== 'string' || n.length > 1000)) return null;
      if (!s.notice || typeof s.notice.title !== 'string' || typeof s.notice.text !== 'string' || !['neutral', 'good', 'bad'].includes(s.notice.tone)) return null;
      if (s.phase !== 'gameover' && s.players[s.current].bankrupt && s.phase !== 'end') return null;
      if (s.phase === 'purchase' && (!integer(s.pending, 0, 39) || spaces[s.pending].type !== 'property' || s.pending !== s.players[s.current].pos || s.owners[s.pending] !== null || s.players[s.current].cash < spaces[s.pending].price)) return null;
      if (s.phase === 'event') {
        if (!s.pending || !Object.hasOwn(cards.eventDeck, s.pending.id) || spaces[s.players[s.current].pos].event !== s.pending.id) return null;
        if (cards.eventDeck[s.pending.id].random ? !integer(s.pending.surprise, 0, cards.surpriseDeck.length - 1) : s.pending.surprise !== null) return null;
      }
      if (!['purchase', 'event'].includes(s.phase) && s.pending !== null) return null;
      if (s.phase === 'gameover' && (!s.result || typeof s.result.reason !== 'string' || !Array.isArray(s.result.winners) || !s.result.winners.length || s.result.winners.some(i => !integer(i, 0, s.players.length - 1) || s.players[i].bankrupt))) return null;
      if (s.phase !== 'gameover' && s.result !== null) return null;
      if (!s.players.some(p => !p.bankrupt)) return null;
      return s;
    } catch { return null; }
  }

  return { spaces, colors, VERSION, START_CASH, SALARY, euro, create, owned, fullGroup, groupIds, rent, resale, worth, upgradeCost, rankings, pendingCard, roll, purchase, continueEvent, meeting, canManage, upgrade, sell, endTurn, rename, restore };
});
