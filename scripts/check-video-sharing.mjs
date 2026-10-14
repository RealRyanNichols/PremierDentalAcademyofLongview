// Public marketing-video sharing. Student files and private delivery are outside this surface.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = ['01-interview-support', '02-come-back-for-practice', '03-unexpected-career', '04-whats-holding-you-back', '05-practical-dental-skills', '06-flexible-learning-support', '07-from-assistant-to-owner', '08-beyond-the-classroom', '09-starting-your-dental-career', '10-meet-amanda-premier-dental'];
const files = ['videos/index.html', ...ids.map(id => `videos/${id}/index.html`), 'index.html', 'about.html', 'classes.html', 'enroll.html', 'tools/index.html'];
let players = 0, groups = 0;
const base = 'https://www.premierdentalacademyoflongview.com';
for (const file of files) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert(!/<a\b[^>]*href="[^\"]+\.(?:mp4|srt|vtt|zip)(?:[?#][^\"]*)?"/i.test(html), `${file}: public file link`);
  assert(!/Download (?:MP4|this video|all 10|Amanda)|Captions (?:SRT|VTT)|download the complete video library|id="zip-download"/i.test(html), `${file}: download copy`);
  assert(html.includes('/videos/video-sharing.js?v=20261013'), file);
  assert(html.includes('/videos/video-sharing.css?v=20261013'), file);
  for (const video of html.matchAll(/<video\b[^>]*data-pda-video-id="[^"]+"[^>]*>(.*?)<\/video>/gis)) {
    players++;
    assert(/controlslist="nodownload"/i.test(video[0]), `${file}: native save control`);
    assert(/<source[^>]*\.mp4"/i.test(video[1]), `${file}: playable media missing`);
    assert([...video[1].matchAll(/<track\b[^>]*>/gi)].some(track => /\.vtt"/i.test(track[0]) && /kind="captions"/i.test(track[0])), `${file}: captions missing`);
  }
  for (const group of html.matchAll(/data-pda-share-id="([^"]+)"/g)) {
    groups++;
    assert(ids.includes(group[1]), `${file}: unknown share id`);
    assert(html.includes(`value="${base}/videos/${group[1]}/"`), `${file}: canonical link missing`);
  }
  if (file.startsWith('videos/') && file !== 'videos/index.html') {
    assert(html.includes('id="transcript-title"'), `${file}: transcript missing`);
    assert(html.includes('data-pda-video-cta="enroll"'), `${file}: enrollment path missing`);
  }
}
assert.equal(players, 28);
assert.equal(groups, 20);
const script = fs.readFileSync(path.join(root, 'videos/video-sharing.js'), 'utf8');
function fixture(navigator, id = ids[3]) {
  const handlers = {}, videoHandlers = {}, statuses = { textContent: '' }, fallback = { hidden: true };
  const field = { value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const buttons = ['share', 'copy', 'select'].map(action => ({ dataset: { pdaShareAction: action }, disabled: false, addEventListener(name, fn) { handlers[action] = fn; } }));
  const group = { dataset: { pdaShareId: id, pdaShareTitle: 'What is holding you back?' }, querySelector(selector) { return selector === '[data-pda-share-status]' ? statuses : selector === '[data-pda-share-fallback]' ? fallback : field; }, querySelectorAll() { return buttons; } };
  const video = { addEventListener(name, fn) { videoHandlers[name] = fn; } };
  const document = { readyState: 'complete', querySelectorAll(selector) { return selector === 'video[data-pda-video-id]' ? [video] : [group]; } };
  const window = {};
  vm.runInNewContext(script, { document, window, navigator });
  return { handlers, videoHandlers, statuses, fallback, field, buttons };
}
let shared;
let test = fixture({ share: async value => { shared = value; } });
await test.handlers.share();
assert.deepEqual(JSON.parse(JSON.stringify(shared)), { title: 'What is holding you back?', url: `${base}/videos/${ids[3]}/` });
assert(!('files' in shared));
assert.equal(test.buttons[0].disabled, false);
let copied;
test = fixture({ clipboard: { writeText: async value => { copied = value; } } });
await test.handlers.share();
assert.equal(copied, `${base}/videos/${ids[3]}/`);
assert.equal(test.statuses.textContent, 'Video link copied.');
test = fixture({ clipboard: { writeText: async () => { throw Error('blocked'); } } });
await test.handlers.copy();
assert.equal(test.fallback.hidden, false);
assert.equal(test.field.value, `${base}/videos/${ids[3]}/`);
assert(test.field.focused && test.field.selected);
test = fixture({ share: async () => { const error = Error('cancelled'); error.name = 'AbortError'; throw error; } });
await test.handlers.share();
assert.equal(test.fallback.hidden, true);
assert.equal(test.statuses.textContent, '');
test = fixture({ share: async () => { throw Error('unavailable'); } });
await test.handlers.share();
assert.equal(test.fallback.hidden, false);
let prevented = false;
test.videoHandlers.contextmenu({ preventDefault() { prevented = true; } });
assert(prevented);
test = fixture({}, 'private-job-id');
assert.deepEqual(Object.keys(test.handlers), []);
console.log('PASS: 28 public players, 20 canonical sharing groups, no public file/save links; native share, clipboard fallback, cancellation and scoped context-menu checks.');
