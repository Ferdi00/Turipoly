const { test } = require('node:test');
const assert = require('node:assert/strict');
const G = require('../game-engine.js');
const fresh = (count = 2, rounds = 12) => G.create(['Gerardo', 'Turi', 'Anna', 'Luca'].slice(0, count), rounds);
const landing = (state, position) => { state.players[state.current].pos = (position + 38) % 40; return G.roll(state, [1, 1], () => .5); };
const copy = state => JSON.parse(JSON.stringify(state));

test('setup: 2–4 players, unique trimmed names, correct starting cash', () => {
  for (const count of [2, 3, 4]) {
    const s = fresh(count);
    assert.equal(s.players.length, count);
    assert.ok(s.players.every(p => p.cash === 1500 && p.pos === 0));
    assert.deepEqual(G.restore(s), s);
  }
  assert.equal(G.create([' Gerardo ', 'Turi']).players[0].name, 'Gerardo');
  assert.throws(() => G.create(['Gerardo']));
  assert.throws(() => G.create(['Turi', ' turi ']));
  assert.throws(() => G.create([' ', 'Turi']));
  assert.throws(() => G.create(['A', 'B'], 1));
});

test('board: 40 spaces with valid event references and 8 distinct property groups', () => {
  const cards = require('../event-cards.js');
  assert.equal(G.spaces.length, 40);
  assert.equal(new Set(G.spaces.filter(s => s.type === 'property').map(s => s.group)).size, 8);
  for (const s of G.spaces) if (s.type === 'event') assert.ok(cards.eventDeck[s.event]);
});

test('player colors keep white numbers readable at 4.5:1 contrast or better', () => {
  for (const color of G.colors) {
    const channels = color.slice(1).match(/../g).map(hex => parseInt(hex, 16) / 255)
      .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
    const luminance = channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    assert.ok(1.05 / (luminance + .05) >= 4.5, `${color} has insufficient contrast`);
  }
});

test('dice reject out-of-range input and a second roll before ending the turn', () => {
  const s = fresh();
  for (const dice of [[0, 2], [7, 1], [1.5, 2], [], null]) assert.equal(G.roll(s, dice), false);
  assert.equal(G.roll(s, [1, 2]), true);
  const snapshot = copy(s);
  assert.equal(G.roll(s, [6, 6]), false);
  assert.deepEqual(s, snapshot);
});

test('passing or landing on start pays one salary, once', () => {
  for (const dice of [[1, 1], [1, 2]]) {
    const s = fresh();
    s.players[0].pos = 38;
    G.roll(s, dice);
    assert.equal(s.players[0].cash, 1700);
    assert.equal(s.players[0].pos, dice[0] + dice[1] - 2);
    if (s.phase === 'purchase') G.purchase(s, false);
    G.endTurn(s);
    assert.equal(s.players[0].cash, 1700);
  }
});

test('buy: money is conserved, second submission cannot buy twice', () => {
  const s = fresh();
  landing(s, 3);
  assert.equal(s.phase, 'purchase');
  const before = s.players[0].cash;
  assert.equal(G.purchase(s, true), true);
  assert.equal(s.owners[3], 0);
  assert.equal(s.players[0].cash, before - 160);
  assert.equal(G.worth(s, 0), before);
  assert.equal(G.purchase(s, true), false);
  assert.equal(s.phase, 'end');
});

test('decline leaves a property free and is idempotent', () => {
  const s = fresh();
  landing(s, 6);
  const before = s.players[0].cash;
  assert.equal(G.purchase(s, false), true);
  assert.equal(s.owners[6], null);
  assert.equal(s.players[0].cash, before);
  assert.equal(G.purchase(s, false), false);
});

test('unaffordable property skips purchase and cannot create a negative balance', () => {
  const s = fresh();
  s.players[0].cash = 10;
  landing(s, 6);
  assert.equal(s.phase, 'end');
  assert.equal(G.purchase(s, true), false);
  assert.equal(s.players[0].cash, 10);
});

test('base rent is transferred; own property is free', () => {
  const s = fresh();
  s.owners[3] = 1;
  landing(s, 3);
  assert.equal(s.players[0].cash, 1468);
  assert.equal(s.players[1].cash, 1532);
  s.phase = 'ready';
  s.owners[3] = 0;
  landing(s, 3);
  assert.equal(s.players[0].cash, 1468);
});

test('complete color group doubles rent, one upgrade triples the base', () => {
  const s = fresh();
  s.owners[1] = s.owners[3] = 0;
  assert.ok(G.fullGroup(s, 1));
  assert.equal(G.rent(s, 1), 48);
  assert.equal(G.upgrade(s, 1), true);
  assert.equal(s.players[0].cash, 1440);
  assert.equal(G.rent(s, 1), 72);
  assert.equal(G.upgrade(s, 1), false);
  assert.equal(G.worth(s, 0), 1780);
  s.current = 1;
  landing(s, 1);
  assert.equal(s.players[1].cash, 1428 + 200); // helper crosses start
  assert.equal(s.players[0].cash, 1512);
});

test('upgrade requires full group, ownership, enough cash and management phase', () => {
  const s = fresh();
  s.owners[1] = 0;
  assert.equal(G.upgrade(s, 1), false);
  s.owners[3] = 0;
  s.players[0].cash = 59;
  assert.equal(G.upgrade(s, 1), false);
  s.players[0].cash = 100;
  s.phase = 'event';
  assert.equal(G.upgrade(s, 1), false);
  s.phase = 'ready';
  assert.equal(G.upgrade(s, 6), false);
});

test('selling returns 50% of property and upgrade; breaks group bonus', () => {
  const s = fresh();
  s.owners[1] = s.owners[3] = 0;
  G.upgrade(s, 1);
  assert.equal(G.resale(s, 1), 90);
  assert.equal(G.sell(s, 1), true);
  assert.equal(s.players[0].cash, 1530);
  assert.equal(s.owners[1], null);
  assert.equal(s.upgrades[1], 0);
  assert.equal(G.rent(s, 3), 32);
  assert.equal(G.sell(s, 1), false);
  assert.equal(G.sell(s, 6), false);
});

test('a purchased upgrade remains active if another group property is sold', () => {
  const s = fresh();
  s.owners[1] = s.owners[3] = 0;
  G.upgrade(s, 1);
  G.sell(s, 3);
  assert.equal(G.fullGroup(s, 1), false);
  assert.equal(G.rent(s, 1), 72);
});

test('event has no effect until Continue, and cannot be applied twice', () => {
  const s = fresh();
  landing(s, 4);
  assert.equal(s.phase, 'event');
  assert.equal(s.players[0].cash, 1500);
  assert.equal(G.pendingCard(s).delta, -50);
  const restored = G.restore(JSON.stringify(s));
  assert.ok(restored);
  assert.equal(G.continueEvent(restored), true);
  assert.equal(restored.players[0].cash, 1450);
  assert.equal(G.continueEvent(restored), false);
  assert.equal(restored.players[0].cash, 1450);
});

test('smart working advances three spaces and resolves the destination', () => {
  const s = fresh();
  landing(s, 7);
  assert.equal(s.players[0].pos, 7);
  G.continueEvent(s);
  assert.equal(s.players[0].pos, 10);
  assert.equal(s.players[0].skip, 1);
  assert.equal(s.phase, 'end');
});

test('surprise deck draws each card once before reshuffling, survives reload', () => {
  let s = fresh();
  const drawn = new Set();
  for (let i = 0; i < 4; i++) {
    s.phase = 'ready';
    landing(s, 32);
    drawn.add(s.pending.surprise);
    s = G.restore(s);
    assert.ok(s);
    G.continueEvent(s);
  }
  assert.equal(drawn.size, 4);
  assert.equal(s.deck.length, 0);
  s.phase = 'ready';
  landing(s, 32);
  assert.equal(s.deck.length, 3);
});

test('meeting: skip next roll or pay €50, with no extra lost turn', () => {
  for (const payFee of [false, true]) {
    const s = fresh();
    s.players[0].skip = 1;
    assert.equal(G.roll(s, [1, 1]), false);
    assert.equal(G.meeting(s, payFee), true);
    assert.equal(s.players[0].skip, 0);
    assert.equal(s.players[0].cash, payFee ? 1450 : 1500);
    assert.equal(s.phase, payFee ? 'ready' : 'end');
    assert.equal(G.meeting(s, true), false);
    if (payFee) assert.equal(G.roll(s, [1, 1]), true);
  }
});

test('insufficient funds cannot delegate meeting', () => {
  const s = fresh();
  s.players[0].skip = 1;
  s.players[0].cash = 49;
  assert.equal(G.meeting(s, true), false);
  assert.equal(s.players[0].cash, 49);
  assert.equal(s.players[0].skip, 1);
});

test('debt liquidates the cheapest resale first and pays only actual money', () => {
  const s = fresh(3);
  s.players[0].cash = 0;
  s.owners[1] = s.owners[6] = 0;
  s.owners[39] = 1;
  landing(s, 39);
  assert.equal(s.players[0].cash, 4); // 60 + 100 - 156
  assert.equal(s.players[1].cash, 1656);
  assert.equal(s.owners[1], null);
  assert.equal(s.owners[6], null);
  assert.equal(s.players[0].bankrupt, false);
});

test('rent bankruptcy transfers only the available cash, skips eliminated player', () => {
  const s = fresh(3);
  s.players[0].cash = 10;
  s.owners[39] = 1;
  landing(s, 39);
  assert.equal(s.players[0].cash, 0);
  assert.equal(s.players[1].cash, 1510);
  assert.equal(s.players[0].bankrupt, true);
  assert.equal(s.phase, 'end');
  G.endTurn(s);
  assert.equal(s.current, 1);
  s.phase = 'end'; G.endTurn(s);
  s.phase = 'end'; G.endTurn(s);
  assert.equal(s.current, 1);
  assert.equal(s.round, 2);
});

test('last surviving player wins immediately and gameover is immutable to actions', () => {
  const s = fresh();
  s.players[0].cash = 1;
  s.owners[39] = 1;
  landing(s, 39);
  assert.equal(s.phase, 'gameover');
  assert.deepEqual(s.result.winners, [1]);
  const before = copy(s);
  assert.equal(G.roll(s, [1, 1]), false);
  assert.equal(G.endTurn(s), false);
  assert.equal(G.sell(s, 39), false);
  assert.deepEqual(s, before);
  assert.ok(G.restore(s));
});

test('bankruptcy from a negative event also declares the winner', () => {
  const s = fresh();
  s.players[0].cash = 1;
  landing(s, 4);
  G.continueEvent(s);
  assert.equal(s.phase, 'gameover');
  assert.deepEqual(s.result.winners, [1]);
});

test('round cap gives every surviving player the final turn; value decides winner', () => {
  const s = fresh(3);
  s.round = 12;
  s.players.forEach(p => { p.turns = 11; });
  s.owners[39] = 2;
  for (let i = 0; i < 3; i++) {
    s.phase = 'end';
    G.endTurn(s);
    assert.equal(s.phase, i === 2 ? 'gameover' : 'ready');
  }
  assert.deepEqual(s.result.winners, [2]);
  assert.equal(s.round, 12);
  assert.ok(s.players.every(p => p.turns === 12));
});

test('tie is a shared victory; unlimited mode has no round cap', () => {
  const s = fresh();
  s.round = 12;
  s.players.forEach(p => { p.turns = 11; });
  s.phase = 'end'; G.endTurn(s);
  s.phase = 'end'; G.endTurn(s);
  assert.deepEqual(s.result.winners, [0, 1]);
  const unlimited = fresh(2, 0);
  unlimited.round = 21;
  unlimited.players.forEach(p => { p.turns = 20; });
  unlimited.phase = 'end'; G.endTurn(unlimited);
  unlimited.phase = 'end'; G.endTurn(unlimited);
  assert.equal(unlimited.phase, 'ready');
  assert.equal(unlimited.round, 22);
});

test('rest bonuses are €100 and €150', () => {
  const s = fresh();
  landing(s, 20);
  assert.equal(s.players[0].cash, 1600);
  s.phase = 'ready';
  landing(s, 30);
  assert.equal(s.players[0].cash, 1750);
});

test('renaming preserves state, handles markup as plain text and disallows duplicate names', () => {
  const s = fresh();
  assert.equal(G.rename(s, 0, ' Turi '), false);
  assert.equal(G.rename(s, 0, ''), false);
  assert.equal(G.rename(s, 9, 'Anna'), false);
  assert.equal(G.rename(s, 0, '<b>Gerardo</b>'), true);
  assert.equal(s.players[0].name, '<b>Gerardo</b>');
  assert.equal(G.restore(s).players[0].name, '<b>Gerardo</b>');
});

test('restore rejects corrupt, incompatible and structurally invalid saves', () => {
  for (const bad of [null, '', 'undefined', '{', '[]', '{}', JSON.stringify({ version: 1 })]) assert.equal(G.restore(bad), null);
  const changes = [
    s => { s.current = 99; }, s => { s.players[0].cash = -1; }, s => { s.players[0].pos = 40; },
    s => { s.players[0].name = ''; }, s => { s.owners[2] = 0; }, s => { s.owners[1] = 9; },
    s => { s.upgrades[1] = 1; }, s => { s.phase = 'purchase'; s.pending = 2; },
    s => { s.phase = 'event'; s.pending = { id: '__proto__', surprise: null }; },
    s => { s.phase = 'event'; s.players[0].pos = 32; s.pending = { id: 'chance', surprise: 4 }; },
    s => { s.deck = [1, 1]; }, s => { s.dice = [7, 1]; }, s => { s.phase = 'gameover'; },
    s => { s.notice = null; }, s => { s.log = [null]; }, s => { s.players[0].bankrupt = true; }
  ];
  for (const change of changes) { const s = fresh(); change(s); assert.equal(G.restore(s), null); }
});

test('seeded full games preserve money/ownership/save invariants and finish', () => {
  for (let seed = 1; seed <= 60; seed++) {
    let x = seed;
    const random = () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; };
    let s = fresh(2 + seed % 3);
    let actions = 0;
    while (s.phase !== 'gameover' && actions++ < 1000) {
      if (s.phase === 'ready') {
        if (s.players[s.current].skip) G.meeting(s, false);
        else {
          for (const i of G.owned(s, s.current)) if (random() < .2) G.upgrade(s, i);
          G.roll(s, [1 + Math.floor(random() * 6), 1 + Math.floor(random() * 6)], random);
        }
      } else if (s.phase === 'purchase') G.purchase(s, random() < .85);
      else if (s.phase === 'event') G.continueEvent(s, random);
      else G.endTurn(s);
      assert.ok(s.players.every(p => Number.isSafeInteger(p.cash) && p.cash >= 0));
      const restored = G.restore(s);
      assert.ok(restored, `Save rejected at seed ${seed}, action ${actions}, phase ${s.phase}`);
      assert.deepEqual(restored, s);
      s = restored;
    }
    assert.equal(s.phase, 'gameover', `Seed ${seed} did not finish`);
  }
});
