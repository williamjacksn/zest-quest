import { TRACKS } from './data.js';
export class AudioManager {
  constructor(onTrack) {
    this.onTrack = onTrack;
    this.index = -1;
    this.volume = 0.6;
    this.fxVolume = 0.55;
    this.muted = false;
    this.unlocked = false;
    this.ducked = false;
    this.voices = [new Audio(), new Audio()];
    this.voice = 0;
    for (const audio of this.voices) {
      audio.loop = true;
      audio.preload = 'none';
    }
  }
  unlock() {
    this.unlocked = true;
    try {
      this.context ??= new (window.AudioContext || window.webkitAudioContext)();
      this.context.resume().catch(() => {});
    } catch {
      /* Music still works without synthesized effects. */
    }
  }
  play(index) {
    if (index === this.index) {
      if (this.unlocked && !this.muted) this.voices[this.voice].play().catch(() => {});
      return;
    }
    this.index = index;
    this.onTrack(TRACKS[index], index);
    this.voice = 1 - this.voice;
    const active = this.voices[this.voice],
      old = this.voices[1 - this.voice];
    active.src = TRACKS[index].src;
    active.volume = 0;
    if (this.unlocked && !this.muted)
      active.play().catch((error) => {
        // Replacing a recording can abort its pending play promise normally.
        if (this.index === index && error?.name !== 'AbortError')
          this.onTrack(TRACKS[index], index, true);
      });
    clearInterval(this.fade);
    let progress = 0;
    const start = old.volume;
    this.fade = setInterval(() => {
      progress = Math.min(1, progress + 0.075);
      active.volume = this.targetVolume * progress;
      old.volume = start * (1 - progress);
      if (progress === 1) {
        clearInterval(this.fade);
        old.pause();
      }
    }, 40);
  }
  get targetVolume() {
    return this.muted ? 0 : this.volume * (this.ducked ? 0.25 : 1);
  }
  update() {
    clearInterval(this.fade);
    const active = this.voices[this.voice];
    active.volume = this.targetVolume;
    this.voices[1 - this.voice].pause();
    if (this.muted) active.pause();
    else if (this.unlocked && this.index >= 0) active.play().catch(() => {});
  }
  toggle() {
    this.muted = !this.muted;
    this.update();
  }
  duck(value) {
    this.ducked = value;
    this.update();
  }
  fx(kind) {
    if (!this.context || this.muted || !this.fxVolume) return;
    const c = this.context,
      now = c.currentTime;
    const sounds = {
      jump: [290, 510, 0.08, 'sine', 0.06],
      doubleJump: [500, 900, 0.12, 'sine', 0.08],
      bounce: [200, 750, 0.2, 'triangle', 0.08],
      shoot: [420, 200, 0.045, 'triangle', 0.04],
      dash: [180, 55, 0.18, 'sawtooth', 0.055],
      pulse: [110, 450, 0.3, 'sine', 0.11],
      sample: [600, 1200, 0.3, 'sine', 0.12],
      hurt: [110, 45, 0.15, 'square', 0.065],
      pickup: [850, 1150, 0.055, 'sine', 0.035],
      kill: [160, 60, 0.055, 'triangle', 0.025],
    };
    const [start, end, duration, type, volume] = sounds[kind] || sounds.pickup;
    const oscillator = c.createOscillator(),
      gain = c.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(start, now);
    oscillator.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(volume * this.fxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain);
    gain.connect(c.destination);
    oscillator.start();
    oscillator.stop(now + duration);
  }
}
