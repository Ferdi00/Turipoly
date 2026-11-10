(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TuripolyMotion = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function route(from, steps, size = 40) {
    if (!Number.isInteger(size) || size < 1 || !Number.isInteger(from) || from < 0 || from >= size || !Number.isInteger(steps) || steps < 0 || steps > size * 2) return [];
    return Array.from({ length: steps }, (_, i) => (from + i + 1) % size);
  }

  function travelDuration(steps) { return Math.min(1000, Math.max(240, steps * 80)); }

  class Director {
    constructor(enabled = () => true) {
      this.enabled = enabled;
      this.active = new Set();
    }

    async play(node, keyframes, options = {}) {
      if (!node?.animate || !this.enabled()) return;
      let animation;
      try {
        animation = node.animate(keyframes, { duration: 250, easing: 'cubic-bezier(.16, 1, .3, 1)', ...options });
        this.active.add(animation);
        await animation.finished;
      } catch {
        // Cancellation and unsupported effects must never block a turn.
      } finally {
        if (animation) { this.active.delete(animation); animation.cancel(); }
      }
    }

    cancel() {
      for (const animation of this.active) animation.cancel();
      this.active.clear();
    }

    async travel(board, token, tiles, indices, color) {
      if (!this.enabled() || !token?.isConnected || !indices.length) return;
      const boardRect = board.getBoundingClientRect();
      const start = token.getBoundingClientRect();
      const scale = boardRect.width / board.offsetWidth || 1;
      const bounds = indices.map(i => tiles[i].node.getBoundingClientRect());
      const ghost = token.cloneNode(true);
      ghost.classList.add('travel-token');
      ghost.removeAttribute('aria-label');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.style.width = `${start.width / scale}px`;
      ghost.style.height = `${start.height / scale}px`;
      ghost.style.setProperty('--player-color', color);
      const point = (x, y) => `translate(${x}px, ${y}px)`;
      let x = (start.left - boardRect.left) / scale;
      let y = (start.top - boardRect.top) / scale;
      const frames = [{ transform: point(x, y), offset: 0 }];
      bounds.forEach((rect, i) => {
        const nextX = (rect.left + rect.width / 2 - boardRect.left - start.width / 2) / scale;
        const nextY = (rect.bottom - boardRect.top - start.height - 3) / scale;
        frames.push({ transform: point((x + nextX) / 2, (y + nextY) / 2 - 5), offset: (i + .5) / bounds.length });
        frames.push({ transform: point(nextX, nextY), offset: (i + 1) / bounds.length });
        x = nextX;
        y = nextY;
      });
      token.style.visibility = 'hidden';
      for (const i of indices) tiles[i].node.classList.add('on-route');
      board.append(ghost);
      try { await this.play(ghost, frames, { duration: travelDuration(indices.length), easing: 'linear' }); }
      finally {
        token.style.visibility = '';
        ghost.remove();
        for (const i of indices) tiles[i].node.classList.remove('on-route');
      }
    }
  }

  return { route, travelDuration, Director };
});
