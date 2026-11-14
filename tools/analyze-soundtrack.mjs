import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { MPEGDecoder } from 'mpg123-decoder';

// Decode the actual recordings rather than infer their character from titles.
const directory = 'Lemonectric - Zest Quest';
const files = (await readdir(directory))
  .filter((f) => f.endsWith('.mp3'))
  .sort((a, b) => Number(a.match(/ - (\d\d) /)[1]) - Number(b.match(/ - (\d\d) /)[1]));
const analysis = [];
for (const file of files) {
  const decoder = new MPEGDecoder();
  await decoder.ready;
  const result = decoder.decode(new Uint8Array(await readFile(`${directory}/${file}`)));
  const pcm = result.channelData[0],
    sr = result.sampleRate;
  const hop = Math.round(sr / 50),
    envelope = [];
  let squareSum = 0,
    crosses = 0,
    peak = 0;
  for (let i = 0; i < pcm.length; i++) {
    const sample = pcm[i];
    squareSum += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
    if (i && sample > 0 !== pcm[i - 1] > 0) crosses++;
  }
  for (let i = 0; i < pcm.length - hop; i += hop) {
    let energy = 0;
    for (let j = i; j < i + hop; j += 8) energy += pcm[j] ** 2;
    envelope.push(Math.sqrt(energy / (hop / 8)));
  }
  const onset = envelope.map((e, i) => Math.max(0, e - (envelope[i - 1] || e)));
  const candidates = [];
  for (let lag = 17; lag <= 50; lag++) {
    let corr = 0;
    for (let i = lag; i < onset.length; i++) corr += onset[i] * onset[i - lag];
    candidates.push({ bpm: Math.round(3000 / lag), score: corr });
  }
  candidates.sort((a, b) => b.score - a.score);
  analysis.push({
    track: Number(file.match(/ - (\d\d) /)[1]),
    title: file.replace(/^.* - \d\d /, '').replace('.mp3', ''),
    seconds: +(pcm.length / sr).toFixed(2),
    sampleRate: sr,
    rms: +Math.sqrt(squareSum / pcm.length).toFixed(4),
    peak: +peak.toFixed(4),
    zeroCrossingsPerSecond: Math.round(crosses / (pcm.length / sr)),
    pulseCandidates: candidates.slice(0, 3).map((c) => c.bpm),
    decodeErrors: result.errors.length,
  });
  console.log(JSON.stringify(analysis.at(-1)));
  decoder.free();
}
await mkdir('docs', { recursive: true });
await writeFile('docs/soundtrack-analysis.json', JSON.stringify(analysis, null, 2) + '\n');
