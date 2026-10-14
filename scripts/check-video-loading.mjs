import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const code = fs.readFileSync(new URL('../videos/video-loading.js', import.meta.url), 'utf8');
function scenario(connection, observerSupport = true) {
  const observers = [];
  const videos = [0, 1].map(() => ({
    paused: true, currentTime: 0, preload: 'none', handlers: {},
    addEventListener(name, fn) { this.handlers[name] = fn; },
    getAttribute() { return this.preload; },
    setAttribute(name, value) { assert.equal(name, 'preload'); this.preload = value; },
    play() { throw Error('Preparation must never play a video'); }
  }));
  const window = { navigator: { connection } };
  if (observerSupport) window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.observed = []; observers.push(this); }
    observe(video) { this.observed.push(video); }
    disconnect() { this.disconnected = true; }
  };
  const document = { readyState: 'complete', querySelectorAll: () => videos };
  vm.runInNewContext(code, { window, document });
  return { videos, observers };
}

const normal = scenario({ saveData: false, effectiveType: '4g' });
normal.observers[0].callback(normal.videos.map(target => ({ target, isIntersecting: true })));
assert.deepEqual(normal.videos.map(v => v.preload), ['metadata', 'none']);
assert.equal(normal.observers[0].disconnected, true);
normal.videos[1].handlers.focusin();
assert.equal(normal.videos[1].preload, 'metadata');

for (const connection of [{ saveData: true }, { effectiveType: '2g' }, { effectiveType: 'slow-2g' }]) {
  const limited = scenario(connection);
  assert.equal(limited.observers.length, 0);
  assert(limited.videos.every(v => v.preload === 'none'));
  limited.videos[1].handlers.mouseenter();
  assert.deepEqual(limited.videos.map(v => v.preload), ['none', 'metadata']);
}
const fallback = scenario(undefined, false);
fallback.videos[0].currentTime = 2;
fallback.videos[0].handlers.focusin();
assert.equal(fallback.videos[0].preload, 'none');
fallback.videos[1].handlers.mouseenter();
assert.equal(fallback.videos[1].preload, 'metadata');
console.log('PASS: one visible prefetch, no autoplay, data-saving guard, explicit intent and safe fallback.');
