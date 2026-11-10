(() => {
  'use strict';
  const G = window.Turipoly;
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'turipoly.save.v2';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let state = null;
  let busy = false;
  let rollTimer = null;
  let setupNames = ['Collega 1', 'Collega 2'];
  let renamePlayer = null;
  let sellIndex = null;
  let resultShown = false;
  let boardCursor = 0;
  let lastLog = '';
  const tiles = [];
  const playerTokens = [];

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function show(id) { if (!$(id).open) $(id).showModal(); }
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

  function apply(action, { focus = true } = {}) {
    if (!state || busy || action() === false) return;
    save();
    render();
    syncDialogs();
    if (focus && !document.querySelector('dialog[open]')) focusAction();
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
      const icon = element('span', 'space-emoji', space.emoji);
      icon.setAttribute('aria-hidden', 'true');
      const owner = element('span', 'space-owner');
      owner.hidden = true;
      const tokens = element('span', 'space-token-row');
      tile.append(stripe, icon, element('span', 'space-name', space.label), element('span', 'space-price', space.price ? G.euro(space.price) : ''), owner, tokens);
      tile.addEventListener('click', () => { setBoardCursor(index); openDetail(index); });
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
    $('dice-display').querySelectorAll('.die').forEach((die, i) => { die.textContent = state.dice[i] || '–'; });
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
      $('event-art').textContent = card.icon;
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
    const values = [dice(), dice()];
    // Commit first: a refresh during animation resumes the same result, never a new roll.
    if (!G.roll(state, values)) return;
    save();
    busy = true;
    $('dice-display').classList.add('rolling');
    render();
    $('roll-dice').hidden = false;
    $('end-turn').hidden = true;
    rollTimer = setTimeout(() => {
      rollTimer = null;
      busy = false;
      $('dice-display').classList.remove('rolling');
      render();
      syncDialogs();
      speak(`${values[0]} e ${values[1]}. ${state.players[state.current].name} arriva su ${G.spaces[state.players[state.current].pos].name}.`);
      if (!document.querySelector('dialog[open]')) focusAction();
    }, reducedMotion.matches ? 0 : 480);
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
    clearTimeout(rollTimer);
    busy = false;
    resultShown = false;
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    $('dice-display').classList.remove('rolling');
    state = next;
    save();
    render();
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
        apply(() => G.upgrade(state, index), { focus: false });
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
  }

  $('roll-dice').addEventListener('click', roll);
  $('end-turn').addEventListener('click', () => apply(() => G.endTurn(state)));
  $('confirm-buy').addEventListener('click', () => apply(() => G.purchase(state, true)));
  $('decline-buy').addEventListener('click', () => apply(() => G.purchase(state, false)));
  $('event-continue').addEventListener('click', () => apply(() => G.continueEvent(state)));
  $('choice-dialog').addEventListener('cancel', event => { event.preventDefault(); apply(() => G.purchase(state, false)); });
  $('event-dialog').addEventListener('cancel', event => event.preventDefault());
  $('skip-meeting').addEventListener('click', () => apply(() => G.meeting(state, false)));
  $('pay-meeting').addEventListener('click', () => apply(() => G.meeting(state, true)));
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
    if (zoomed && state) {
      const target = tiles[state.players[state.current].pos].node;
      $('board-wrap').scrollLeft = Math.max(0, target.offsetLeft - $('board-wrap').clientWidth / 2);
      $('board-wrap').scrollTop = Math.max(0, target.offsetTop - $('board-wrap').clientHeight / 2);
    }
  });
  $('manage-properties').addEventListener('click', () => { renderProperties(); $('property-feedback').textContent = ''; show('properties-dialog'); });
  $('confirm-sell').addEventListener('click', () => {
    const index = sellIndex;
    if (index === null) return;
    sellIndex = null;
    apply(() => G.sell(state, index), { focus: false });
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
