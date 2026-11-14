import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { AudioManager } from '../src/audio.js';
class FakeAudio {
  constructor() {
    this.volume = 1;
    this.paused = true;
    this.playCalls = 0;
  }
  play() {
    this.paused = false;
    this.playCalls++;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}
globalThis.Audio = FakeAudio;
const managers = [];
const make = (callback = () => {}) => {
  const manager = new AudioManager(callback);
  managers.push(manager);
  return manager;
};
afterEach(() => {
  for (const manager of managers.splice(0)) clearInterval(manager.fade);
});

test('music waits for a gesture and respects mute when selecting tracks', () => {
  const audio = make();
  audio.play(0);
  assert.equal(audio.voices[audio.voice].playCalls, 0);
  audio.unlocked = true;
  audio.muted = true;
  audio.play(1);
  assert.equal(audio.voices[audio.voice].playCalls, 0);
  audio.toggle();
  assert.equal(audio.voices[audio.voice].playCalls, 1);
  assert.equal(audio.voices[audio.voice].volume, audio.volume);
});

test('rapid track changes ignore stale playback failures and ordinary aborts', async () => {
  const notifications = [],
    audio = make((track, index, failed) => notifications.push({ index, failed }));
  audio.unlocked = true;
  audio.voices[1].play = () =>
    Promise.reject(Object.assign(new Error('replaced'), { name: 'AbortError' }));
  audio.play(0);
  await Promise.resolve();
  assert.ok(!notifications.some((n) => n.failed));
  audio.voices[0].play = () => Promise.reject(new Error('old missing recording'));
  audio.play(1);
  audio.play(2);
  await Promise.resolve();
  assert.ok(!notifications.some((n) => n.failed));
  audio.play(3);
  await Promise.resolve();
  assert.deepEqual(notifications.at(-1), { index: 3, failed: true });
});

test('pause ducking and volume updates stop the other voice without losing music selection', () => {
  const audio = make();
  audio.unlocked = true;
  audio.play(5);
  audio.volume = 0.8;
  audio.duck(true);
  assert.equal(audio.voices[audio.voice].volume, 0.2);
  assert.equal(audio.voices[1 - audio.voice].paused, true);
  audio.duck(false);
  assert.equal(audio.voices[audio.voice].volume, 0.8);
  assert.equal(audio.index, 5);
  audio.toggle();
  assert.equal(audio.voices[audio.voice].paused, true);
  assert.equal(audio.voices[audio.voice].volume, 0);
});
