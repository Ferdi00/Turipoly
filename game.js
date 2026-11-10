(() => {
  'use strict';
  const G = window.Turipoly;
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'turipoly.save.v2';
  const MOTION_KEY = 'turipoly.motion.v1';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let state = null;
  let busy = false;
  let sequence = 0;
  let motionOff = false;
  let setupNames = ['Collega 1', 'Collega 2'];
  let renamePlayer = null;
  let sellIndex = null;
  let resultShown = false;
  let boardCursor = 0;
  let lastLog = '';
  const tiles = [];
  const playerTokens = [];
  const M = window.TuripolyMotion;
  const motion = new M.Director(() => !motionOff && !reducedMotion.matches && !document.hidden);
  const spaceIcons = ['door', 'window', 'coffee', 'monitor', 'printer', 'calendar', 'team', 'home', 'snack', 'car', 'briefcase', 'clock', 'message', 'snow', 'snack', 'clock', 'key', 'lunch', 'bulb', 'target', 'sun', 'chair', 'coins', 'building', 'receipt', 'printer', 'leaf', 'coffee', 'waves', 'trend', 'party', 'building', 'mail', 'tie', 'team', 'leaf', 'message', 'car', 'trend', 'car'];
  const eventIcons = { coffee: 'coffee', printer: 'printer', meeting: 'calendar', remote: 'home', boss: 'message', friday: 'clock', lunch: 'lunch', bonus: 'target', coin: 'coins', expenses: 'receipt', printerWin: 'printer', turiCoffee: 'coffee', promotion: 'trend', team: 'team', monday: 'message', budget: 'trend', chance: 'mail' };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ui-icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#icon-${name}`);
    svg.append(use);
    return svg;
  }

  function show(id) {
    if ($(id).open) return;
    $(id).showModal();
    const paper = id === 'event-dialog';
    motion.play($(id), [
      { opacity: .35, transform: paper ? 'perspective(800px) translateY(30px) rotateX(8deg) rotate(-2deg) scale(.96)' : 'translateY(14px) scale(.985)' },
      { opacity: 1, transform: paper ? 'perspective(800px) translateY(0) rotateX(0) rotate(0) scale(1)' : 'translateY(0) scale(1)' }
    ], { duration: paper ? 380 : 220 });
  }
  function close(id) { if ($(id).open) $(id).close(); }
  function speak(message) { $('announcement').textContent = message; }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      $('save-status').textContent = 'Partita salvata su questo browser';
      $('save-status').className = '';
    } catch {
      $('save-status').textContent = 'Salvataggio non disponibile: non chiudere la pagina.';
      $('save-status').className = 'save-error';
    }
  }

  function snapshot() { return { current: state.current, pos: state.players[state.current].pos, cash: state.players.map(p => p.cash), round: state.round }; }

  function apply(action, { focus = true, stamp = '' } = {}) {
    if (!state || busy) return;
    const before = snapshot();
    if (action() === false) return;
    save();
    const steps = before.current === state.current ? (state.players[state.current].pos - before.pos + 40) % 40 : 0;
    if (steps) {
      close('event-dialog');
      presentMove(before, steps, { focus, stamp });
      return;
    }
    finishPresentation(before, { focus, stamp });
  }

  function finishPresentation(before, { focus = true, stamp = '' } = {}) {
    render();
    syncDialogs();
    feedback(before, stamp);
    if (focus && !document.querySelector('dialog[open]')) focusAction();
  }

  function stampOffice(text) {
    if (!text) return;
    $('stamp-text').textContent = text;
    motion.play($('office-stamp'), [
      { transform: 'rotate(-12deg) scale(1.25)', opacity: .15, filter: 'blur(1px)' },
      { transform: 'rotate(-12deg) scale(1)', opacity: .85, filter: 'blur(0)' }
    ], { duration: 280 });
  }

  function feedback(before, stamp) {
    if (stamp) stampOffice(stamp);
    state.players.forEach((p, i) => {
      const change = p.cash - (before.cash[i] ?? p.cash);
      if (!change) return;
      const card = $('players-list').querySelector(`[data-player="${i}"]`);
      if (!card) return;
      const receipt = element('span', `cash-change ${change > 0 ? 'cash-gain' : 'cash-loss'}`, `${change > 0 ? '+' : '−'}${G.euro(Math.abs(change))}`);
      receipt.setAttribute('aria-hidden', 'true');
      card.append(receipt);
      if (motion.enabled()) motion.play(receipt, [
        { opacity: 0, transform: 'translateY(5px) rotate(-3deg)', offset: 0 },
        { opacity: 1, transform: 'translateY(0) rotate(-3deg)', offset: .15 },
        { opacity: 1, transform: 'translateY(0) rotate(-3deg)', offset: .8 },
        { opacity: 0, transform: 'translateY(-7px) rotate(-3deg)', offset: 1 }
      ], { duration: 1450 }).then(() => receipt.remove());
      else window.setTimeout(() => receipt.remove(), 1450);
    });
    if (before.current !== state.current) {
      motion.play($('center-turn-ticket'), [{ transform: 'translateX(12px)', opacity: .4 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 240 });
      motion.play($('turn-title'), [{ opacity: .3 }, { opacity: 1 }], { duration: 220 });
    }
  }

  function freezeControls() {
    $('roll-dice').hidden = false;
    $('roll-dice').disabled = true;
    $('roll-dice').textContent = 'Dadi in volo…';
    $('end-turn').hidden = true;
    for (const id of ['manage-properties', 'new-game', 'rules', 'zoom-board']) $(id).disabled = true;
    $('players-list').querySelectorAll('button').forEach(button => { button.disabled = true; });
    tiles.forEach(tile => { tile.node.disabled = true; });
    $('board').setAttribute('aria-busy', 'true');
  }

  async function presentMove(before, steps, { diceValues = null, focus = true, stamp = '' } = {}) {
    const epoch = ++sequence;
    busy = true;
    freezeControls();
    try {
      if (diceValues) {
        paintDice(diceValues);
        $('turn-hint').textContent = 'Si lanciano i dadi. Il caffè può aspettare.';
        await Promise.all([...$('dice-display').querySelectorAll('.die')].map((die, i) => motion.play(die, [
          { transform: `perspective(400px) translateY(0) rotateX(0) rotate(${i ? 6 : -6}deg)` },
          { transform: `perspective(400px) translateY(-18px) rotateX(35deg) rotate(${i ? -30 : 30}deg)`, offset: .35 },
          { transform: `perspective(400px) translateY(2px) rotateX(-8deg) rotate(${i ? 10 : -10}deg)`, offset: .75 },
          { transform: 'perspective(400px) translateY(0) rotateX(0) rotate(0)' }
        ], { duration: 520, delay: i * 45 })));
      }
      if (epoch !== sequence) return;
      $('roll-dice').textContent = 'In giro per l’ufficio…';
      $('turn-hint').textContent = `${steps} caselle per ${state.players[state.current].name}. Occhio alle riunioni.`;
      await motion.travel($('board'), playerTokens[state.current], tiles, M.route(before.pos, steps), G.colors[state.current]);
    } finally {
      if (epoch === sequence) {
        busy = false;
        $('board').removeAttribute('aria-busy');
        for (const id of ['rules', 'zoom-board']) $(id).disabled = false;
        finishPresentation(before, { focus, stamp: stamp || (G.spaces[state.players[state.current].pos].type === 'jail' ? 'CONVOCATO' : 'ARRIVATO') });
        const tile = tiles[state.players[state.current].pos].node;
        motion.play(tile, [{ backgroundColor: '#f2d57f' }, { backgroundColor: getComputedStyle(tile).backgroundColor }], { duration: 600 });
        if ($('board-wrap').classList.contains('zoomed')) centerOnCurrentSpace();
        speak(`${diceValues ? `${diceValues[0]} e ${diceValues[1]}. ` : ''}${state.players[state.current].name} arriva su ${G.spaces[state.players[state.current].pos].name}.`);
      }
    }
  }

  function buildDice() {
    $('dice-display').querySelectorAll('.die').forEach(die => {
      const grid = element('span', 'die-pips');
      grid.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 9; i++) grid.append(element('i', 'pip'));
      die.replaceChildren(grid, element('span', 'die-placeholder', '—'));
    });
  }

  function paintDice(values) {
    const masks = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
    $('dice-display').querySelectorAll('.die').forEach((die, i) => {
      die.dataset.value = values[i];
      die.querySelector('.die-placeholder').hidden = !!values[i];
      die.querySelectorAll('.pip').forEach((pip, n) => pip.classList.toggle('lit', masks[values[i] || 0].includes(n)));
    });
  }

  function updateMotionPreference() {
    const on = !motionOff && !reducedMotion.matches;
    document.documentElement.classList.toggle('motion-off', !on);
    $('motion-toggle').setAttribute('aria-pressed', String(on));
    $('motion-label').textContent = reducedMotion.matches ? 'Movimento ridotto' : on ? 'Animazioni attive' : 'Animazioni ridotte';
    $('motion-toggle').disabled = reducedMotion.matches;
    $('motion-toggle').title = reducedMotion.matches ? 'È attiva la preferenza di movimento ridotto del dispositivo.' : 'Attiva o riduci gli effetti della partita.';
    if (!on) motion.cancel();
  }

  function centerOnCurrentSpace() {
    if (!state) return;
    const wrap = $('board-wrap');
    const target = tiles[state.players[state.current].pos].node.getBoundingClientRect();
    const viewport = wrap.getBoundingClientRect();
    wrap.scrollLeft += target.left - viewport.left - (wrap.clientWidth - target.width) / 2;
    wrap.scrollTop += target.top - viewport.top - (wrap.clientHeight - target.height) / 2;
  }

  function focusAction() {
    const target = state.phase === 'gameover' ? $('roll-dice') : state.players[state.current].skip && state.phase === 'ready' ? $('skip-meeting') : state.phase === 'end' ? $('end-turn') : $('roll-dice');
    target.focus({ preventScroll: true });
  }

  function coords(i) {
    if (i < 10) return [10, 10 - i];
    if (i < 20) return [20 - i, 0];
    if (i < 30) return [0, i - 20];
    return [i - 30, 10];
  }

  function buildBoard() {
    const fragment = document.createDocumentFragment();
    G.spaces.forEach((space, index) => {
      const [row, col] = coords(index);
      const tile = element('button', `space${index % 10 === 0 ? ' corner' : ''}`);
      tile.type = 'button';
      tile.dataset.space = index;
      tile.tabIndex = index === 0 ? 0 : -1;
      tile.style.gridRow = row + 1;
      tile.style.gridColumn = col + 1;
      const stripe = element('span', 'space-color');
      stripe.style.background = space.color || ({ event: '#e2b43e', jail: '#c85443', start: '#478853', rest: '#88ac5f' }[space.type]);
      tile.dataset.type = space.type;
      const art = element('span', 'space-emoji');
      art.append(icon(spaceIcons[index]));
      const owner = element('span', 'space-owner');
      owner.hidden = true;
      const tokens = element('span', 'space-token-row');
      tile.append(stripe, art, element('span', 'space-name', space.label), element('span', 'space-price', space.price ? G.euro(space.price) : ''), owner, tokens);
      tile.addEventListener('click', () => { if (!busy) { setBoardCursor(index); openDetail(index); } });
      tile.addEventListener('keydown', event => {
        let next = index;
        if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % 40;
        else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index + 39) % 40;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = 39;
        else return;
        event.preventDefault();
        setBoardCursor(next);
        tiles[next].node.focus();
      });
      tiles.push({ node: tile, owner, tokens });
      fragment.append(tile);
    });
    $('board').append(fragment);
    for (let i = 0; i < 4; i++) {
      const token = element('span', 'token', String(i + 1));
      token.style.setProperty('--player-color', G.colors[i]);
      playerTokens.push(token);
    }
  }

  function setBoardCursor(index) {
    tiles[boardCursor].node.tabIndex = -1;
    tiles[index].node.tabIndex = 0;
    boardCursor = index;
  }

  function renderBoard() {
    tiles.forEach((tile, i) => {
      const s = G.spaces[i];
      tile.node.disabled = busy;
      const owner = state?.owners[i];
      const occupants = state ? state.players.filter(p => !p.bankrupt && p.pos === i).map(p => p.name) : [];
      tile.node.classList.toggle('current-space', !!state && state.phase !== 'gameover' && state.players[state.current].pos === i);
      tile.node.style.setProperty('--active-color', G.colors[state?.current || 0]);
      tile.owner.hidden = owner === null || owner === undefined;
      if (owner !== null && owner !== undefined) {
        tile.node.style.setProperty('--owner-color', G.colors[owner]);
        tile.owner.textContent = `${owner + 1}${state.upgrades[i] ? ' ★' : ''}`;
      }
      const description = `${i + 1}. ${s.name}${s.price ? `. Prezzo ${G.euro(s.price)}. ${owner === null || owner === undefined ? 'Libera' : `Di ${state.players[owner].name}. Affitto ${G.euro(G.rent(state, i))}`}` : ''}${occupants.length ? `. Qui: ${occupants.join(', ')}` : ''}.`;
      tile.node.setAttribute('aria-label', description);
      tile.node.title = description;
    });
    playerTokens.forEach((token, i) => {
      const p = state?.players[i];
      if (!p || p.bankrupt) { token.remove(); return; }
      token.setAttribute('aria-label', p.name);
      const parent = tiles[p.pos].tokens;
      if (token.parentElement !== parent) parent.append(token);
    });
  }

  function renderPlayers() {
    const fragment = document.createDocumentFragment();
    state.players.forEach((p, i) => {
      const card = element('div', `player-card${i === state.current && state.phase !== 'gameover' ? ' active' : ''}${p.bankrupt ? ' bankrupt' : ''}`);
      card.dataset.player = i;
      card.style.setProperty('--player-color', G.colors[i]);
      const avatar = element('span', 'avatar', String(i + 1));
      avatar.style.setProperty('--player-color', G.colors[i]);
      avatar.setAttribute('aria-hidden', 'true');
      const main = element('div', 'player-main');
      const name = element('button', 'player-name', p.name);
      name.type = 'button';
      name.title = `Modifica il nome di ${p.name}`;
      name.setAttribute('aria-label', `Modifica nome: ${p.name}`);
      name.disabled = busy;
      name.addEventListener('click', () => openRename(i));
      const meta = p.bankrupt ? 'Bancarotta' : `${G.owned(state, i).length} postazioni${p.skip ? ' · In riunione' : i === state.current && state.phase !== 'gameover' ? ' · Tocca a te' : ''}`;
      main.append(name, element('div', 'player-meta', meta));
      const cash = element('div', 'player-cash', G.euro(p.cash));
      cash.append(element('small', '', `Patrimonio ${G.euro(G.worth(state, i))}`));
      card.append(avatar, main, cash);
      fragment.append(card);
    });
    $('players-list').replaceChildren(fragment);
    $('player-count').textContent = `${state.players.filter(p => !p.bankrupt).length} in gioco`;
  }

  function render() {
    renderBoard();
    if (!state) return;
    const p = state.players[state.current];
    const ended = state.phase === 'gameover';
    renderPlayers();
    $('round-label').textContent = ended ? 'Giornata conclusa' : `Round ${state.round}${state.maxRounds ? ` di ${state.maxRounds}` : ' · Straordinari'} · ${state.players.length} colleghi`;
    $('center-caption').textContent = ended ? 'Ufficio conquistato' : 'È il turno di';
    $('center-player').textContent = ended ? state.result.winners.map(i => state.players[i].name).join(' e ') : p.name;
    $('center-position').textContent = ended ? 'Una riunione alla volta.' : `${G.spaces[p.pos].name} · casella ${p.pos + 1}`;
    $('turn-title').textContent = ended ? 'Si chiude l’ufficio.' : `Tocca a ${p.name}`;
    $('turn-marker').style.background = G.colors[state.current];
    $('turn-marker').textContent = state.current + 1;
    $('roll-dice').hidden = !ended && (state.phase !== 'ready' || !!p.skip);
    $('roll-dice').disabled = busy;
    $('roll-dice').textContent = ended ? 'Rivedi la classifica' : busy ? 'Dadi in volo…' : 'Tira i dadi';
    $('end-turn').hidden = state.phase !== 'end';
    $('end-turn').disabled = busy;
    const next = nextPlayerName();
    $('end-turn').textContent = p.bankrupt ? `Continua con ${next}` : 'Termina il turno';
    $('end-turn').setAttribute('aria-label', `Termina il turno di ${p.name}. Prossimo collega: ${next}`);
    $('meeting-actions').hidden = !(p.skip && state.phase === 'ready');
    $('pay-meeting').disabled = p.cash < 50 || busy;
    $('skip-meeting').disabled = busy;
    $('manage-properties').disabled = !G.canManage(state) || busy;
    $('manage-properties').textContent = `Le tue postazioni · ${G.owned(state, state.current).length}`;
    $('new-game').disabled = busy;
    const hints = { ready: p.skip ? 'Turi ti aspetta. Resti o deleghi?' : 'Due dadi. Una nuova occasione.', purchase: 'Una postazione libera: scegli se acquistarla.', event: 'C’è una novità in ufficio. Leggi la carta.', end: `Quando sei pronto, passa a ${next}.`, gameover: 'La squadra può rivedere il tabellone o iniziare una nuova partita.' };
    $('turn-hint').textContent = busy ? 'I dadi stanno decidendo la tua giornata…' : hints[state.phase];
    paintDice(state.dice);
    $('dice-display').setAttribute('aria-label', state.dice[0] ? `Dadi: ${state.dice[0]} e ${state.dice[1]}. Totale ${state.dice[0] + state.dice[1]}.` : 'Dadi da tirare');
    $('status-card').dataset.tone = state.notice.tone;
    $('status-card').replaceChildren(element('strong', '', state.notice.title), element('p', '', state.notice.text));
    const logKey = JSON.stringify(state.log);
    if (lastLog !== logKey) {
      $('activity-log').replaceChildren(...state.log.slice(0, 16).map(message => element('li', '', message)));
      $('activity-log').scrollTop = 0;
      lastLog = logKey;
    }
    $('log-count').textContent = state.log.length;
  }

  function nextPlayerName() {
    let next = state.current;
    do { next = (next + 1) % state.players.length; } while (state.players[next].bankrupt);
    return state.players[next].name;
  }

  function stats(container, rows) {
    container.replaceChildren(...rows.flatMap(([label, value]) => [element('dt', '', label), element('dd', '', value)]));
  }

  function syncDialogs() {
    if (!state || busy) return;
    if (state.phase !== 'purchase') close('choice-dialog');
    if (state.phase !== 'event') close('event-dialog');
    if (state.phase === 'purchase') {
      const i = state.pending;
      const s = G.spaces[i];
      $('choice-group').textContent = `Gruppo ${s.group}`;
      $('choice-title').textContent = s.name;
      $('choice-description').textContent = `Una nuova postazione per ${state.players[state.current].name}. Completa le ${G.groupIds(i).length} postazioni di questo gruppo per raddoppiare l’affitto.`;
      stats($('choice-stats'), [['Prezzo', G.euro(s.price)], ['Affitto base', G.euro(s.rent)], ['Gruppo completo', G.euro(s.rent * 2)]]);
      $('choice-balance').textContent = `Ti restano ${G.euro(state.players[state.current].cash - s.price)} dopo l’acquisto.`;
      $('confirm-buy').textContent = `Compra · ${G.euro(s.price)}`;
      show('choice-dialog');
      $('decline-buy').focus();
    } else if (state.phase === 'event') {
      const card = G.pendingCard(state);
      $('event-card').className = `event-card tone-${card.tone}`;
      $('event-label').textContent = card.tone === 'good' ? 'BUONE NUOVE' : 'IMPREVISTO';
      $('event-title').textContent = card.title;
      $('event-art').replaceChildren(icon(eventIcons[state.pending.id] || 'mail'));
      $('event-copy').textContent = card.text;
      $('event-result').textContent = card.move ? `Avanza di ${card.move} caselle` : `${card.delta > 0 ? 'Incassi' : 'Paghi'} ${G.euro(Math.abs(card.delta || 0))}`;
      show('event-dialog');
      $('event-continue').focus();
    } else if (state.phase === 'gameover' && !resultShown) {
      resultShown = true;
      openResult();
    }
  }

  function dice() {
    if (!window.crypto?.getRandomValues) return 1 + Math.floor(Math.random() * 6);
    const buffer = new Uint32Array(1);
    do { crypto.getRandomValues(buffer); } while (buffer[0] >= 4294967292);
    return buffer[0] % 6 + 1;
  }

  function roll() {
    if (!state || busy) return;
    if (state.phase === 'gameover') { openResult(); return; }
    if (state.phase !== 'ready' || state.players[state.current].skip) return;
    const before = snapshot();
    const values = [dice(), dice()];
    // Commit first: a refresh during animation resumes the same result, never a new roll.
    if (!G.roll(state, values)) return;
    save();
    presentMove(before, values[0] + values[1], { diceValues: values });
  }

  function readSetupFields() { setupNames = [...$('player-fields').querySelectorAll('input')].map(input => input.value); }

  function renderSetupFields() {
    $('player-fields').replaceChildren(...setupNames.map((name, i) => {
      const row = element('div', 'player-field');
      const label = element('label', '', String(i + 1));
      label.htmlFor = `player-${i}`;
      label.style.setProperty('--player-color', G.colors[i]);
      const input = element('input');
      input.id = `player-${i}`;
      input.value = name;
      input.required = true;
      input.maxLength = 22;
      input.autocomplete = 'off';
      input.setAttribute('aria-label', `Nome del collega ${i + 1}`);
      row.append(label, input);
      return row;
    }));
    $('setup-count').textContent = `${setupNames.length} colleghi`;
    $('add-player').disabled = setupNames.length >= 4;
    $('remove-player').disabled = setupNames.length <= 2;
  }

  function openSetup() {
    if (busy) return;
    setupNames = state ? state.players.map(p => p.name) : ['Collega 1', 'Collega 2'];
    $('game-length').value = state?.maxRounds ?? 12;
    $('close-setup').hidden = !state;
    $('replace-warning').hidden = !state;
    $('setup-error').textContent = '';
    renderSetupFields();
    show('setup-dialog');
  }

  function startGame(event) {
    event.preventDefault();
    readSetupFields();
    let next;
    try { next = G.create(setupNames, Number($('game-length').value)); }
    catch (error) { $('setup-error').textContent = error.message; return; }
    sequence++;
    motion.cancel();
    busy = false;
    resultShown = false;
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    $('dice-display').classList.remove('rolling');
    state = next;
    save();
    render();
    stampOffice('TIMBRATO');
    focusAction();
  }

  function openDetail(index) {
    const s = G.spaces[index];
    $('detail-title').textContent = s.name;
    const content = $('detail-content');
    content.replaceChildren();
    if (s.type === 'property') {
      const owner = state?.owners[index];
      const ownerName = owner === null || owner === undefined ? 'Libera' : state.players[owner].name;
      content.append(element('span', 'property-group', `${s.group} · ${G.groupIds(index).length} postazioni`));
      const dl = element('dl', 'property-stats');
      stats(dl, [['Prezzo', G.euro(s.price)], ['Proprietario', ownerName], ['Affitto attuale', G.euro(state ? G.rent(state, index) : s.rent)], ['Gruppo completo', G.euro(s.rent * 2)], ['Con upgrade', G.euro(s.rent * 3)], ['Costo upgrade', G.euro(G.upgradeCost(index))]]);
      content.append(dl, element('p', '', `Nel gruppo: ${G.groupIds(index).map(i => G.spaces[i].label).join(', ')}.`));
    } else {
      const card = s.event ? window.TuripolyCards.eventDeck[s.event] : null;
      content.append(element('p', '', s.description || (card?.random ? 'Pesca dal mazzo degli imprevisti. Le carte si rimescolano solo dopo averle pescate tutte.' : card?.text) || 'Un’altra giornata in ufficio.'));
      if (s.type === 'jail') content.append(element('p', '', 'Il prossimo turno puoi delegare la riunione per €50 oppure saltare il tiro.'));
    }
    show('detail-dialog');
  }

  function renderProperties() {
    const p = state.players[state.current];
    const ids = G.owned(state, state.current);
    $('properties-title').textContent = `Le postazioni di ${p.name}`;
    $('properties-summary').textContent = `Liquidità ${G.euro(p.cash)} · Patrimonio ${G.euro(G.worth(state, state.current))}`;
    $('properties-list').replaceChildren();
    if (!ids.length) $('properties-list').append(element('p', 'empty-note', 'Nessuna postazione, per ora. Arriva su una casella libera e comprala per iniziare.'));
    ids.forEach(index => {
      const s = G.spaces[index];
      const row = element('section', 'property-row');
      row.append(element('span', 'property-group', `${s.group}${G.fullGroup(state, index) ? ' · completo' : ''}`), element('h3', '', `${s.name}${state.upgrades[index] ? ' ★' : ''}`), element('p', '', `Affitto ${G.euro(G.rent(state, index))} · Valore ${G.euro(s.price + (state.upgrades[index] ? G.upgradeCost(index) : 0))}`));
      const actions = element('div', 'action-pair');
      const upgrade = element('button', 'button button-outline', state.upgrades[index] ? 'Già potenziata' : `Upgrade · ${G.euro(G.upgradeCost(index))}`);
      upgrade.type = 'button';
      upgrade.disabled = !!state.upgrades[index] || !G.fullGroup(state, index) || p.cash < G.upgradeCost(index) || !G.canManage(state);
      upgrade.addEventListener('click', () => {
        apply(() => G.upgrade(state, index), { focus: false, stamp: 'POTENZIATO' });
        renderProperties();
        $('property-feedback').textContent = `Upgrade di ${s.name} completato. Affitto ${G.euro(G.rent(state, index))}.`;
        $('properties-dialog').querySelector('.icon-button').focus({ preventScroll: true });
      });
      const sell = element('button', 'button button-quiet', `Vendi · ${G.euro(G.resale(state, index))}`);
      sell.type = 'button';
      sell.disabled = !G.canManage(state);
      sell.addEventListener('click', () => {
        sellIndex = index;
        $('sell-description').textContent = `La banca ti versa ${G.euro(G.resale(state, index))} per ${s.name}. La postazione torna libera e il gruppo perde il bonus di completezza. Gli altri upgrade restano attivi.`;
        show('sell-dialog');
      });
      actions.append(upgrade, sell);
      row.append(actions);
      if (!state.upgrades[index]) row.append(element('p', 'small-note', !G.fullGroup(state, index) ? 'Completa il gruppo per sbloccare l’upgrade.' : p.cash < G.upgradeCost(index) ? 'Liquidità insufficiente per l’upgrade.' : `Con l’upgrade incassi ${G.euro(s.rent * 3)} per visita.`));
      $('properties-list').append(row);
    });
  }

  function openRename(index) {
    if (busy) return;
    renamePlayer = index;
    $('rename-input').value = state.players[index].name;
    $('rename-error').textContent = '';
    show('rename-dialog');
    $('rename-input').select();
  }

  function openResult() {
    const winners = state.result.winners.map(i => state.players[i].name).join(' e ');
    $('result-title').textContent = state.result.winners.length > 1 ? `${winners}: vittoria condivisa!` : `${winners} conquista l’ufficio!`;
    $('result-description').textContent = state.result.reason;
    $('ranking-list').replaceChildren(...G.rankings(state).map((p, i) => {
      const row = element('li');
      row.append(element('span', '', `${i + 1}. ${p.name}${p.bankrupt ? ' · Bancarotta' : ''}`), element('strong', '', G.euro(p.worth)));
      return row;
    }));
    show('result-dialog');
    stampOffice('PROMOSSO');
    if (motion.enabled()) {
      const confetti = element('div', 'paper-confetti');
      confetti.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 16; i++) {
        const piece = element('i');
        piece.style.left = `${8 + i * 5.5}%`;
        piece.style.background = ['#d6a83c', '#46785b', '#b5513c', '#42708d'][i % 4];
        confetti.append(piece);
        motion.play(piece, [{ transform: 'translateY(-25px) rotate(0)', opacity: 0 }, { opacity: 1, offset: .15 }, { transform: `translate(${Math.sin(i) * 40}px, 220px) rotate(${i % 2 ? 240 : -240}deg)`, opacity: 0 }], { duration: 1000, delay: i * 22, easing: 'cubic-bezier(.22,.5,.5,1)' });
      }
      $('result-dialog').append(confetti);
      Promise.all([...motion.active].map(a => a.finished.catch(() => {}))).then(() => confetti.remove());
    }
  }

  $('roll-dice').addEventListener('click', roll);
  $('end-turn').addEventListener('click', () => apply(() => G.endTurn(state), { stamp: 'IN SERVIZIO' }));
  $('confirm-buy').addEventListener('click', () => apply(() => G.purchase(state, true), { stamp: 'ACQUISTATO' }));
  $('decline-buy').addEventListener('click', () => apply(() => G.purchase(state, false)));
  $('event-continue').addEventListener('click', () => apply(() => G.continueEvent(state), { stamp: 'PROTOCOLLATO' }));
  $('choice-dialog').addEventListener('cancel', event => { event.preventDefault(); apply(() => G.purchase(state, false)); });
  $('event-dialog').addEventListener('cancel', event => event.preventDefault());
  $('skip-meeting').addEventListener('click', () => apply(() => G.meeting(state, false), { stamp: 'IN RIUNIONE' }));
  $('pay-meeting').addEventListener('click', () => apply(() => G.meeting(state, true), { stamp: 'DELEGATO' }));
  $('new-game').addEventListener('click', openSetup);
  $('play-again').addEventListener('click', () => { close('result-dialog'); openSetup(); });
  $('rules').addEventListener('click', () => show('rules-dialog'));
  $('setup-form').addEventListener('submit', startGame);
  $('close-setup').addEventListener('click', () => close('setup-dialog'));
  $('setup-dialog').addEventListener('cancel', event => { if (!state) event.preventDefault(); });
  $('add-player').addEventListener('click', () => { readSetupFields(); if (setupNames.length < 4) { setupNames.push(`Collega ${setupNames.length + 1}`); renderSetupFields(); } });
  $('remove-player').addEventListener('click', () => { readSetupFields(); if (setupNames.length > 2) { setupNames.pop(); renderSetupFields(); } });
  $('zoom-board').addEventListener('click', () => {
    const zoomed = $('board-wrap').classList.toggle('zoomed');
    $('zoom-board').textContent = zoomed ? 'Mostra tutto il tabellone' : 'Ingrandisci tabellone';
    $('zoom-board').setAttribute('aria-pressed', String(zoomed));
    if (zoomed) centerOnCurrentSpace();
  });
  $('manage-properties').addEventListener('click', () => { renderProperties(); $('property-feedback').textContent = ''; show('properties-dialog'); });
  $('confirm-sell').addEventListener('click', () => {
    const index = sellIndex;
    if (index === null) return;
    sellIndex = null;
    apply(() => G.sell(state, index), { focus: false, stamp: 'VENDUTO' });
    close('sell-dialog');
    renderProperties();
    $('property-feedback').textContent = `${G.spaces[index].name} venduta. Liquidità ${G.euro(state.players[state.current].cash)}.`;
    $('properties-dialog').querySelector('.icon-button').focus({ preventScroll: true });
  });
  $('rename-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!G.rename(state, renamePlayer, $('rename-input').value)) { $('rename-error').textContent = 'Inserisci un nome diverso da quello degli altri colleghi.'; return; }
    close('rename-dialog');
    save();
    render();
    if (state.phase === 'gameover') resultShown = false;
    syncDialogs();
    if (!document.querySelector('dialog[open]')) focusAction();
  });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => close(button.dataset.close)));

  $('motion-toggle').addEventListener('click', () => {
    motionOff = !motionOff;
    try { localStorage.setItem(MOTION_KEY, String(motionOff)); } catch { /* Preference still works for this visit. */ }
    updateMotionPreference();
  });
  reducedMotion.addEventListener('change', updateMotionPreference);
  document.addEventListener('visibilitychange', () => { if (document.hidden) motion.cancel(); });

  try { motionOff = localStorage.getItem(MOTION_KEY) === 'true'; } catch { /* Use system preference. */ }
  updateMotionPreference();
  buildDice();
  buildBoard();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = G.restore(saved);
      $('save-status').textContent = state ? 'Partita ripresa · salvataggio automatico' : 'Salvataggio non valido. Inizia una nuova partita.';
      if (!state) $('save-status').className = 'save-error';
    }
  } catch {
    $('save-status').textContent = 'Salvataggio non disponibile su questo browser.';
    $('save-status').className = 'save-error';
  }
  render();
  if (state) syncDialogs(); else openSetup();
})();
